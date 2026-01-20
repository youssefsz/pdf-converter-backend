/**
 * Security Middleware Configuration
 * 
 * Configures security-related middleware including helmet, CORS, and rate limiting.
 */

import { Request } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { env, isProduction } from '../config/env';

/**
 * Helmet configuration for security headers
 * Helmet helps secure Express apps by setting HTTP response headers
 */
export const helmetMiddleware = helmet({
  contentSecurityPolicy: isProduction ? undefined : false,
  crossOriginEmbedderPolicy: false,
});

/**
 * CORS configuration
 * Configure allowed origins based on environment
 */
export const corsMiddleware = cors({
  origin: env.CORS_ORIGIN === '*' ? '*' : env.CORS_ORIGIN.split(','),
  credentials: true,
  optionsSuccessStatus: 200,
});

/**
 * Rate limiting configuration
 * Prevents abuse by limiting requests per IP
 */
export const rateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  message: {
    status: 'error',
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting in test environment OR for internal health checks
  skip: (req: Request) => {
    return env.NODE_ENV === 'test' || req.ip === '127.0.0.1' || req.ip === '::1';
  },
});

