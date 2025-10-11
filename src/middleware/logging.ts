/**
 * Logging Middleware
 * 
 * Request logging for monitoring and debugging.
 */

import { Request, Response, NextFunction } from 'express';
import { isDevelopment } from '../config/env';

/**
 * Request logging middleware
 * Logs incoming requests with method, path, and response time
 */
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const startTime = Date.now();
  
  // Store original end function
  const originalEnd = res.end;
  
  // Override end function to log after response
  res.end = function (this: Response, ...args: any[]): Response {
    const duration = Date.now() - startTime;
    
    // Log request details
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      query: req.query,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('user-agent'),
      ip: req.ip || req.socket.remoteAddress,
    }));
    
    // Call original end function with all arguments
    return (originalEnd as any).call(this, ...args);
  };
  
  next();
};

/**
 * Development logger - more verbose
 */
export const devLogger = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  if (isDevelopment) {
    console.log(`\n🔵 ${req.method} ${req.path}`);
    if (Object.keys(req.query).length > 0) {
      console.log('Query:', req.query);
    }
    if (Object.keys(req.body || {}).length > 0) {
      console.log('Body:', req.body);
    }
  }
  next();
};

