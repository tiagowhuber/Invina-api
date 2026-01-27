import Tour from '../models/Tour';
import Menu from '../models/Menu';

const DISCOUNT_THRESHOLD = parseInt(process.env.DISCOUNT_THRESHOLD_TICKETS || '5');
const DISCOUNT_RATE = parseFloat(process.env.DISCOUNT_RATE || '0.10');

export class PricingService {
  /**
   * Calculate total price for an order
   */
  async calculatePrice(tourId: number, attendeesCount: number, menuId?: number): Promise<number> {
    const tour = await Tour.findByPk(tourId);
    if (!tour) throw new Error('Tour not found');

    let unitPrice = tour.basePrice;

    if (menuId) {
       const menu = await Menu.findByPk(menuId);
       if (!menu || menu.tourId !== tourId) {
          throw new Error('Invalid menu for this tour');
       }
       unitPrice = menu.price;
    }

    let total = unitPrice * attendeesCount;

    if (attendeesCount >= DISCOUNT_THRESHOLD) {
      total = total * (1 - DISCOUNT_RATE);
    }
    
    // Round to 2 decimals
    return Math.round(total * 100) / 100;
  }
}
