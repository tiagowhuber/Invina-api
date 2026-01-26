import moment from 'moment';
import Holiday from '../models/Holiday';
import TourInstance from '../models/TourInstance';
import Tour from '../models/Tour';

export class AvailabilityService {
  /**
   * Calculate available start times for a given tour on a specific date.
   */
  async getSlots(date: string, tourId: number): Promise<string[]> {
    // 1. Holiday Check
    const holiday = await Holiday.findOne({ where: { holidayDate: date } });
    if (holiday) {
      return []; // Date is a holiday, no slots.
    }

    const requestedTour = await Tour.findByPk(tourId);
    if (!requestedTour) {
      throw new Error('Tour not found');
    }

    // 2. Day-Lock Check (Special Tours in the system for this day)
    // We need to check if *any* Special Tour instance exists on this day.
    const allInstancesOnDate = await TourInstance.findAll({
      where: { instanceDate: date },
      include: [{ model: Tour }]
    });

    const specialInstance = allInstancesOnDate.find(i => i.tour.tourType === 'Special');

    if (specialInstance) {
      // Logic: If a Special Tour instance already exists, the day is locked to THAT instance.
      // But only if the user is requesting specific slots for THAT tour?
      // "Result: Users can only join that specific existing instance... No new start times are valid."
      
      // If the user is asking for availability for the SAME tour as the special instance,
      // and it's not full, return that instance's start time as the only option.
      if (specialInstance.tourId === tourId) {
        if (specialInstance.currentAttendants < specialInstance.tour.maxAttendants) {
          return [specialInstance.startTime]; // e.g., ['12:00:00']
        }
      }
      return []; // Day locked by another Special Tour or this one is full.
    }

    // If the requested tour ITSELF is Special, and we are here, it means no Special Tour exists yet.
    // So we can schedule it? 
    // Wait, "Standard Tours (Buffer Logic): If no Special Tour exists..."
    // Implicitly, if I want to book a Special Tour and the day is empty, I probably can pick a time (constrained by specific rules? "Available every day").
    
    // However, if there are ALREADY Standard Tours booked, can I book a Special Tour?
    // "Rule: If Client A books a Special Tour... the entire rest of Monday becomes unavailable."
    // "Rule: If Client B wants to book a Standard Tour..." (implied: if Special exists, no Standard).
    // Conversely, if Standard exists, can Special be booked?
    // Usually Special implies exclusivity. If Standard exist, Special likely unavailable or blocks them?
    // The prompt says: "If a Special Tour instance already exists... entire day is locked".
    // It doesn't explicitly say "If Standard exists, Special is blocked".
    // But let's assume if there are ANY instances, and likely Special requires exclusivity, maybe it's blocked?
    // Let's stick strictly to: "If no Special Tour exists, retrieve all standard tour_instances..."
    // If I am requesting a Special Tour, and there are NO instances at all, I can likely pick any time.
    // If there are Standard instances, the prompt doesn't explicitly forbid Special.
    // But Special Tour rule says "Day Lock". If Standard tours are running, they might conflict?
    // Given the ambiguity, I will assume:
    // If Special instance exists -> Lock.
    // If Standard instance exists -> Apply Buffer Logic generally.

    // 3. Buffer Calculation (Standard Tours logic applied to ANY new slot generation really)
    // "For every existing instance, calculate the Blocked Window"
    
    const possibleSlots: string[] = [];
    const increment = 30; // minutes
    
    // Generate base slots from earliest to latest
    const start = moment(`${date} ${requestedTour.earliestHour}`, 'YYYY-MM-DD HH:mm:ss');
    const end = moment(`${date} ${requestedTour.latestHour}`, 'YYYY-MM-DD HH:mm:ss');
    
    let current = start.clone();
    while (current.isSameOrBefore(end)) {
      possibleSlots.push(current.format('HH:mm:ss'));
      current.add(increment, 'minutes');
    }

    // Filter slots based on Blocked Windows of EXISTING instances (Standard or otherwise)
    // We already have `allInstancesOnDate`.
    // Valid Slot: Not inside any [Start - (Dur+Buf)] <-> [Start + (Dur+Buf)]
    
    const validSlots = possibleSlots.filter(slotTime => {
      const slotMoment = moment(`${date} ${slotTime}`, 'YYYY-MM-DD HH:mm:ss');
      
      // Check collision with every existing instance
      for (const instance of allInstancesOnDate) {
        const iStart = moment(`${date} ${instance.startTime}`, 'YYYY-MM-DD HH:mm:ss');
        // Instance duration + buffer
        const buffer = instance.tour.bufferMinutes || 60;
        const duration = instance.tour.durationMinutes; // Note: Current logic instructions say "Duration + Buffer"
        
        // "Blocked Window: [Start Time - (Duration + Buffer)] <-> [Start Time + (Duration + Buffer)]"
        // Wait, normally it's [Start - Buffer, End + Buffer].
        // The instruction says strictly: [Start - (Duration + Buffer)] ... [Start + (Duration + Buffer)]
        // This is a VERY wide window. 
        // Example: Tour 11:00, Dur 60, Buf 60.
        // Start = 11:00.
        // Lower Bound = 11:00 - (120 min) = 09:00.
        // Upper Bound = 11:00 + (120 min) = 13:00.
        // So 09:00 to 13:00 is blocked? 
        // 11:00 instance finishes at 12:00. Next earliest 13:00. (1 hour gap). Correct.
        // Previous instance could finish at 10:00 (starts 09:00). 1 hour gap to 11:00. Correct.
        // The formula seems to center on the Start Time.
        // Okay, I will implement exactly "Start Time +/- (Duration + Buffer)"
        
        const offsetMinutes = duration + buffer;
        const lowerBound = iStart.clone().subtract(offsetMinutes, 'minutes');
        const upperBound = iStart.clone().add(offsetMinutes, 'minutes');
        
        // "Any potential new start time falling inside this window is invalid."
        if (slotMoment.isAfter(lowerBound) && slotMoment.isBefore(upperBound)) {
           // However, if the slot matches the EXISITING instance exactly, 
           // and it is the SAME tour, we might be able to JOIN it (Order).
           // But this method returns "Available Start Times". 
           // Usually "Get Slots" implies new or existing.
           // If slot == instance.startTime, we check capacity.
           if (slotTime === instance.startTime && instance.tourId === tourId) {
              if (instance.currentAttendants >= instance.tour.maxAttendants) {
                return false; // Full
              }
              // It's valid (can join)
              return true;
           }
           return false; // Blocked
        }
      }
      return true;
    });

    return validSlots;
  }
}
