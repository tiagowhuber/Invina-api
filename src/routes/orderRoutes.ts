import { Router } from 'express';
import { body } from 'express-validator';
import { OrderController } from '../controllers/OrderController';
import Tour from '../models/Tour';
import moment from 'moment';

const router = Router();
const controller = new OrderController();

const validateOrder = [
  body('tourId').isInt().withMessage('Tour ID must be an integer'),
  body('date').isISO8601().withMessage('Invalid date format'),
  body('time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/).withMessage('Invalid time format'),
  body('customerName').notEmpty().withMessage('Name is required'),
  body('customerRut').notEmpty().withMessage('RUT is required'),
  body('customerEmail').isEmail().withMessage('Invalid email'),
  body('attendeesCount').isInt({ min: 1 }).withMessage('Attendees must be at least 1'),
  
  // Custom Validators
  body('date').custom(async (value, { req }) => {
     const tour = await Tour.findByPk(req.body.tourId);
     if (tour && tour.tourType === 'Standard') {
       // Moment day(): 0 = Sunday, 1 = Monday ... 6 = Saturday
       const day = moment(value).day(); 
       if (day === 0) {
         throw new Error('Standard tours are only available Mon-Sat');
       }
     }
     return true;
  }),
  
  body('time').custom(async (value, { req }) => {
     const tour = await Tour.findByPk(req.body.tourId);
     if(tour) {
        // Simple string comparison for HH:mm:ss works if format is consistent
        // Ensure values are comparable
        if(value < tour.earliestHour || value > tour.latestHour) {
            throw new Error(`Time must be between ${tour.earliestHour} and ${tour.latestHour}`);
        }
     }
     return true;
  })
];

router.post('/', validateOrder, controller.createOrder);

export default router;
