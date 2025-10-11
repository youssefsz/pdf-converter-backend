/**
 * Server Entry Point
 * 
 * Starts the Express server and handles graceful shutdown.
 */

import { createApp } from './app';
import { env, isProduction } from './config/env';
import { Server } from 'http';

/**
 * Start the server
 */
const startServer = (): Server => {
  const app = createApp();
  
  const server = app.listen(env.PORT, env.HOST, () => {
    console.log('='.repeat(50));
    console.log(`🚀 Server started successfully`);
    console.log(`📍 Environment: ${env.NODE_ENV}`);
    console.log(`🌐 URL: http://${env.HOST}:${env.PORT}`);
    console.log(`📡 API Prefix: ${env.API_PREFIX}`);
    console.log(`⏰ Started at: ${new Date().toISOString()}`);
    console.log('='.repeat(50));
  });
  
  return server;
};

/**
 * Graceful shutdown handler
 */
const gracefulShutdown = (server: Server, signal: string): void => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  
  server.close((err) => {
    if (err) {
      console.error('Error during server shutdown:', err);
      process.exit(1);
    }
    
    console.log('✅ Server closed successfully');
    console.log('👋 Process terminated');
    process.exit(0);
  });
  
  // Force shutdown after 30 seconds
  setTimeout(() => {
    console.error('❌ Forced shutdown due to timeout');
    process.exit(1);
  }, 30000);
};

// ============================================
// ERROR HANDLERS
// ============================================

/**
 * Handle uncaught exceptions
 */
process.on('uncaughtException', (error: Error) => {
  console.error('💥 UNCAUGHT EXCEPTION! Shutting down...');
  console.error('Error:', error.name, error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
});

/**
 * Handle unhandled promise rejections
 */
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  console.error('💥 UNHANDLED REJECTION! Shutting down...');
  console.error('Reason:', reason);
  console.error('Promise:', promise);
  
  if (isProduction) {
    process.exit(1);
  }
});

// ============================================
// START SERVER
// ============================================

const server = startServer();

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

// Handle termination signals
process.on('SIGTERM', () => gracefulShutdown(server, 'SIGTERM'));
process.on('SIGINT', () => gracefulShutdown(server, 'SIGINT'));

// Export server for potential testing
export { server };

