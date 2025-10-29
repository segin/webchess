/**
 * Open Handle Detection and Diagnostics
 * Utilities to identify and report open handles that prevent Jest from exiting
 */

const ResourceManager = require('./ResourceManager');

/**
 * Detect and report open handles
 */
function detectOpenHandles() {
  const diagnostics = ResourceManager.getDiagnostics();
  
  if (diagnostics.totalResources > 0 || diagnostics.activeTimers > 0) {
    console.warn('⚠️  Open handles detected:');
    console.warn(`   Active resources: ${diagnostics.totalResources}`);
    console.warn(`   Active timers: ${diagnostics.activeTimers}`);
    console.warn(`   Active servers: ${diagnostics.activeServers}`);
    console.warn(`   Active sockets: ${diagnostics.activeSockets}`);
    
    if (diagnostics.resources.length > 0) {
      console.warn('   Resource details:');
      diagnostics.resources.forEach(resource => {
        console.warn(`     - ${resource.id}: ${resource.age}ms old, cleaned: ${resource.cleaned}`);
      });
    }
    
    return true;
  }
  
  return false;
}

/**
 * Log resource leak information
 */
function logResourceLeaks() {
  const diagnostics = ResourceManager.getDiagnostics();
  
  if (diagnostics.totalResources === 0 && diagnostics.activeTimers === 0) {
    console.log('✅ No resource leaks detected');
    return;
  }
  
  console.error('🔍 Resource leak diagnostics:');
  console.error(`   Total tracked resources: ${diagnostics.totalResources}`);
  console.error(`   Active timers: ${diagnostics.activeTimers}`);
  console.error(`   Active servers: ${diagnostics.activeServers}`);
  console.error(`   Active sockets: ${diagnostics.activeSockets}`);
  
  // Log uncleaned resources
  const uncleanedResources = diagnostics.resources.filter(r => !r.cleaned);
  if (uncleanedResources.length > 0) {
    console.error('   Uncleaned resources:');
    uncleanedResources.forEach(resource => {
      console.error(`     - ${resource.id}: created ${resource.age}ms ago`);
    });
  }
  
  // Provide suggestions for fixing leaks
  console.error('   💡 Suggestions:');
  if (diagnostics.activeTimers > 0) {
    console.error('     - Clear all timers in afterEach hooks');
    console.error('     - Use ResourceManager.trackTimer() for automatic cleanup');
  }
  if (diagnostics.activeServers > 0) {
    console.error('     - Close servers in afterEach hooks');
    console.error('     - Use ResourceManager.trackServer() for automatic cleanup');
  }
  if (diagnostics.activeSockets > 0) {
    console.error('     - Disconnect sockets in afterEach hooks');
    console.error('     - Use ResourceManager.trackSocket() for automatic cleanup');
  }
}

/**
 * Create a Jest reporter for handle detection
 */
class HandleDetectionReporter {
  onRunComplete() {
    // Check for open handles after all tests complete
    setTimeout(() => {
      const hasOpenHandles = detectOpenHandles();
      if (hasOpenHandles) {
        logResourceLeaks();
        console.warn('⚠️  Tests may hang due to open handles. Use --detectOpenHandles for more details.');
      }
    }, 100);
  }
}

/**
 * Setup handle detection for individual tests
 */
function setupHandleDetection() {
  let testStartDiagnostics;
  
  beforeEach(() => {
    testStartDiagnostics = ResourceManager.getDiagnostics();
  });
  
  afterEach(async () => {
    // Clean up resources created during this test
    await ResourceManager.cleanupAll();
    
    // Check if new handles were created and not cleaned
    const testEndDiagnostics = ResourceManager.getDiagnostics();
    const newResources = testEndDiagnostics.totalResources - testStartDiagnostics.totalResources;
    const newTimers = testEndDiagnostics.activeTimers - testStartDiagnostics.activeTimers;
    
    if (newResources > 0 || newTimers > 0) {
      console.warn(`Test created ${newResources} resources and ${newTimers} timers`);
    }
  });
}

/**
 * Utility to wait for handles to close
 * @param {number} timeout - Maximum time to wait in ms
 * @returns {Promise<boolean>} - True if all handles closed, false if timeout
 */
async function waitForHandlesToClose(timeout = 5000) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    const diagnostics = ResourceManager.getDiagnostics();
    if (diagnostics.totalResources === 0 && diagnostics.activeTimers === 0) {
      return true;
    }
    
    // Wait a bit before checking again
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return false;
}

module.exports = {
  detectOpenHandles,
  logResourceLeaks,
  HandleDetectionReporter,
  setupHandleDetection,
  waitForHandlesToClose
};