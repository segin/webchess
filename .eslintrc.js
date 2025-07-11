module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
    jest: true,
  },
  extends: [
    'eslint:recommended',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    // Error prevention
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-console': 'off', // Allow console.log for this project
    'no-debugger': 'error',
    'no-alert': 'warn',
    
    // Code style
    'indent': ['error', 2],
    'linebreak-style': ['error', 'unix'],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
    
    // Best practices
    'eqeqeq': 'error',
    'curly': 'error',
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-script-url': 'error',
    
    // Variables
    'no-undef': 'error',
    'no-undefined': 'off',
    'no-use-before-define': ['error', { functions: false }],
    
    // Stylistic issues
    'camelcase': ['error', { properties: 'never' }],
    'comma-dangle': ['error', 'always-multiline'],
    'comma-spacing': 'error',
    'comma-style': 'error',
    'key-spacing': 'error',
    'keyword-spacing': 'error',
    'space-before-blocks': 'error',
    'space-before-function-paren': ['error', 'never'],
    'space-in-parens': 'error',
    'space-infix-ops': 'error',
    'spaced-comment': 'error',
  },
  overrides: [
    {
      files: ['public/**/*.js'],
      env: {
        browser: true,
        node: false,
      },
      globals: {
        io: 'readonly',
        WebChessClient: 'writable',
        ChessAI: 'writable',
        WebChessTestSuite: 'writable',
        GameLogicTestSuite: 'writable',
        ComprehensiveUnitTests: 'writable',
        IntegrationTests: 'writable',
        DynamicTestRunner: 'writable',
      },
    },
    {
      files: ['src/server/**/*.js'],
      env: {
        browser: false,
        node: true,
      },
    },
    {
      files: ['tests/**/*.js', '**/*.test.js'],
      env: {
        jest: true,
        node: true,
      },
      globals: {
        expect: 'readonly',
        describe: 'readonly',
        test: 'readonly',
        it: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
      },
    },
  ],
};