const coverageConfig = require('./coverage.config.js');

module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/client/**',
    '!src/**/*.test.js',
    '!src/**/*.spec.js'
  ],
  coverageDirectory: coverageConfig.reporting.directory,
  coverageReporters: coverageConfig.reporting.formats,
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
  collectCoverage: true,
  // Reduce console noise during tests
  silent: false,
  // Use a quieter reporter
  reporters: [
    'default'
  ],
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
  testTimeout: 30000,
  maxWorkers: '50%',
  workerIdleMemoryLimit: '512MB',
  // CI-optimized settings for reliability
  detectOpenHandles: true,
  forceExit: false, // Let tests exit naturally
  globalSetup: '<rootDir>/tests/utils/globalSetup.js',
  globalTeardown: '<rootDir>/tests/utils/globalTeardown.js',
  // Ensure coverage is collected even for files without tests
  forceCoverageMatch: [
    'src/**/*.js'
  ],
  // Test isolation and environment consistency
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  // Handle async operations properly
  openHandlesTimeout: 1000,
  // Improved error reporting for CI
  errorOnDeprecated: true
};