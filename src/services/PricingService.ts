import Tour from '../models/Tour';

const DISCOUNT_THRESHOLD = parseInt(process.env.DISCOUNT_THRESHOLD_TICKETS || '5');
const DISCOUNT_RATE = parseFloat(process.env.DISCOUNT_RATE || '0.10');

export class PricingService {
  /**
   * Calculate total price for an order
   */
  async calculatePrice(tourId: number, attendeesCount: number): Promise<number> {
    const tour = await Tour.findByPk(tourId);
    if (!tour) throw new Error('Tour not found');

    let total = tour.basePrice * attendeesCount;

    if (attendeesCount >= DISCOUNT_THRESHOLD) {
      total = total * (1 - DISCOUNT_RATE);
    }
    
    // Round to 2 decimals
    return Math.round(total * 100) / 100;
  }
}
