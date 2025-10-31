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

// Event validation rules
export const validateCreateEvent: ValidationChain[] = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Event name is required')
    .isLength({ max: 255 })
    .withMessage('Event name must not exceed 255 characters'),
  body('description')
    .optional()
    .trim(),
  body('eventDate')
    .notEmpty()
    .withMessage('Event date is required')
    .isISO8601()
    .withMessage('Invalid date format'),
  body('location')
    .trim()
    .notEmpty()
    .withMessage('Location is required')
    .isLength({ max: 255 })
    .withMessage('Location must not exceed 255 characters'),
  body('address')
    .optional()
    .trim(),
  body('capacity')
    .notEmpty()
    .withMessage('Capacity is required')
    .isInt({ min: 1 })
    .withMessage('Capacity must be a positive integer'),
  body('price')
    .notEmpty()
    .withMessage('Price is required')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
];

export const validateUpdateEvent: ValidationChain[] = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Invalid event ID'),
  body('name')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Event name must not exceed 255 characters'),
  body('eventDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format'),
  body('location')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Location must not exceed 255 characters'),
  body('capacity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Capacity must be a positive integer'),
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean'),
];

// Order validation rules
export const validateCreateOrder: ValidationChain[] = [
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
  body('tickets')
    .isArray({ min: 1 })
    .withMessage('At least one ticket is required'),
  body('tickets.*.event_id')
    .isInt({ min: 1 })
    .withMessage('Invalid event ID'),
  body('tickets.*.attendee_name')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Attendee name must not exceed 255 characters'),
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
