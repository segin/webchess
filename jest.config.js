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
  coverageReporters: isCI 
    ? ['text', 'lcov', 'json-summary'] // Minimal reporters for CI
    : coverageConfig.reporting.formats, // Full reporters for local
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
  // Optimize console output for CI
  silent: isCI,
  // Use optimized reporters for CI
  reporters: isCI 
    ? [['default', { silent: true, summaryThreshold: 0 }]]
    : ['default'],
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
  testTimeout: isCI ? 45000 : 30000, // Longer timeout for CI
  maxWorkers: isCI ? '25%' : '50%', // Fewer workers in CI to reduce resource contention
  workerIdleMemoryLimit: isCI ? '256MB' : '512MB', // Lower memory limit for CI
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
  // Handle async operations properly - optimized for CI
  openHandlesTimeout: isCI ? 2000 : 1000, // Longer timeout for CI cleanup
  // Improved error reporting for CI
  errorOnDeprecated: true,
  // CI-specific optimizations
  ...(isCI && {
    // Disable watch mode plugins in CI
    watchPlugins: [],
    // Optimize test discovery
    testLocationInResults: false,
    // Reduce memory usage
    logHeapUsage: false,
    // Faster test execution
    cache: false, // Disable cache in CI for consistent results
    // Parallel execution optimization
    maxConcurrency: 2, // Limit concurrent tests in CI
    // Bail on first failure in CI (optional - can be enabled for faster feedback)
    // bail: 1,
  }),
  // Performance optimizations
  transform: {}, // Use default transforms, no custom transformations
  // Module resolution optimizations
  modulePathIgnorePatterns: [
    '<rootDir>/coverage/',
    '<rootDir>/deployment/',
    '<rootDir>/node_modules/'
  ],
  // Snapshot serializers (none needed for this project)
  snapshotSerializers: [],
  // Test result processor optimizations
  testResultsProcessor: undefined,
  // Reduce file system operations
  haste: {
    computeSha1: false,
    throwOnModuleCollision: false
  }
};