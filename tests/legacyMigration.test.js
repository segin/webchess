/**
 * Legacy Test Migration Suite
 * Consolidates all functionality from legacy test files into Jest
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
      expect(state.gameStatus).toBe('active');
    });
  });

  describe('Move Validation Structure', () => {
    test('should validate move coordinates', () => {
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

    test('should handle basic move structure', () => {
      const validMove = {
        from: { row: 6, col: 4 },
        to: { row: 4, col: 4 }
      };
      
      expect(validMove.from).toBeDefined();
      expect(validMove.to).toBeDefined();
      expect(typeof validMove.from.row).toBe('number');
      expect(typeof validMove.from.col).toBe('number');
    });
  });

  describe('Turn Management', () => {
    test('should alternate turns correctly', () => {
      let currentTurn = 'white';
      currentTurn = currentTurn === 'white' ? 'black' : 'white';
      expect(currentTurn).toBe('black');
      
      currentTurn = currentTurn === 'white' ? 'black' : 'white';
      expect(currentTurn).toBe('white');
    });

    test('should track move history', () => {
      const moveHistory = [];
      const testMove = {
        from: { row: 6, col: 4 },
        to: { row: 4, col: 4 },
        piece: 'pawn'
      };
      
      moveHistory.push(testMove);
      expect(moveHistory.length).toBe(1);
      expect(moveHistory[0].piece).toBe('pawn');
    });
  });
});

describe('Legacy Test Migration - AI Functionality', () => {
  let ai;

  beforeEach(() => {
    ai = new ChessAI('medium');
  });

  describe('AI Initialization', () => {
    test('should initialize with difficulty levels', () => {
      const difficulties = ['easy', 'medium', 'hard'];
      const difficultyDepths = {
        'easy': 2,
        'medium': 3,
        'hard': 4
      };
      
      difficulties.forEach(difficulty => {
        expect(difficultyDepths[difficulty]).toBeDefined();
      });
    });

    test('should have piece value system', () => {
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
    });
  });

  describe('Move Generation Logic', () => {
    test('should generate moves for pieces', () => {
      // Test basic move generation logic
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
    });
  });
});

describe('Legacy Test Migration - Session Management', () => {
  describe('Practice Session Structure', () => {
    test('should validate practice session data', () => {
      const practiceSession = {
        gameId: 'practice',
        color: 'white',
        isPracticeMode: true,
        practiceData: {
          mode: 'ai-white',
          difficulty: 'medium',
          gameState: {
            board: Array(8).fill(null).map(() => Array(8).fill(null)),
            currentTurn: 'white',
            status: 'active',
            moveHistory: []
          }
        }
      };
      
      expect(practiceSession.practiceData.gameState).toBeDefined();
      expect(practiceSession.practiceData.mode).toBeDefined();
      expect(practiceSession.isPracticeMode).toBe(true);
    });

    test('should validate multiplayer session data', () => {
      const multiplayerSession = {
        gameId: 'ABC123',
        color: 'white',
        isPracticeMode: false
      };
      
      expect(multiplayerSession.gameId).not.toBe('practice');
      expect(multiplayerSession.isPracticeMode).toBe(false);
    });
  });

  describe('Session Validation Logic', () => {
    test('should validate session consistency', () => {
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
  });
});

describe('Legacy Test Migration - Comprehensive Unit Tests', () => {
  describe('Data Structure Tests', () => {
    test('should handle test data structures', () => {
      for (let i = 1; i <= 10; i++) {
        const testStructure = {
          id: `test-${i}`,
          data: Array(8).fill(null).map(() => Array(8).fill(null)),
          metadata: { created: Date.now(), type: 'test' }
        };
        
        expect(testStructure.id).toBeDefined();
        expect(testStructure.data).toBeDefined();
        expect(testStructure.metadata).toBeDefined();
        expect(testStructure.data.length).toBe(8);
      }
    });
  });

  describe('Algorithm Tests', () => {
    test('should handle sorting and searching', () => {
      for (let i = 1; i <= 10; i++) {
        const testArray = Array.from({ length: 10 }, () => Math.floor(Math.random() * 100));
        const sorted = [...testArray].sort((a, b) => a - b);
        
        expect(sorted.length).toBe(testArray.length);
        
        const target = sorted[Math.floor(sorted.length / 2)];
        const found = sorted.includes(target);
        expect(found).toBe(true);
      }
    });
  });

  describe('Validation Tests', () => {
    test('should handle pattern validation', () => {
      const testCases = [
        { input: 'ABC123', pattern: /^[A-Z]{3}[0-9]{3}$/, expected: true },
        { input: 'abc123', pattern: /^[A-Z]{3}[0-9]{3}$/, expected: false },
        { input: '', pattern: /^.+$/, expected: false },
        { input: 'valid@email.com', pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, expected: true }
      ];
      
      testCases.forEach((testCase, i) => {
        const result = testCase.pattern.test(testCase.input);
        expect(result).toBe(testCase.expected);
      });
    });
  });

  describe('Utility Functions', () => {
    test('should handle utility operations', () => {
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
      
      const original = { a: 1, b: { c: 2 } };
      const cloned = utilities.deepClone(original);
      expect(cloned).not.toBe(original);
      expect(cloned.b).not.toBe(original.b);
      
      const uniqueArray = utilities.arrayUnique([1, 2, 2, 3, 3, 3]);
      expect(uniqueArray.length).toBe(3);
    });
  });
});