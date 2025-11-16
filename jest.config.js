const coverageConfig = require('./coverage.config.js');

// Detect CI environment
const isCI = process.env.CI === 'true' || process.env.NODE_ENV === 'ci';

module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/client/**',
    '!src/**/*.test.js',
    '!src/**/*.spec.js'
  ],
  coverageDirectory: coverageConfig.reporting.directory,
  // Always include text and text-summary for coverage output
  coverageReporters: isCI 
    ? ['text', 'text-summary', 'lcov', 'json-summary'] 
    : ['text', 'text-summary', 'lcov', 'html', 'json-summary'],
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
    '/deployment/',
    '/public/'
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/tests/',
    '/coverage/',
    '/deployment/',
    '/public/',
    'jest.config.js',
    'coverage.config.js',
    '.eslintrc.js',
    'lighthouse.config.js'
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  verbose: false,
  collectCoverage: false, // Only collect when --coverage flag is used
  // Don't silence output - we need coverage reports
  silent: false,
  reporters: ['default'],
  coverageThreshold: {
    global: coverageConfig.globalThresholds,
    // Specific thresholds for chess game logic modules
    ...Object.fromEntries(
      Object.entries(coverageConfig.fileThresholds).map(([file, thresholds]) => [
        file,
        {
          branches: thresholds.branches,
          functions: thresholds.functions,
          lines: thresholds.lines,
          statements: thresholds.statements
        }
      ])
    )
  },
  // CI-optimized timeouts and worker settings
  testTimeout: isCI ? 45000 : 30000,
  maxWorkers: isCI ? '25%' : '50%',
  workerIdleMemoryLimit: isCI ? '256MB' : '512MB',
  // CI-optimized settings for reliability
  detectOpenHandles: true,
  forceExit: false,
  globalSetup: '<rootDir>/tests/utils/globalSetup.js',
  globalTeardown: '<rootDir>/tests/utils/globalTeardown.js',
  // Test isolation and environment consistency
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  openHandlesTimeout: isCI ? 2000 : 1000,
  errorOnDeprecated: true,
  // CI-specific optimizations
  ...(isCI && {
    watchPlugins: [],
    testLocationInResults: false,
    logHeapUsage: false,
    cache: false,
    maxConcurrency: 2
  })
};
