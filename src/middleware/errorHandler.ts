/**
 * Error Handling Middleware
 * 
 * Centralized error handling for the Express application.
 * Provides consistent error responses and logging.
 */

import { Request, Response, NextFunction } from 'express';
import { isProduction } from '../config/env';

/**
 * Custom error class with status code
 */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational: boolean = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error response structure
 */
interface ErrorResponse {
  status: 'error' | 'fail';
  message: string;
  stack?: string;
  error?: any;
}

/**
 * Global error handling middleware
 * Must be defined with 4 parameters to be recognized as error handler
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Default to 500 server error
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const message = err.message || 'Internal Server Error';
  
  // Log error details
  console.error('Error occurred:', {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    statusCode,
    message,
    stack: err.stack,
  });
  
  // Prepare error response
  const errorResponse: ErrorResponse = {
    status: statusCode >= 500 ? 'error' : 'fail',
    message,
  };
  
  // Include stack trace in development
  if (!isProduction) {
    errorResponse.stack = err.stack;
    errorResponse.error = err;
  }
  
  res.status(statusCode).json(errorResponse);
};

/**
 * 404 Not Found handler
 * Should be placed after all routes
 */
export const notFoundHandler = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const error = new AppError(
    404,
    `Route ${req.method} ${req.path} not found`
  );
  next(error);
};

