import { Request, Response, NextFunction } from 'express';
import { expireOldOrders } from '../utils/cronJobs';

export const adminController = {
  // POST /api/admin/expire-orders - Manually trigger order expiration
  async expireOrders(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await expireOldOrders();
      
      res.json({
        success: true,
        message: 'Order expiration completed',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/admin/health - Admin health check
  async healthCheck(_req: Request, res: Response): Promise<void> {
    res.json({
      success: true,
      message: 'Admin API is operational',
      timestamp: new Date().toISOString(),
    });
  },
};
