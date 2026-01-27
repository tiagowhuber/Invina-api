import { Request, Response } from 'express';
import { AvailabilityService } from '../services/AvailabilityService';
import Tour from '../models/Tour';
import Wine from '../models/Wine';
import TourImage from '../models/TourImage';
import Menu from '../models/Menu';

export class TourController {
  private availabilityService = new AvailabilityService();

  getAllTours = async (_req: Request, res: Response) => {
    try {
        const tours = await Tour.findAll({ 
          where: { isActive: true },
          include: [
            Wine,
            { model: TourImage, as: 'images' },
            { model: Menu, include: [Wine], required: false }
          ],
          order: [
             ['id', 'ASC'],
             [{ model: TourImage, as: 'images' }, 'displayOrder', 'ASC']
          ]
        });
        res.json(tours);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
  };

  getSlots = async (req: Request, res: Response) => {
    // query: date, tourId
    const { date, tourId } = req.query;
    if (!date || !tourId) {
        res.status(400).json({ error: 'Missing parameters: date, tourId' });
        return;
    }
    
    try {
      const slots = await this.availabilityService.getSlots(date as string, parseInt(tourId as string));
      res.json(slots);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };
}
