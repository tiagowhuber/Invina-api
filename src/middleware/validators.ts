import { body, param, validationResult, ValidationChain } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

// Middleware to check validation results
export const validate = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: errors.array(),
    });
    return;
  }
  next();
};

// Booking validation rules
export const validateBookingRequest: ValidationChain[] = [
  body('tour_id')
    .notEmpty()
    .withMessage('Tour ID is required')
    .isInt({ min: 1 })
    .withMessage('Invalid tour ID'),
  body('instance_date')
    .notEmpty()
    .withMessage('Instance date is required')
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('Invalid date format. Use YYYY-MM-DD'),
  body('instance_time')
    .notEmpty()
    .withMessage('Instance time is required')
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage('Invalid time format. Use HH:MM (24-hour format)'),
  body('ticket_quantity')
    .notEmpty()
    .withMessage('Ticket quantity is required')
    .isInt({ min: 1 })
    .withMessage('Ticket quantity must be at least 1'),
  body('wine_ids')
    .optional()
    .isArray()
    .withMessage('Wine IDs must be an array'),
  body('wine_ids.*')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Invalid wine ID'),
  body('customer_name')
    .trim()
    .notEmpty()
    .withMessage('Customer name is required')
    .isLength({ max: 255 })
    .withMessage('Customer name must not exceed 255 characters'),
  body('customer_email')
    .trim()
    .notEmpty()
    .withMessage('Customer email is required')
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),
  body('customer_phone')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Phone number must not exceed 50 characters'),
];

// Tour query validation
export const validateAvailabilityQuery: ValidationChain[] = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Invalid tour ID'),
];

// WebPay validation rules
export const validateInitiatePayment: ValidationChain[] = [
  body('order_id')
    .notEmpty()
    .withMessage('Order ID is required')
    .isInt({ min: 1 })
    .withMessage('Invalid order ID'),
];

export const validateConfirmPayment: ValidationChain[] = [
  body('token')
    .notEmpty()
    .withMessage('Token is required')
    .trim(),
];

// Ticket validation rules
export const validateUpdateAttendee: ValidationChain[] = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Invalid ticket ID'),
  body('attendee_name')
    .trim()
    .notEmpty()
    .withMessage('Attendee name is required')
    .isLength({ max: 255 })
    .withMessage('Attendee name must not exceed 255 characters'),
];

// ID parameter validation
export const validateId: ValidationChain[] = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Invalid ID'),
];
