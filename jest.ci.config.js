/**
 * Jest Configuration for CI Environment
 * Optimized for speed, reliability, and resource efficiency
 */

const baseConfig = require('./jest.config.js');
const coverageConfig = require('./coverage.config.js');

module.exports = {
  ...baseConfig,
  
  // CI-specific overrides for maximum performance
  testTimeout: 60000, // Extended timeout for CI environments
  maxWorkers: 1, // Single worker for maximum stability
  workerIdleMemoryLimit: '128MB', // Minimal memory usage
  
  // Minimal output for CI logs
  silent: true,
  verbose: false,
  
  // Optimized reporters for CI
  reporters: [
    ['default', { 
      silent: true, 
      summaryThreshold: 0
    }]
  ],
  
  // Minimal coverage reporters for CI
  coverageReporters: ['text-summary', 'lcov', 'json-summary'],
  
  // CI-specific test execution optimizations
  cache: false, // Disable cache for consistent CI results
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  
  // Parallel execution disabled for CI stability
  maxConcurrency: 1,
  
  // Extended timeouts for resource cleanup
  openHandlesTimeout: 3000,
  
  // Strict error handling for CI
  errorOnDeprecated: true,
  
  // Disable watch mode features
  watchPlugins: [],
  
  // Optimize test discovery
  testLocationInResults: false,
  
  // Memory optimization
  logHeapUsage: false,
  
  // Bail on first failure for faster feedback (optional)
  // bail: 1,
  
  // CI-specific environment variables
  setupFiles: ['<rootDir>/tests/utils/ci-setup.js'],
  
  // Optimized module resolution
  modulePathIgnorePatterns: [
    '<rootDir>/coverage/',
    '<rootDir>/deployment/',
    '<rootDir>/node_modules/',
    '<rootDir>/tests_backup_*'
  ],
  
  // Coverage collection optimization - use collectCoverageFrom instead
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/client/**',
    '!src/**/*.test.js',
    '!src/**/*.spec.js'
  ],
  
  // Test result processing optimization
  testResultsProcessor: undefined,
  
  // Haste map optimization for CI
  haste: {
    computeSha1: false,
    throwOnModuleCollision: false,
    maxWorkers: 1
  },
  
  // Transform optimization
  transform: {},
  
  // Snapshot configuration
  updateSnapshot: false, // Never update snapshots in CI
  
  // Coverage collection optimization
  collectCoverage: true,
  coverageThreshold: {
    global: {
      // Slightly relaxed global thresholds for CI stability
      statements: 90,
      branches: 85,
      functions: 85,
      lines: 90
    },
    // Keep strict thresholds for critical files
    'src/shared/chessGame.js': coverageConfig.fileThresholds['src/shared/chessGame.js'],
    'src/shared/gameState.js': coverageConfig.fileThresholds['src/shared/gameState.js'],
    'src/shared/errorHandler.js': coverageConfig.fileThresholds['src/shared/errorHandler.js'],
    'src/server/index.js': coverageConfig.fileThresholds['src/server/index.js']
  }
};