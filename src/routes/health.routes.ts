/**
 * Health Check Routes
 * 
 * Provides health check and basic information endpoints.
 */

import { Router, Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { env } from '../config/env';

export const healthRouter: Router = Router();

/**
 * GET /health
 * Basic health check endpoint
 */
healthRouter.get(
  '/',
  asyncHandler(async (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'success',
      message: 'Server is running',
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
    });
  })
);

/**
 * GET /health/info
 * Returns basic server information
 */
healthRouter.get(
  '/info',
  asyncHandler(async (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'success',
      data: {
        name: 'Youssef Dhibi',
        version: '1.0.0',
        environment: env.NODE_ENV,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString(),
      },
    });
  })
);

