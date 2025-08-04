/**
 * Coverage Configuration for WebChess
 * Defines coverage thresholds and validation rules
 */

module.exports = {
  // Global coverage thresholds (minimum 95% for chess game logic)
  globalThresholds: {
    statements: 95,
    branches: 95,
    functions: 95,
    lines: 95
  },

  // File-specific thresholds for critical components
  fileThresholds: {
    'src/shared/chessGame.js': {
      statements: 95,
      branches: 95,
      functions: 95,
      lines: 95,
      description: 'Core chess game logic - requires comprehensive coverage'
    },
    'src/shared/gameState.js': {
      statements: 95,
      branches: 95,
      functions: 95,
      lines: 95,
      description: 'Game state management - critical for game integrity'
    },
    'src/shared/errorHandler.js': {
      statements: 95,
      branches: 95,
      functions: 95,
      lines: 95,
      description: 'Error handling - must cover all error scenarios'
    },
    'src/shared/chessAI.js': {
      statements: 90,
      branches: 85,
      functions: 90,
      lines: 90,
      description: 'AI logic - complex algorithms, slightly lower threshold acceptable'
    },
    'src/server/gameManager.js': {
      statements: 90,
      branches: 85,
      functions: 90,
      lines: 90,
      description: 'Server game management - network and session handling'
    },
    'src/server/index.js': {
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80,
      description: 'Server entry point - mainly configuration and setup'
    }
  },

  // Files to exclude from coverage calculations
  excludePatterns: [
    '/tests/',
    '/coverage/',
    '/node_modules/',
    '/deployment/',
    '/public/',
    'jest.config.js',
    'coverage.config.js',
    '.eslintrc.js',
    'lighthouse.config.js'
  ],

  // Coverage reporting configuration
  reporting: {
    formats: ['text', 'lcov', 'html', 'json-summary', 'text-summary'],
    directory: 'coverage',
    includeUncoveredFiles: true,
    skipCoverage: false
  },

  // Validation rules
  validation: {
    // Fail build if global thresholds not met
    enforceGlobalThresholds: true,
    
    // Fail build if critical file thresholds not met
    enforceCriticalFileThresholds: true,
    
    // Critical files that must meet their specific thresholds
    criticalFiles: [
      'src/shared/chessGame.js',
      'src/shared/gameState.js',
      'src/shared/errorHandler.js'
    ],
    
    // Maximum allowed regression in coverage percentage
    maxCoverageRegression: 2.0,
    
    // Minimum coverage increase required for new features
    minCoverageIncrease: 0.0
  },

  // Recommendations for improving coverage
  recommendations: {
    // Priority levels for different types of uncovered code
    priorities: {
      uncoveredFunctions: 'high',
      uncoveredBranches: 'high',
      uncoveredStatements: 'medium',
      uncoveredLines: 'medium'
    },
    
    // Specific guidance for chess game components
    chessGameGuidance: {
      'piece movement validation': 'Test all piece types with valid and invalid moves',
      'check detection': 'Test check scenarios with all piece types',
      'checkmate detection': 'Test various checkmate patterns',
      'special moves': 'Test castling, en passant, and pawn promotion',
      'game state management': 'Test state transitions and consistency',
      'error handling': 'Test all error conditions and recovery'
    }
  },

  // Integration with CI/CD
  cicd: {
    // Fail CI build if coverage thresholds not met
    failOnThresholdViolation: true,
    
    // Generate coverage badges
    generateBadges: true,
    
    // Upload coverage to external services
    uploadCoverage: false,
    
    // Coverage trend analysis
    trackCoverageTrends: true
  }
};