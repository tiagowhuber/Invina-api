import { Request, Response } from 'express';
import Tour from '../models/Tour';
import Wine from '../models/Wine';
import TourWine from '../models/TourWine';
import TourInstance from '../models/TourInstance';
import { ApiResponse, TourInstanceAvailability } from '../types';

// Get all active tours
export const getAllTours = async (_req: Request, res: Response): Promise<void> => {
  try {
    const tours = await Tour.findAll({
      where: { is_active: true },
      order: [['name', 'ASC']],
    });

    const response: ApiResponse = {
      success: true,
      data: tours,
    };

    res.json(response);
  } catch (error: any) {
    console.error('Error fetching tours:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch tours',
    };
    res.status(500).json(response);
  }
};

// Get a single tour by ID
export const getTourById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const tour = await Tour.findOne({
      where: { id, is_active: true },
    });

    if (!tour) {
      const response: ApiResponse = {
        success: false,
        error: 'Tour not found',
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse = {
      success: true,
      data: tour,
    };

    res.json(response);
  } catch (error: any) {
    console.error('Error fetching tour:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch tour',
    };
    res.status(500).json(response);
  }
};

// Get available wines for a tour
export const getTourWines = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // First check if tour exists and is active
    const tour = await Tour.findOne({
      where: { id, is_active: true },
    });

    if (!tour) {
      const response: ApiResponse = {
        success: false,
        error: 'Tour not found',
      };
      res.status(404).json(response);
      return;
    }

    // Get wines for this tour
    const tourWines = await TourWine.findAll({
      where: { tour_id: id },
      include: [
        {
          model: Wine,
          where: { is_active: true },
          required: true,
        },
      ],
      order: [['display_order', 'ASC']],
    });

    const wines = tourWines.map((tw: any) => tw.Wine);

    const response: ApiResponse = {
      success: true,
      data: wines,
    };

    res.json(response);
  } catch (error: any) {
    console.error('Error fetching tour wines:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch tour wines',
    };
    res.status(500).json(response);
  }
};

// Get availability for a tour on a specific date
export const getAvailability = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { date } = req.query;

    if (!date || typeof date !== 'string') {
      const response: ApiResponse = {
        success: false,
        error: 'Date parameter is required (YYYY-MM-DD format)',
      };
      res.status(400).json(response);
      return;
    }

    // Check if tour exists and is active
    const tour = await Tour.findOne({
      where: { id, is_active: true },
    });

    if (!tour) {
      const response: ApiResponse = {
        success: false,
        error: 'Tour not found',
      };
      res.status(404).json(response);
      return;
    }

    // Get existing tour instances for this tour and date
    const instances = await TourInstance.findAll({
      where: {
        tour_id: id,
        instance_date: date,
        status: 'active',
      },
      order: [['instance_time', 'ASC']],
    });

    // Calculate availability for each instance
    const availability: TourInstanceAvailability[] = instances.map((instance) => ({
      instance_time: instance.instance_time,
      capacity: instance.capacity,
      tickets_sold: instance.tickets_sold,
      tickets_available: instance.capacity - instance.tickets_sold,
      instance_id: instance.id,
    }));

    const response: ApiResponse = {
      success: true,
      data: {
        tour_id: tour.id,
        tour_name: tour.name,
        tour_type: tour.tour_type,
        date: date,
        min_tickets: tour.min_tickets,
        max_capacity: tour.max_capacity,
        base_price: tour.base_price,
        availability: availability,
      },
    };

    res.json(response);
  } catch (error: any) {
    console.error('Error fetching availability:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch availability',
    };
    res.status(500).json(response);
  }
};
