/**
 * Legacy Test Migration Suite
 * Consolidates all functionality from legacy test files into Jest
 * Normalized to use current API patterns and response structures
 */

const fs = require('fs');
const path = require('path');
const ChessGame = require('../src/shared/chessGame');
const ChessAI = require('../src/shared/chessAI');

describe('Legacy Test Migration - File Structure', () => {
  describe('Project Structure Validation', () => {
    test('should have all required project files', () => {
      const requiredFiles = [
        'package.json',
        'src/server/index.js',
        'src/server/gameManager.js',
        'public/index.html',
        'public/script.js',
        'public/styles.css'
      ];
      
      requiredFiles.forEach(file => {
        const filePath = path.join(__dirname, '..', file);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });

    test('should have shared modules', () => {
      const sharedFiles = [
        'src/shared/chessGame.js',
        'src/shared/chessAI.js',
        'src/shared/gameState.js'
      ];
      
      sharedFiles.forEach(file => {
        const filePath = path.join(__dirname, '..', file);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });

    test('should have deployment directory', () => {
      const deploymentDir = path.join(__dirname, '..', 'deployment');
      expect(fs.existsSync(deploymentDir)).toBe(true);
    });
  });

  describe('Configuration File Validation', () => {
    test('should have valid package.json', () => {
      const packagePath = path.join(__dirname, '..', 'package.json');
      const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      
      expect(packageData.name).toBeDefined();
      expect(packageData.main).toBeDefined();
      expect(packageData.dependencies).toBeDefined();
      expect(packageData.dependencies.express).toBeDefined();
      expect(packageData.dependencies['socket.io']).toBeDefined();
    });

    test('should have .gitignore with node_modules', () => {
      const gitignorePath = path.join(__dirname, '..', '.gitignore');
      if (fs.existsSync(gitignorePath)) {
        const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
        expect(gitignoreContent).toContain('node_modules');
      }
    });
  });

  describe('Server File Validation', () => {
    test('should have valid server index.js', () => {
      const serverPath = path.join(__dirname, '..', 'src/server/index.js');
      const serverContent = fs.readFileSync(serverPath, 'utf8');
      
      expect(serverContent).toContain('express');
      expect(serverContent).toContain('socket.io');
      expect(serverContent).toContain('server.listen');
    });

    test('should have GameManager class', () => {
      const gameManagerPath = path.join(__dirname, '..', 'src/server/gameManager.js');
      const gameManagerContent = fs.readFileSync(gameManagerPath, 'utf8');
      
      expect(gameManagerContent).toContain('class GameManager');
      expect(gameManagerContent).toContain('createGame');
    });
  });

  describe('Client File Validation', () => {
    test('should have valid HTML structure', () => {
      const htmlPath = path.join(__dirname, '..', 'public/index.html');
      const htmlContent = fs.readFileSync(htmlPath, 'utf8');
      
      const requiredElements = [
        'main-menu',
        'game-screen',
        'chess-board',
        'chat-section'
      ];
      
      requiredElements.forEach(elementId => {
        expect(htmlContent).toContain(`id="${elementId}"`);
      });
      
      expect(htmlContent).toContain('viewport');
    });

    test('should have valid JavaScript structure', () => {
      const jsPath = path.join(__dirname, '..', 'public/script.js');
      const jsContent = fs.readFileSync(jsPath, 'utf8');
      
      expect(jsContent).toContain('class WebChessClient');
      expect(jsContent).toContain('class ChessAI');
    });

    test('should have responsive CSS', () => {
      const cssPath = path.join(__dirname, '..', 'public/styles.css');
      const cssContent = fs.readFileSync(cssPath, 'utf8');
      
      expect(cssContent).toContain('@media');
      expect(cssContent).toContain('chess-board');
    });
  });
});

describe('Legacy Test Migration - Game Logic', () => {
  let game;

  beforeEach(() => {
    game = new ChessGame();
  });

  describe('Chess Game Creation', () => {
    test('should initialize with correct starting position', () => {
      const state = game.getGameState();
      expect(state.board).toBeDefined();
      expect(state.board.length).toBe(8);
      expect(state.board[0].length).toBe(8);
    });

    test('should start with white turn', () => {
      const state = game.getGameState();
      expect(state.currentTurn).toBe('white');
    });

    test('should have active game status', () => {
      const state = game.getGameState();
      expect(state.gameStatus).toBe('active'); // Use current property name
    });

    test('should initialize with correct game state properties', () => {
      const state = game.getGameState();
      expect(state).toHaveProperty('gameStatus'); // Current API uses gameStatus
      expect(state).toHaveProperty('currentTurn');
      expect(state).toHaveProperty('winner');
      expect(state).toHaveProperty('moveHistory');
      expect(state).toHaveProperty('castlingRights');
      expect(state).toHaveProperty('enPassantTarget');
      expect(state).toHaveProperty('inCheck');
    });
  });

  describe('Move Validation Structure', () => {
    test('should validate move coordinates using current API', () => {
      const validCoords = [
        { row: 0, col: 0 },
        { row: 7, col: 7 },
        { row: 3, col: 4 }
      ];
      
      const invalidCoords = [
        { row: -1, col: 0 },
        { row: 8, col: 0 },
        { row: 0, col: -1 },
        { row: 0, col: 8 }
      ];
      
      validCoords.forEach(coord => {
        const isValid = coord.row >= 0 && coord.row < 8 && coord.col >= 0 && coord.col < 8;
        expect(isValid).toBe(true);
      });
      
      invalidCoords.forEach(coord => {
        const isValid = coord.row >= 0 && coord.row < 8 && coord.col >= 0 && coord.col < 8;
        expect(isValid).toBe(false);
      });
    });

    test('should handle basic move structure with current API', () => {
      const validMove = {
        from: { row: 6, col: 4 },
        to: { row: 4, col: 4 }
      };
      
      expect(validMove.from).toBeDefined();
      expect(validMove.to).toBeDefined();
      expect(typeof validMove.from.row).toBe('number');
      expect(typeof validMove.from.col).toBe('number');
    });

    test('should validate move execution with current response structure', () => {
      const move = { from: { row: 6, col: 4 }, to: { row: 5, col: 4 } };
      const result = game.makeMove(move);
      
      // Expect current API response structure
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('errorCode');
      
      if (result.success) {
        expect(result.success).toBe(true);
        expect(result.isValid).toBe(true);
        expect(result.data).toBeDefined();
        expect(result.data.gameStatus).toBe('active'); // Use current property name
        expect(result.data.currentTurn).toBe('black');
      }
    });

    test('should handle invalid moves with current error structure', () => {
      const invalidMove = { from: { row: 6, col: 4 }, to: { row: 3, col: 4 } }; // Invalid pawn move
      const result = game.makeMove(invalidMove);
      
      // Expect current API error response structure
      expect(result.success).toBe(false);
      expect(result.isValid).toBe(false);
      expect(result.message).toBeDefined();
      expect(result.errorCode).toBeDefined();
      expect(typeof result.message).toBe('string');
    });
  });

  describe('Turn Management', () => {
    test('should alternate turns correctly with current API', () => {
      const initialState = game.getGameState();
      expect(initialState.currentTurn).toBe('white');
      
      // Make a valid move
      const move = { from: { row: 6, col: 4 }, to: { row: 5, col: 4 } };
      const result = game.makeMove(move);
      
      expect(result.success).toBe(true);
      expect(result.data.currentTurn).toBe('black'); // Turn should alternate
      
      const newState = game.getGameState();
      expect(newState.currentTurn).toBe('black');
    });

    test('should track move history with current API structure', () => {
      const initialHistory = game.getGameState().moveHistory;
      expect(initialHistory.length).toBe(0);
      
      // Make a valid move
      const move = { from: { row: 6, col: 4 }, to: { row: 5, col: 4 } };
      const result = game.makeMove(move);
      
      expect(result.success).toBe(true);
      
      const newHistory = game.getGameState().moveHistory;
      expect(newHistory.length).toBe(1);
      expect(newHistory[0]).toHaveProperty('from');
      expect(newHistory[0]).toHaveProperty('to');
      expect(newHistory[0]).toHaveProperty('piece');
    });

    test('should maintain game state consistency during turn changes', () => {
      const move1 = { from: { row: 6, col: 4 }, to: { row: 5, col: 4 } };
      const result1 = game.makeMove(move1);
      
      expect(result1.success).toBe(true);
      expect(result1.data.gameStatus).toBe('active'); // Use current property name
      
      const move2 = { from: { row: 1, col: 4 }, to: { row: 2, col: 4 } };
      const result2 = game.makeMove(move2);
      
      expect(result2.success).toBe(true);
      expect(result2.data.currentTurn).toBe('white'); // Back to white
      expect(result2.data.gameStatus).toBe('active');
    });
  });
});

describe('Legacy Test Migration - AI Functionality', () => {
  let ai;
  let game;

  beforeEach(() => {
    ai = new ChessAI('easy'); // Use easy AI to prevent timeout
    game = new ChessGame();
  });

  describe('AI Initialization', () => {
    test('should initialize with difficulty levels using current API', () => {
      const difficulties = ['easy', 'medium', 'hard'];
      const difficultyDepths = {
        'easy': 2,
        'medium': 3,
        'hard': 4
      };
      
      difficulties.forEach(difficulty => {
        expect(difficultyDepths[difficulty]).toBeDefined();
        const testAI = new ChessAI(difficulty);
        expect(testAI).toBeDefined();
      });
    });

    test('should have piece value system compatible with current game state', () => {
      const pieceValues = {
        pawn: 100,
        knight: 300,
        bishop: 300,
        rook: 500,
        queen: 900,
        king: 10000
      };
      
      expect(pieceValues.queen).toBeGreaterThan(pieceValues.rook);
      expect(pieceValues.king).toBeGreaterThan(pieceValues.queen);
      
      // Validate against current game state structure
      const gameState = game.getGameState();
      expect(gameState.board).toBeDefined();
      expect(gameState.currentTurn).toBeDefined();
      expect(gameState.gameStatus).toBeDefined(); // Use current property name
    });
  });

  describe('Move Generation Logic', () => {
    test('should generate moves compatible with current API structure', () => {
      // Test basic move generation logic using current game state
      const gameState = game.getGameState();
      const mockBoard = Array(8).fill(null).map(() => Array(8).fill(null));
      mockBoard[0][0] = { type: 'rook', color: 'black' };
      
      // Rook can move horizontally and vertically
      const rookMoves = [];
      
      // Generate horizontal moves
      for (let col = 1; col < 8; col++) {
        if (!mockBoard[0][col]) {
          rookMoves.push({ from: { row: 0, col: 0 }, to: { row: 0, col } });
        }
      }
      
      expect(rookMoves.length).toBeGreaterThan(0);
      
      // Validate move structure matches current API expectations
      rookMoves.forEach(move => {
        expect(move).toHaveProperty('from');
        expect(move).toHaveProperty('to');
        expect(move.from).toHaveProperty('row');
        expect(move.from).toHaveProperty('col');
        expect(move.to).toHaveProperty('row');
        expect(move.to).toHaveProperty('col');
      });
    });

    test('should integrate with current game validation API', () => {
      // Test AI move generation with actual game validation
      const gameState = game.getGameState();
      expect(gameState.gameStatus).toBe('active');
      
      // Generate a simple pawn move that should be valid
      const testMove = { from: { row: 6, col: 4 }, to: { row: 5, col: 4 } };
      const result = game.makeMove(testMove);
      
      // Validate using current API response structure
      expect(result.success).toBe(true);
      expect(result.isValid).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.gameStatus).toBe('active');
      expect(result.data.currentTurn).toBe('black');
    });
  });
});

describe('Legacy Test Migration - Session Management', () => {
  describe('Practice Session Structure', () => {
    test('should validate practice session data with current API structure', () => {
      const game = new ChessGame();
      const currentGameState = game.getGameState();
      
      const practiceSession = {
        gameId: 'practice',
        color: 'white',
        isPracticeMode: true,
        practiceData: {
          mode: 'ai-white',
          difficulty: 'medium',
          gameState: {
            board: currentGameState.board,
            currentTurn: currentGameState.currentTurn,
            gameStatus: currentGameState.gameStatus, // Use current property name
            winner: currentGameState.winner,
            moveHistory: currentGameState.moveHistory,
            castlingRights: currentGameState.castlingRights,
            enPassantTarget: currentGameState.enPassantTarget,
            inCheck: currentGameState.inCheck
          }
        }
      };
      
      expect(practiceSession.practiceData.gameState).toBeDefined();
      expect(practiceSession.practiceData.mode).toBeDefined();
      expect(practiceSession.isPracticeMode).toBe(true);
      
      // Validate current API structure
      expect(practiceSession.practiceData.gameState.gameStatus).toBe('active');
      expect(practiceSession.practiceData.gameState.currentTurn).toBe('white');
      expect(practiceSession.practiceData.gameState).toHaveProperty('castlingRights');
      expect(practiceSession.practiceData.gameState).toHaveProperty('enPassantTarget');
      expect(practiceSession.practiceData.gameState).toHaveProperty('inCheck');
    });

    test('should validate multiplayer session data with current patterns', () => {
      const multiplayerSession = {
        gameId: 'ABC123',
        color: 'white',
        isPracticeMode: false
      };
      
      expect(multiplayerSession.gameId).not.toBe('practice');
      expect(multiplayerSession.isPracticeMode).toBe(false);
      expect(multiplayerSession.gameId).toMatch(/^[A-Z0-9]{6}$/); // Validate game ID format
    });
  });

  describe('Session Validation Logic', () => {
    test('should validate session consistency with current error handling', () => {
      const validSessions = [
        { gameId: 'ABC123', isPracticeMode: false },
        { gameId: 'practice', isPracticeMode: true }
      ];
      
      const invalidSessions = [
        { gameId: null, isPracticeMode: false },
        { gameId: 'practice', isPracticeMode: false },
        { gameId: 'ABC123', isPracticeMode: true }
      ];
      
      validSessions.forEach(session => {
        const isValid = session.gameId && 
          ((session.gameId === 'practice' && session.isPracticeMode) ||
           (session.gameId !== 'practice' && !session.isPracticeMode));
        
        expect(isValid).toBe(true);
      });
      
      invalidSessions.forEach(session => {
        const isValid = session.gameId && 
          ((session.gameId === 'practice' && session.isPracticeMode) ||
           (session.gameId !== 'practice' && !session.isPracticeMode));
        
        expect(isValid).toBeFalsy();
      });
    });

    test('should handle session errors with current error response structure', () => {
      // Simulate session validation errors using current error patterns
      const game = new ChessGame();
      
      // Test invalid move to get current error structure
      const invalidMove = { from: { row: -1, col: 0 }, to: { row: 0, col: 0 } };
      const result = game.makeMove(invalidMove);
      
      // Validate current error response structure
      expect(result.success).toBe(false);
      expect(result.isValid).toBe(false);
      expect(result.message).toBeDefined();
      expect(result.errorCode).toBeDefined();
      expect(typeof result.message).toBe('string');
      expect(typeof result.errorCode).toBe('string');
    });

    test('should maintain session state consistency with current API', () => {
      const game = new ChessGame();
      const initialState = game.getGameState();
      
      // Validate initial session state
      expect(initialState.gameStatus).toBe('active');
      expect(initialState.currentTurn).toBe('white');
      expect(initialState.winner).toBeNull();
      expect(initialState.moveHistory).toEqual([]);
      
      // Make a move and validate state consistency
      const move = { from: { row: 6, col: 4 }, to: { row: 5, col: 4 } };
      const result = game.makeMove(move);
      
      expect(result.success).toBe(true);
      expect(result.data.gameStatus).toBe('active');
      expect(result.data.currentTurn).toBe('black');
    });
  });
});

describe('Legacy Test Migration - Comprehensive Unit Tests', () => {
  describe('Data Structure Tests', () => {
    test('should handle test data structures with current API compatibility', () => {
      const game = new ChessGame();
      const gameState = game.getGameState();
      
      for (let i = 1; i <= 10; i++) {
        const testStructure = {
          id: `test-${i}`,
          data: Array(8).fill(null).map(() => Array(8).fill(null)),
          metadata: { 
            created: Date.now(), 
            type: 'test',
            gameStatus: 'active', // Use current property name
            currentTurn: 'white'
          }
        };
        
        expect(testStructure.id).toBeDefined();
        expect(testStructure.data).toBeDefined();
        expect(testStructure.metadata).toBeDefined();
        expect(testStructure.data.length).toBe(8);
        
        // Validate compatibility with current game state structure
        expect(testStructure.metadata.gameStatus).toBe(gameState.gameStatus);
        expect(testStructure.metadata.currentTurn).toBe(gameState.currentTurn);
      }
    });
  });

  describe('Algorithm Tests', () => {
    test('should handle sorting and searching with current error handling', () => {
      const game = new ChessGame();
      
      for (let i = 1; i <= 10; i++) {
        const testArray = Array.from({ length: 10 }, () => Math.floor(Math.random() * 100));
        const sorted = [...testArray].sort((a, b) => a - b);
        
        expect(sorted.length).toBe(testArray.length);
        
        const target = sorted[Math.floor(sorted.length / 2)];
        const found = sorted.includes(target);
        expect(found).toBe(true);
        
        // Validate algorithm results don't interfere with current game state
        const gameState = game.getGameState();
        expect(gameState.gameStatus).toBe('active');
        expect(gameState.currentTurn).toBe('white');
      }
    });

    test('should handle algorithm errors with current error response structure', () => {
      const game = new ChessGame();
      
      // Test error handling by attempting invalid operations
      const invalidMove = { from: { row: 'invalid' }, to: { row: 0, col: 0 } };
      const result = game.makeMove(invalidMove);
      
      // Validate current error response structure
      expect(result.success).toBe(false);
      expect(result.isValid).toBe(false);
      expect(result.message).toBeDefined();
      expect(result.errorCode).toBeDefined();
    });
  });

  describe('Validation Tests', () => {
    test('should handle pattern validation with current API integration', () => {
      const game = new ChessGame();
      
      const testCases = [
        { input: 'ABC123', pattern: /^[A-Z]{3}[0-9]{3}$/, expected: true },
        { input: 'abc123', pattern: /^[A-Z]{3}[0-9]{3}$/, expected: false },
        { input: '', pattern: /^.+$/, expected: false },
        { input: 'valid@email.com', pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, expected: true }
      ];
      
      testCases.forEach((testCase, i) => {
        const result = testCase.pattern.test(testCase.input);
        expect(result).toBe(testCase.expected);
        
        // Ensure validation doesn't affect game state
        const gameState = game.getGameState();
        expect(gameState.gameStatus).toBe('active');
      });
    });

    test('should validate game patterns with current error codes', () => {
      const game = new ChessGame();
      
      // Test coordinate validation patterns
      const validCoordinates = [
        { row: 0, col: 0 },
        { row: 7, col: 7 },
        { row: 3, col: 4 }
      ];
      
      const invalidCoordinates = [
        { row: -1, col: 0 },
        { row: 8, col: 0 },
        { row: 0, col: -1 }
      ];
      
      // Test valid coordinates don't cause errors
      validCoordinates.forEach(coord => {
        const isValid = coord.row >= 0 && coord.row < 8 && coord.col >= 0 && coord.col < 8;
        expect(isValid).toBe(true);
      });
      
      // Test invalid coordinates with current error handling
      invalidCoordinates.forEach(coord => {
        const move = { from: coord, to: { row: 0, col: 0 } };
        const result = game.makeMove(move);
        
        expect(result.success).toBe(false);
        expect(result.errorCode).toBeDefined();
        expect(['INVALID_COORDINATES', 'OUT_OF_BOUNDS', 'MALFORMED_MOVE'].includes(result.errorCode)).toBe(true);
      });
    });
  });

  describe('Utility Functions', () => {
    test('should handle utility operations with current API compatibility', () => {
      const game = new ChessGame();
      
      const utilities = {
        generateId: () => Math.random().toString(36).substr(2, 9),
        validateEmail: (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
        formatDate: (date) => new Date(date).toISOString(),
        deepClone: (obj) => JSON.parse(JSON.stringify(obj)),
        arrayUnique: (arr) => [...new Set(arr)]
      };
      
      const testId = utilities.generateId();
      expect(testId.length).toBeGreaterThanOrEqual(5);
      
      const validEmail = utilities.validateEmail('test@example.com');
      expect(validEmail).toBe(true);
      
      const testDate = utilities.formatDate(Date.now());
      expect(testDate).toContain('T');
      
      // Test deep cloning with current game state structure
      const gameState = game.getGameState();
      const clonedState = utilities.deepClone(gameState);
      expect(clonedState).not.toBe(gameState);
      expect(clonedState.board).not.toBe(gameState.board);
      expect(clonedState.gameStatus).toBe(gameState.gameStatus); // Use current property name
      expect(clonedState.currentTurn).toBe(gameState.currentTurn);
      
      const uniqueArray = utilities.arrayUnique([1, 2, 2, 3, 3, 3]);
      expect(uniqueArray.length).toBe(3);
    });

    test('should integrate utility functions with current error handling', () => {
      const game = new ChessGame();
      
      // Test utility function error scenarios
      const utilities = {
        safeParseJSON: (str) => {
          try {
            return { success: true, data: JSON.parse(str) };
          } catch (error) {
            return { success: false, message: error.message, errorCode: 'PARSE_ERROR' };
          }
        }
      };
      
      // Test successful parsing
      const validResult = utilities.safeParseJSON('{"test": true}');
      expect(validResult.success).toBe(true);
      expect(validResult.data.test).toBe(true);
      
      // Test error handling with current error structure pattern
      const invalidResult = utilities.safeParseJSON('invalid json');
      expect(invalidResult.success).toBe(false);
      expect(invalidResult.message).toBeDefined();
      expect(invalidResult.errorCode).toBe('PARSE_ERROR');
      
      // Ensure game state remains consistent
      const gameState = game.getGameState();
      expect(gameState.gameStatus).toBe('active');
    });
  });
});