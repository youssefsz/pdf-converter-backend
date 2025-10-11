/**
 * Async Handler Utility
 * 
 * Wraps async route handlers to catch errors and pass them to Express error middleware.
 * This eliminates the need for try-catch blocks in every async route handler.
 */

import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Type definition for async request handlers
 */
type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<any>;

/**
 * Wraps an async route handler to catch any errors and pass them to next()
 * 
 * @param fn - The async route handler function
 * @returns Express middleware function
 * 
 * @example
 * app.get('/users', asyncHandler(async (req, res) => {
 *   const users = await getUsersFromDB();
 *   res.json(users);
 * }));
 */
export const asyncHandler = (fn: AsyncRequestHandler): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

