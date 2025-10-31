import { Request, Response, NextFunction } from 'express';

interface DatabaseError extends Error {
  code?: string;
}

/**
 * Global error handler middleware
 */
export const errorHandler = (err: DatabaseError, req: Request, res: Response, _next: NextFunction): void => {
  // Log error for debugging
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
  });

  // PostgreSQL errors
  if (err.code) {
    switch (err.code) {
      case '23505': // Unique violation
        res.status(409).json({
          success: false,
          message: 'Duplicate entry. This record already exists.',
          error: process.env.NODE_ENV === 'development' ? err.message : undefined,
        });
        return;
      
      case '23503': // Foreign key violation
        res.status(400).json({
          success: false,
          message: 'Invalid reference. Related record does not exist.',
          error: process.env.NODE_ENV === 'development' ? err.message : undefined,
        });
        return;
      
      case '23502': // Not null violation
        res.status(400).json({
          success: false,
          message: 'Missing required field.',
          error: process.env.NODE_ENV === 'development' ? err.message : undefined,
        });
        return;
      
      case '22P02': // Invalid text representation
        res.status(400).json({
          success: false,
          message: 'Invalid data format.',
          error: process.env.NODE_ENV === 'development' ? err.message : undefined,
        });
        return;
    }
  }

  // WebPay/Transbank errors
  if (err.name === 'TransbankError' || err.message?.includes('Transbank')) {
    res.status(502).json({
      success: false,
      message: 'Payment gateway error. Please try again.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
    return;
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: (err as any).errors,
    });
    return;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      message: 'Invalid token',
    });
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      message: 'Token expired',
    });
    return;
  }

  // Default error response
  const statusCode = (err as any).statusCode || (err as any).status || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    success: false,
    message: message,
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
  });
};
