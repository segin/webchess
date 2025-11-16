module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/client/**',
    '!src/**/*.test.js',
    '!src/**/*.spec.js'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'text-summary', 'lcov', 'html', 'json-summary'],
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
    '/public/'
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  verbose: false,
  testTimeout: 30000,
  detectOpenHandles: true,
  forceExit: false,
  globalSetup: '<rootDir>/tests/utils/globalSetup.js',
  globalTeardown: '<rootDir>/tests/utils/globalTeardown.js',
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true
};
