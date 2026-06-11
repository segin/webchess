const js = require('@eslint/js');

module.exports = [
  {
    ignores: ['node_modules/**', 'coverage/**', 'public/shared.bundle.js', 'build/**']
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        // Node
        require: 'readonly',
        module: 'writable',
        process: 'readonly',
        console: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        globalThis: 'readonly',
        // Browser (public/)
        window: 'readonly',
        document: 'readonly',
        localStorage: 'readonly',
        navigator: 'readonly',
        io: 'readonly',
        Worker: 'readonly',
        // Provided by shared.bundle.js (built from src/shared/browser-entry.js)
        ChessGame: 'readonly',
        ChessAI: 'readonly',
        self: 'readonly',
        importScripts: 'readonly',
        alert: 'readonly',
        confirm: 'readonly',
        requestAnimationFrame: 'readonly',
        performance: 'readonly',
        // Jest
        describe: 'readonly',
        test: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        jest: 'readonly',
        global: 'writable',
        // Defined in tests/setup.js
        testUtils: 'readonly',
        mockRequest: 'readonly',
        mockResponse: 'readonly'
      }
    },
    rules: {
      ...js.configs.recommended.rules,
      // The codebase predates linting; keep the signal high and the noise low
      'no-unused-vars': ['warn', { args: 'none', caughtErrors: 'none' }],
      'no-empty': ['warn', { allowEmptyCatch: true }],
      'no-prototype-builtins': 'off',
      'no-case-declarations': 'off',
      'no-useless-escape': 'warn'
    }
  }
];
