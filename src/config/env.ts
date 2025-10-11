/**
 * Environment Configuration Module
 * 
 * Validates and exports environment variables with type safety.
 * All required environment variables are validated at startup.
 */

import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables from .env file
config({ path: join(__dirname, '../../.env') });

/**
 * Validates that a required environment variable is set
 * @param key - Environment variable name
 * @param defaultValue - Optional default value
 * @returns The environment variable value
 * @throws Error if required variable is missing
 */
function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue;
  
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  
  return value;
}

/**
 * Converts string to number with validation
 */
function getEnvNumber(key: string, defaultValue: number): number {
  const value = process.env[key];
  
  if (!value) {
    return defaultValue;
  }
  
  const num = parseInt(value, 10);
  
  if (isNaN(num)) {
    throw new Error(`Environment variable ${key} must be a valid number`);
  }
  
  return num;
}

/**
 * Application environment configuration
 */
export const env = {
  // Node environment
  NODE_ENV: getEnvVar('NODE_ENV', 'development'),
  
  // Server configuration
  PORT: getEnvNumber('PORT', 3000),
  HOST: getEnvVar('HOST', '0.0.0.0'),
  
  // API configuration
  API_PREFIX: getEnvVar('API_PREFIX', '/api'),
  
  // Security
  CORS_ORIGIN: getEnvVar('CORS_ORIGIN', '*'),
  
  // Logging
  LOG_LEVEL: getEnvVar('LOG_LEVEL', 'info'),
  
  // Rate limiting
  RATE_LIMIT_WINDOW_MS: getEnvNumber('RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: getEnvNumber('RATE_LIMIT_MAX_REQUESTS', 100),
} as const;

/**
 * Helper to check if running in production
 */
export const isProduction = env.NODE_ENV === 'production';

/**
 * Helper to check if running in development
 */
export const isDevelopment = env.NODE_ENV === 'development';

/**
 * Helper to check if running in test
 */
export const isTest = env.NODE_ENV === 'test';

