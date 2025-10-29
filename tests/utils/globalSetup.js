/**
 * Global Jest setup for CI reliability
 * Initializes resource tracking and test environment
 */

const ResourceManager = require('./ResourceManager');

module.exports = async () => {
  // Initialize resource tracking
  ResourceManager.initialize();
  
  // Set up process event handlers for cleanup
  process.on('exit', () => {
    ResourceManager.forceCleanupAll();
  });
  
  process.on('SIGINT', () => {
    ResourceManager.forceCleanupAll();
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    ResourceManager.forceCleanupAll();
    process.exit(0);
  });
  
  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    ResourceManager.forceCleanupAll();
  });
  
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    ResourceManager.forceCleanupAll();
    process.exit(1);
  });
  
  console.log('Global test setup completed with resource tracking');
};