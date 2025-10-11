/**
 * Routes Index
 * 
 * Central routing configuration for the application.
 */

import { Router } from 'express';
import { healthRouter } from './health.routes';
import { pdfRouter } from './pdf.routes';

/**
 * Main router that combines all route modules
 */
export const createRouter = (): Router => {
  const router = Router();
  
  // Health check and basic routes
  router.use('/health', healthRouter);
  
  // PDF conversion routes
  router.use('/pdf', pdfRouter);
  
  // Add more route modules here as the application grows
  // Example:
  // router.use('/users', userRouter);
  // router.use('/auth', authRouter);
  
  return router;
};

