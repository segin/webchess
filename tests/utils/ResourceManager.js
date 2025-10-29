/**
 * ResourceManager - Tracks and cleans up test resources to prevent process leaks
 * Handles timers, sockets, servers, and other handles that can prevent Jest from exiting
 */

class ResourceManager {
  constructor() {
    this.resources = new Map();
    this.timers = new Set();
    this.servers = new Set();
    this.sockets = new Set();
    this.initialized = false;
  }

  /**
   * Initialize the resource manager
   */
  initialize() {
    if (this.initialized) return;
    
    this.initialized = true;
    
    // Override setTimeout to track timers
    const originalSetTimeout = global.setTimeout;
    global.setTimeout = (callback, delay, ...args) => {
      const timerId = originalSetTimeout(callback, delay, ...args);
      this.trackTimer(timerId);
      return timerId;
    };
    
    // Override setInterval to track intervals
    const originalSetInterval = global.setInterval;
    global.setInterval = (callback, delay, ...args) => {
      const timerId = originalSetInterval(callback, delay, ...args);
      this.trackTimer(timerId);
      return timerId;
    };
    
    // Override clearTimeout to untrack timers
    const originalClearTimeout = global.clearTimeout;
    global.clearTimeout = (timerId) => {
      this.untrackTimer(timerId);
      return originalClearTimeout(timerId);
    };
    
    // Override clearInterval to untrack intervals
    const originalClearInterval = global.clearInterval;
    global.clearInterval = (timerId) => {
      this.untrackTimer(timerId);
      return originalClearInterval(timerId);
    };
    
    console.log('ResourceManager initialized with timer tracking');
  }

  /**
   * Register a resource for cleanup
   * @param {string} id - Unique identifier for the resource
   * @param {any} resource - The resource to track
   * @param {Function} cleanupFn - Function to call for cleanup
   */
  registerCleanup(id, resource, cleanupFn) {
    this.resources.set(id, {
      resource,
      cleanupFn,
      created: Date.now(),
      cleaned: false
    });
  }

  /**
   * Track a timer for cleanup
   * @param {number} timerId - Timer ID from setTimeout/setInterval
   */
  trackTimer(timerId) {
    if (timerId && typeof timerId === 'object' && timerId.unref) {
      // Use unref() to allow process to exit even with active timer
      timerId.unref();
    }
    this.timers.add(timerId);
  }

  /**
   * Untrack a timer (when cleared)
   * @param {number} timerId - Timer ID to untrack
   */
  untrackTimer(timerId) {
    this.timers.delete(timerId);
  }

  /**
   * Track a server for cleanup
   * @param {any} server - Server instance
   */
  trackServer(server) {
    this.servers.add(server);
    this.registerCleanup(`server-${Date.now()}`, server, () => {
      if (server && typeof server.close === 'function') {
        return new Promise((resolve) => {
          server.close(() => resolve());
        });
      }
    });
  }

  /**
   * Track a socket for cleanup
   * @param {any} socket - Socket instance
   */
  trackSocket(socket) {
    this.sockets.add(socket);
    this.registerCleanup(`socket-${Date.now()}`, socket, () => {
      if (socket && typeof socket.disconnect === 'function') {
        socket.disconnect();
      } else if (socket && typeof socket.close === 'function') {
        socket.close();
      } else if (socket && typeof socket.destroy === 'function') {
        socket.destroy();
      }
    });
  }

  /**
   * Clean up all tracked resources
   */
  async cleanupAll() {
    const cleanupPromises = [];
    
    for (const [id, resourceInfo] of this.resources.entries()) {
      if (!resourceInfo.cleaned) {
        try {
          const result = resourceInfo.cleanupFn();
          if (result && typeof result.then === 'function') {
            cleanupPromises.push(result);
          }
          resourceInfo.cleaned = true;
        } catch (error) {
          console.warn(`Error cleaning up resource ${id}:`, error.message);
        }
      }
    }
    
    // Wait for all async cleanup operations
    if (cleanupPromises.length > 0) {
      await Promise.allSettled(cleanupPromises);
    }
    
    // Clear all timers
    this.clearAllTimers();
    
    console.log(`Cleaned up ${this.resources.size} resources`);
  }

  /**
   * Clear all tracked timers
   */
  clearAllTimers() {
    for (const timerId of this.timers) {
      try {
        clearTimeout(timerId);
        clearInterval(timerId);
      } catch (error) {
        // Timer may already be cleared
      }
    }
    this.timers.clear();
  }

  /**
   * Force cleanup all resources (synchronous)
   */
  forceCleanupAll() {
    // Clear all timers immediately
    this.clearAllTimers();
    
    // Close all servers
    for (const server of this.servers) {
      try {
        if (server && typeof server.close === 'function') {
          server.close();
        }
      } catch (error) {
        // Ignore errors during force cleanup
      }
    }
    
    // Close all sockets
    for (const socket of this.sockets) {
      try {
        if (socket && typeof socket.disconnect === 'function') {
          socket.disconnect();
        } else if (socket && typeof socket.close === 'function') {
          socket.close();
        } else if (socket && typeof socket.destroy === 'function') {
          socket.destroy();
        }
      } catch (error) {
        // Ignore errors during force cleanup
      }
    }
    
    // Clear all collections
    this.resources.clear();
    this.servers.clear();
    this.sockets.clear();
  }

  /**
   * Get diagnostic information about tracked resources
   */
  getDiagnostics() {
    return {
      totalResources: this.resources.size,
      activeTimers: this.timers.size,
      activeServers: this.servers.size,
      activeSockets: this.sockets.size,
      resources: Array.from(this.resources.entries()).map(([id, info]) => ({
        id,
        created: info.created,
        cleaned: info.cleaned,
        age: Date.now() - info.created
      }))
    };
  }
}

// Export singleton instance
module.exports = new ResourceManager();