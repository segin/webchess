/**
 * Global Jest teardown for CI reliability
 * Ensures all resources are cleaned up before process exit
 */

const ResourceManager = require('./ResourceManager');

module.exports = async () => {
  console.log('Starting global teardown...');
  
  // Clean up all tracked resources
  await ResourceManager.cleanupAll();
  
  // Clear all timers
  ResourceManager.clearAllTimers();
  
  // Force cleanup any remaining resources
  ResourceManager.forceCleanupAll();
  
  // Give a moment for cleanup to complete
  await new Promise(resolve => setTimeout(resolve, 100));
  
  console.log('Global teardown completed');
};