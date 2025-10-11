/**
 * Express Application Configuration
 * 
 * Configures and exports the Express application with all middleware and routes.
 */

import express, { Application, Request, Response } from 'express';
import compression from 'compression';
import { env } from './config/env';
import { helmetMiddleware, corsMiddleware, rateLimiter } from './middleware/security';
import { requestLogger, devLogger } from './middleware/logging';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { createRouter } from './routes';

/**
 * Creates and configures the Express application
 * @returns Configured Express application
 */
export const createApp = (): Application => {
  const app = express();
  
  // ============================================
  // SECURITY MIDDLEWARE
  // ============================================
  
  // Helmet - Security headers
  app.use(helmetMiddleware);
  
  // CORS - Cross-Origin Resource Sharing
  app.use(corsMiddleware);
  
  // Rate limiting - Prevent abuse
  app.use(rateLimiter);
  
  // ============================================
  // PARSING MIDDLEWARE
  // ============================================
  
  // Parse JSON bodies (body size limit: 10mb)
  app.use(express.json({ limit: '10mb' }));
  
  // Parse URL-encoded bodies
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  
  // ============================================
  // PERFORMANCE MIDDLEWARE
  // ============================================
  
  // Compression - Compress response bodies
  app.use(compression());
  
  // ============================================
  // LOGGING MIDDLEWARE
  // ============================================
  
  // Request logging
  app.use(requestLogger);
  app.use(devLogger);
  
  // ============================================
  // HEALTH CHECK - Root endpoint
  // ============================================
  
  app.get('/', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'success',
      message: 'Youssef Dhibi',
      timestamp: new Date().toISOString(),
    });
  });
  
  // ============================================
  // API ROUTES
  // ============================================
  
  // Mount all API routes under the API prefix
  app.use(env.API_PREFIX, createRouter());
  
  // ============================================
  // ERROR HANDLING
  // ============================================
  
  // 404 handler - Must be after all routes
  app.use(notFoundHandler);
  
  // Global error handler - Must be last
  app.use(errorHandler);
  
  return app;
};

