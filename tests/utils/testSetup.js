/**
 * Test Setup Utilities
 * Common setup and teardown patterns for consistent test execution
 */

const ResourceManager = require('./ResourceManager');
const TestUtils = require('./testUtils');

/**
 * Standard beforeEach setup for chess game tests
 * @param {Object} options - Setup options
 * @param {Function} options.gameFactory - Custom game factory function
 * @param {Array} options.suppressErrors - Error patterns to suppress
 * @param {boolean} options.trackResources - Whether to track resources
 * @returns {Function} Setup function for beforeEach
 */
function createStandardSetup(options = {}) {
  return function() {
    // Track resources if requested
    if (options.trackResources !== false) {
      ResourceManager.initialize();
    }
    
    // Suppress error logs if patterns provided
    if (options.suppressErrors && options.suppressErrors.length > 0) {
      TestUtils.suppressErrorLogs(options.suppressErrors);
    }
    
    // Create game instance if factory provided
    if (options.gameFactory) {
      this.game = options.gameFactory();
    } else {
      this.game = TestUtils.createStandardGame();
    }
    
    // Initialize test state
    this.testState = {
      startTime: Date.now(),
      resources: [],
      mocks: []
    };
  };
}

/**
 * Standard afterEach cleanup for chess game tests
 * @param {Object} options - Cleanup options
 * @param {boolean} options.cleanupResources - Whether to cleanup resources
 * @param {boolean} options.restoreErrors - Whether to restore error logs
 * @param {boolean} options.clearMocks - Whether to clear Jest mocks
 * @returns {Function} Cleanup function for afterEach
 */
function createStandardCleanup(options = {}) {
  return async function() {
    // Clean up game instance
    if (this.game) {
      TestUtils.cleanupGame(this.game);
      this.game = null;
    }
    
    // Clean up tracked resources
    if (options.cleanupResources !== false) {
      await TestUtils.standardCleanup();
    }
    
    // Restore error logs
    if (options.restoreErrors !== false) {
      TestUtils.restoreErrorLogs();
    }
    
    // Clear Jest mocks
    if (options.clearMocks !== false) {
      jest.clearAllMocks();
      jest.clearAllTimers();
    }
    
    // Clean up test state
    if (this.testState) {
      // Clean up any test-specific resources
      for (const resource of this.testState.resources) {
        try {
          if (typeof resource.cleanup === 'function') {
            await resource.cleanup();
          }
        } catch (error) {
          // Ignore cleanup errors
        }
      }
      
      this.testState = null;
    }
  };
}

/**
 * Setup for server testing
 * @param {Object} options - Server setup options
 * @param {number} options.port - Server port
 * @param {boolean} options.mockSocketIO - Whether to mock Socket.IO
 * @returns {Function} Server setup function
 */
function createServerSetup(options = {}) {
  return function() {
    // Standard setup first
    createStandardSetup(options).call(this);
    
    // Server-specific setup
    this.serverConfig = {
      port: options.port || 0, // Use random port for testing
      host: 'localhost'
    };
    
    // Mock Socket.IO if requested
    if (options.mockSocketIO !== false) {
      this.mockSocketIO = {
        on: jest.fn(),
        emit: jest.fn(),
        to: jest.fn().mockReturnThis(),
        join: jest.fn(),
        leave: jest.fn(),
        disconnect: jest.fn()
      };
    }
    
    // Track server for cleanup
    this.testState.servers = [];
  };
}

/**
 * Cleanup for server testing
 * @param {Object} options - Server cleanup options
 * @returns {Function} Server cleanup function
 */
function createServerCleanup(options = {}) {
  return async function() {
    // Clean up servers
    if (this.testState && this.testState.servers) {
      for (const server of this.testState.servers) {
        await TestUtils.cleanupServer(server);
      }
    }
    
    // Clean up server-specific mocks
    if (this.mockSocketIO) {
      this.mockSocketIO = null;
    }
    
    // Standard cleanup
    await createStandardCleanup(options).call(this);
  };
}

/**
 * Setup for WebSocket testing
 * @param {Object} options - WebSocket setup options
 * @returns {Function} WebSocket setup function
 */
function createWebSocketSetup(options = {}) {
  return function() {
    // Standard setup first
    createStandardSetup(options).call(this);
    
    // WebSocket-specific setup
    this.mockSocket = {
      id: TestUtils.generateGameId(),
      emit: jest.fn(),
      on: jest.fn(),
      join: jest.fn(),
      leave: jest.fn(),
      disconnect: jest.fn(),
      connected: true,
      rooms: new Set()
    };
    
    this.mockIO = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
      sockets: {
        sockets: new Map()
      }
    };
    
    // Track sockets for cleanup
    this.testState.sockets = [this.mockSocket];
  };
}

/**
 * Cleanup for WebSocket testing
 * @param {Object} options - WebSocket cleanup options
 * @returns {Function} WebSocket cleanup function
 */
function createWebSocketCleanup(options = {}) {
  return async function() {
    // Clean up sockets
    if (this.testState && this.testState.sockets) {
      for (const socket of this.testState.sockets) {
        TestUtils.cleanupSocket(socket);
      }
    }
    
    // Clean up WebSocket-specific mocks
    if (this.mockSocket) {
      this.mockSocket = null;
    }
    if (this.mockIO) {
      this.mockIO = null;
    }
    
    // Standard cleanup
    await createStandardCleanup(options).call(this);
  };
}

/**
 * Setup for error handling tests
 * @param {Array} errorPatterns - Error patterns to suppress
 * @returns {Function} Error handling setup function
 */
function createErrorHandlingSetup(errorPatterns = []) {
  return function() {
    createStandardSetup({ 
      suppressErrors: errorPatterns,
      trackResources: true 
    }).call(this);
    
    // Track original console methods
    this.originalConsole = {
      error: console.error,
      warn: console.warn,
      log: console.log
    };
    
    // Set up error tracking
    this.capturedErrors = [];
    this.capturedWarnings = [];
  };
}

/**
 * Cleanup for error handling tests
 * @returns {Function} Error handling cleanup function
 */
function createErrorHandlingCleanup() {
  return async function() {
    // Restore console methods
    if (this.originalConsole) {
      console.error = this.originalConsole.error;
      console.warn = this.originalConsole.warn;
      console.log = this.originalConsole.log;
      this.originalConsole = null;
    }
    
    // Clear captured errors
    this.capturedErrors = null;
    this.capturedWarnings = null;
    
    // Standard cleanup
    await createStandardCleanup().call(this);
  };
}

/**
 * Create a complete test suite setup with beforeEach and afterEach
 * @param {string} setupType - Type of setup ('standard', 'server', 'websocket', 'error')
 * @param {Object} options - Setup options
 * @returns {Object} Object with beforeEach and afterEach functions
 */
function createTestSuite(setupType = 'standard', options = {}) {
  const setupMap = {
    standard: { setup: createStandardSetup, cleanup: createStandardCleanup },
    server: { setup: createServerSetup, cleanup: createServerCleanup },
    websocket: { setup: createWebSocketSetup, cleanup: createWebSocketCleanup },
    error: { setup: createErrorHandlingSetup, cleanup: createErrorHandlingCleanup },
    performance: { setup: createPerformanceSetup, cleanup: createPerformanceCleanup },
    integration: { setup: createIntegrationSetup, cleanup: createIntegrationCleanup }
  };
  
  const { setup, cleanup } = setupMap[setupType] || setupMap.standard;
  
  return {
    beforeEach: setup(options),
    afterEach: cleanup(options)
  };
}

/**
 * Setup for performance testing
 * @param {Object} options - Performance setup options
 * @returns {Function} Performance setup function
 */
function createPerformanceSetup(options = {}) {
  return function() {
    // Standard setup first
    createStandardSetup(options).call(this);
    
    // Performance-specific setup
    this.performanceMetrics = {
      startTime: Date.now(),
      startMemory: process.memoryUsage(),
      operations: 0,
      maxMemoryUsage: 0,
      maxExecutionTime: 0
    };
    
    // Set up performance monitoring
    this.measurePerformance = (operation) => {
      const startTime = Date.now();
      const startMemory = process.memoryUsage().heapUsed;
      
      const result = operation();
      
      const endTime = Date.now();
      const endMemory = process.memoryUsage().heapUsed;
      const executionTime = endTime - startTime;
      const memoryUsed = endMemory - startMemory;
      
      this.performanceMetrics.operations++;
      this.performanceMetrics.maxExecutionTime = Math.max(
        this.performanceMetrics.maxExecutionTime, 
        executionTime
      );
      this.performanceMetrics.maxMemoryUsage = Math.max(
        this.performanceMetrics.maxMemoryUsage, 
        memoryUsed
      );
      
      return { result, executionTime, memoryUsed };
    };
  };
}

/**
 * Cleanup for performance testing
 * @param {Object} options - Performance cleanup options
 * @returns {Function} Performance cleanup function
 */
function createPerformanceCleanup(options = {}) {
  return async function() {
    // Log performance metrics if requested
    if (options.logMetrics && this.performanceMetrics) {
      const totalTime = Date.now() - this.performanceMetrics.startTime;
      const totalMemory = process.memoryUsage().heapUsed - this.performanceMetrics.startMemory.heapUsed;
      
      console.log('Performance Metrics:', {
        totalTime,
        totalMemory,
        operations: this.performanceMetrics.operations,
        maxExecutionTime: this.performanceMetrics.maxExecutionTime,
        maxMemoryUsage: this.performanceMetrics.maxMemoryUsage
      });
    }
    
    // Clean up performance tracking
    this.performanceMetrics = null;
    this.measurePerformance = null;
    
    // Standard cleanup
    await createStandardCleanup(options).call(this);
  };
}

/**
 * Setup for integration testing
 * @param {Object} options - Integration setup options
 * @returns {Function} Integration setup function
 */
function createIntegrationSetup(options = {}) {
  return function() {
    // Combine server and websocket setup
    createServerSetup(options).call(this);
    
    // Additional integration-specific setup
    this.integrationState = {
      activeConnections: [],
      gameInstances: [],
      testPlayers: []
    };
    
    // Helper to create test players
    this.createTestPlayer = (color = 'white') => {
      const TestUtils = require('./testUtils');
      const player = TestUtils.generatePlayer(color);
      this.integrationState.testPlayers.push(player);
      return player;
    };
    
    // Helper to create game with players
    this.createGameWithPlayers = () => {
      const TestUtils = require('./testUtils');
      const game = TestUtils.createStandardGame();
      const whitePlayer = this.createTestPlayer('white');
      const blackPlayer = this.createTestPlayer('black');
      
      this.integrationState.gameInstances.push({
        game,
        players: { white: whitePlayer, black: blackPlayer }
      });
      
      return { game, whitePlayer, blackPlayer };
    };
  };
}

/**
 * Cleanup for integration testing
 * @param {Object} options - Integration cleanup options
 * @returns {Function} Integration cleanup function
 */
function createIntegrationCleanup(options = {}) {
  return async function() {
    // Clean up integration state
    if (this.integrationState) {
      // Clean up game instances
      for (const gameData of this.integrationState.gameInstances) {
        const TestUtils = require('./testUtils');
        TestUtils.cleanupGame(gameData.game);
      }
      
      // Clean up connections
      for (const connection of this.integrationState.activeConnections) {
        const TestUtils = require('./testUtils');
        TestUtils.cleanupSocket(connection);
      }
      
      this.integrationState = null;
    }
    
    // Clean up helper functions
    this.createTestPlayer = null;
    this.createGameWithPlayers = null;
    
    // Server cleanup (includes standard cleanup)
    await createServerCleanup(options).call(this);
  };
}

/**
 * Helper to apply test suite setup to a describe block
 * @param {string} setupType - Type of setup
 * @param {Object} options - Setup options
 */
function applyTestSuite(setupType = 'standard', options = {}) {
  const suite = createTestSuite(setupType, options);
  beforeEach(suite.beforeEach);
  afterEach(suite.afterEach);
}

module.exports = {
  createStandardSetup,
  createStandardCleanup,
  createServerSetup,
  createServerCleanup,
  createWebSocketSetup,
  createWebSocketCleanup,
  createErrorHandlingSetup,
  createErrorHandlingCleanup,
  createPerformanceSetup,
  createPerformanceCleanup,
  createIntegrationSetup,
  createIntegrationCleanup,
  createTestSuite,
  applyTestSuite
};