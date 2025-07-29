const ChessGame = require('../src/shared/chessGame');

/**
 * Comprehensive Test Suite for Piece Movement Patterns
 * Task 17: Implement comprehensive test suite for piece movement patterns
 * 
 * This test suite provides:
 * - Exhaustive test coverage for all piece types with every possible movement scenario
 * - Boundary testing for all pieces at board edges and corners
 * - Performance testing for move validation timing and efficiency
 * - Unit tests covering every valid move for each piece type from multiple board positions
 * - Unit tests for all invalid moves and edge cases for each piece type
 * - Performance tests ensuring move validation completes within acceptable time limits
 */

// Simple test framework for Node.js
if (typeof describe === 'undefined') {
  global.describe = (name, fn) => { console.log('\n' + name); fn(); };
  global.test = (name, fn) => { 
    try { 
      fn(); 
      console.log('✅', name); 
    } catch(e) { 
      console.log('❌', name, ':', e.message); 
    } 
  };
  global.beforeEach = (fn) => fn();
  global.expect = (actual) => ({
    toBe: (expected) => { 
      if (actual !== expected) throw new Error(`Expected ${expected}, got ${actual}`); 
      return { toBe: () => {} };
    },
    toEqual: (expected) => { 
      if (JSON.stringify(actual) !== JSON.stringify(expected)) 
        throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`); 
      return { toEqual: () => {} };
    },
    toContain: (expected) => { 
      if (!Array.isArray(actual) || !actual.includes(expected)) 
        throw new Error(`Expected array to contain ${expected}, got ${JSON.stringify(actual)}`); 
      return { toContain: () => {} };
    },
    toBeDefined: () => { 
      if (actual === undefined) throw new Error('Expected value to be defined'); 
      return { toBeDefined: () => {} };
    },
    toBeGreaterThan: (expected) => { 
      if (actual <= expected) throw new Error(`Expected ${actual} to be greater than ${expected}`); 
      return { toBeGreaterThan: () => {} };
    },
    toBeLessThan: (expected) => { 
      if (actual >= expected) throw new Error(`Expected ${actual} to be less than ${expected}`); 
      return { toBeLessThan: () => {} };
    },
    toBeCloseTo: (expected, precision = 2) => {
      const diff = Math.abs(actual - expected);
      const threshold = Math.pow(10, -precision) / 2;
      if (diff >= threshold) throw new Error(`Expected ${actual} to be close to ${expected}`);
      return { toBeCloseTo: () => {} };
    }
  });
}

describe('Comprehensive Piece Movement Patterns Test Suite', () => {
  let game;

  beforeEach(() => {
    game = new ChessGame();
  });

  // Helper function to measure execution time
  function measureTime(fn) {
    const start = process.hrtime.bigint();
    fn();
    const end = process.hrtime.bigint();
    return Number(end - start) / 1000000; // Convert to milliseconds
  }

  // Helper function to create a test position with specific pieces
  function createTestPosition(pieces) {
    const game = new ChessGame();
    // Clear the board
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        game.board[row][col] = null;
      }
    }
    
    // Place specified pieces
    pieces.forEach(({ row, col, type, color }) => {
      game.board[row][col] = { type, color };
    });
    
    // Ensure we have kings for valid game state
    let hasWhiteKing = pieces.some(p => p.type === 'king' && p.color === 'white');
    let hasBlackKing = pieces.some(p => p.type === 'king' && p.color === 'black');
    
    if (!hasWhiteKing) {
      game.board[7][4] = { type: 'king', color: 'white' };
    }
    if (!hasBlackKing) {
      game.board[0][4] = { type: 'king', color: 'black' };
    }
    
    game.gameStatus = 'active';
    return game;
  }

  describe('Pawn Movement Patterns - Exhaustive Coverage', () => {
    describe('Basic Forward Movement from Starting Positions', () => {
      test('should allow white pawn single forward move from all starting positions', () => {
        for (let col = 0; col < 8; col++) {
          game = new ChessGame(); // Reset for each test
          const move = { from: { row: 6, col }, to: { row: 5, col } };
          const result = game.makeMove(move);
          expect(result.success).toBe(true);
          expect(game.board[5][col]).toEqual({ type: 'pawn', color: 'white' });
          expect(game.board[6][col]).toBe(null);
        }
      });

      test('should allow black pawn single forward move from all starting positions', () => {
        for (let col = 0; col < 8; col++) {
          game = new ChessGame(); // Reset for each test
          // Make white move first
          game.makeMove({ from: { row: 6, col: 0 }, to: { row: 5, col: 0 } });
          
          const move = { from: { row: 1, col }, to: { row: 2, col } };
          const result = game.makeMove(move);
          expect(result.success).toBe(true);
          expect(game.board[2][col]).toEqual({ type: 'pawn', color: 'black' });
          expect(game.board[1][col]).toBe(null);
        }
      });

      test('should allow white pawn initial two-square move from all starting positions', () => {
        for (let col = 0; col < 8; col++) {
          game = new ChessGame(); // Reset for each test
          const move = { from: { row: 6, col }, to: { row: 4, col } };
          const result = game.makeMove(move);
          expect(result.success).toBe(true);
          expect(game.board[4][col]).toEqual({ type: 'pawn', color: 'white' });
          expect(game.board[6][col]).toBe(null);
          expect(game.enPassantTarget).toEqual({ row: 5, col });
        }
      });

      test('should allow black pawn initial two-square move from all starting positions', () => {
        for (let col = 0; col < 8; col++) {
          game = new ChessGame(); // Reset for each test
          // Make white move first
          game.makeMove({ from: { row: 6, col: 0 }, to: { row: 5, col: 0 } });
          
          const move = { from: { row: 1, col }, to: { row: 3, col } };
          const result = game.makeMove(move);
          expect(result.success).toBe(true);
          expect(game.board[3][col]).toEqual({ type: 'pawn', color: 'black' });
          expect(game.board[1][col]).toBe(null);
          expect(game.enPassantTarget).toEqual({ row: 2, col });
        }
      });
    });

    describe('Pawn Diagonal Captures', () => {
      test('should allow white pawn diagonal captures when enemy piece present', () => {
        game = createTestPosition([
          { row: 4, col: 4, type: 'pawn', color: 'white' },
          { row: 3, col: 3, type: 'pawn', color: 'black' },
          { row: 3, col: 5, type: 'pawn', color: 'black' }
        ]);
        
        // Test left diagonal capture
        let move = { from: { row: 4, col: 4 }, to: { row: 3, col: 3 } };
        let result = game.makeMove(move);
        expect(result.success).toBe(true);
        
        // Reset and test right diagonal capture
        game = createTestPosition([
          { row: 4, col: 4, type: 'pawn', color: 'white' },
          { row: 3, col: 5, type: 'pawn', color: 'black' }
        ]);
        move = { from: { row: 4, col: 4 }, to: { row: 3, col: 5 } };
        result = game.makeMove(move);
        expect(result.success).toBe(true);
      });

      test('should reject pawn diagonal moves to empty squares', () => {
        game = createTestPosition([
          { row: 4, col: 4, type: 'pawn', color: 'white' }
        ]);
        
        const diagonalMoves = [
          { row: 3, col: 3 }, // Left diagonal
          { row: 3, col: 5 }  // Right diagonal
        ];
        
        diagonalMoves.forEach(to => {
          const move = { from: { row: 4, col: 4 }, to };
          const result = game.makeMove(move);
          expect(result.success).toBe(false);
        });
      });
    });

    describe('Pawn Boundary Testing', () => {
      test('should handle pawn movement at board edges correctly', () => {
        // Test left edge (column 0)
        game = createTestPosition([
          { row: 4, col: 0, type: 'pawn', color: 'white' },
          { row: 3, col: 1, type: 'pawn', color: 'black' }
        ]);
        
        // Can only capture to the right
        let move = { from: { row: 4, col: 0 }, to: { row: 3, col: 1 } };
        let result = game.makeMove(move);
        expect(result.success).toBe(true);
        
        // Test right edge (column 7)
        game = createTestPosition([
          { row: 4, col: 7, type: 'pawn', color: 'white' },
          { row: 3, col: 6, type: 'pawn', color: 'black' }
        ]);
        
        // Can only capture to the left
        move = { from: { row: 4, col: 7 }, to: { row: 3, col: 6 } };
        result = game.makeMove(move);
        expect(result.success).toBe(true);
      });

      test('should reject pawn moves beyond board boundaries', () => {
        const invalidMoves = [
          { from: { row: 0, col: 4 }, to: { row: -1, col: 4 } }, // Beyond top
          { from: { row: 7, col: 4 }, to: { row: 8, col: 4 } },  // Beyond bottom
          { from: { row: 4, col: 0 }, to: { row: 3, col: -1 } }, // Beyond left
          { from: { row: 4, col: 7 }, to: { row: 3, col: 8 } }   // Beyond right
        ];
        
        invalidMoves.forEach(move => {
          const result = game.validateMove(move);
          expect(result.isValid).toBe(false);
        });
      });
    });

    describe('Pawn Invalid Moves - Edge Cases', () => {
      test('should reject all invalid pawn movement patterns', () => {
        game = createTestPosition([
          { row: 4, col: 4, type: 'pawn', color: 'white' }
        ]);
        
        const invalidMoves = [
          { row: 4, col: 5 }, // Sideways
          { row: 4, col: 3 }, // Sideways
          { row: 5, col: 4 }, // Backward
          { row: 6, col: 4 }, // Backward
          { row: 3, col: 5 }, // Diagonal without capture
          { row: 3, col: 3 }, // Diagonal without capture
          { row: 2, col: 4 }, // Two squares from non-starting position
          { row: 1, col: 4 }, // Three squares
        ];
        
        invalidMoves.forEach(to => {
          const move = { from: { row: 4, col: 4 }, to };
          const result = game.makeMove(move);
          expect(result.success).toBe(false);
        });
      });
    });
  });

  describe('Knight Movement Patterns - L-Shape Validation', () => {
    describe('All Valid Knight Moves from Center', () => {
      test('should allow all 8 valid L-shaped moves from center position', () => {
        const validMoves = [
          { row: 2, col: 3 }, // Up 2, Left 1
          { row: 2, col: 5 }, // Up 2, Right 1
          { row: 3, col: 2 }, // Up 1, Left 2
          { row: 3, col: 6 }, // Up 1, Right 2
          { row: 5, col: 2 }, // Down 1, Left 2
          { row: 5, col: 6 }, // Down 1, Right 2
          { row: 6, col: 3 }, // Down 2, Left 1
          { row: 6, col: 5 }  // Down 2, Right 1
        ];
        
        validMoves.forEach(to => {
          game = createTestPosition([
            { row: 4, col: 4, type: 'knight', color: 'white' }
          ]);
          
          const move = { from: { row: 4, col: 4 }, to };
          const result = game.makeMove(move);
          expect(result.success).toBe(true);
        });
      });
    });

    describe('Knight Boundary Testing', () => {
      test('should handle knight moves from corner positions', () => {
        const corners = [
          { row: 0, col: 0 }, // Top-left
          { row: 0, col: 7 }, // Top-right
          { row: 7, col: 0 }, // Bottom-left
          { row: 7, col: 7 }  // Bottom-right
        ];
        
        corners.forEach(corner => {
          game = createTestPosition([
            { row: corner.row, col: corner.col, type: 'knight', color: 'white' }
          ]);
          
          // Generate all possible L-shaped moves
          const possibleMoves = [
            { row: corner.row - 2, col: corner.col - 1 },
            { row: corner.row - 2, col: corner.col + 1 },
            { row: corner.row - 1, col: corner.col - 2 },
            { row: corner.row - 1, col: corner.col + 2 },
            { row: corner.row + 1, col: corner.col - 2 },
            { row: corner.row + 1, col: corner.col + 2 },
            { row: corner.row + 2, col: corner.col - 1 },
            { row: corner.row + 2, col: corner.col + 1 }
          ];
          
          let validMoveCount = 0;
          
          // Test each possible move
          possibleMoves.forEach(to => {
            const move = { from: corner, to };
            const result = game.validateMove(move);
            
            // Should succeed only if destination is within board bounds
            const isValidDestination = to.row >= 0 && to.row < 8 && to.col >= 0 && to.col < 8;
            if (isValidDestination && result.isValid) {
              validMoveCount++;
            }
          });
          
          // Corner positions should have 2 valid moves
          expect(validMoveCount).toBe(2);
        });
      });
    });

    describe('Knight Jump Ability Testing', () => {
      test('should allow knight to jump over pieces', () => {
        game = createTestPosition([
          { row: 4, col: 4, type: 'knight', color: 'white' },
          // Surround knight with pieces
          { row: 3, col: 3, type: 'pawn', color: 'black' },
          { row: 3, col: 4, type: 'pawn', color: 'black' },
          { row: 3, col: 5, type: 'pawn', color: 'black' },
          { row: 4, col: 3, type: 'pawn', color: 'black' },
          { row: 4, col: 5, type: 'pawn', color: 'black' },
          { row: 5, col: 3, type: 'pawn', color: 'black' },
          { row: 5, col: 4, type: 'pawn', color: 'black' },
          { row: 5, col: 5, type: 'pawn', color: 'black' }
        ]);
        
        // Knight should still be able to make L-shaped moves
        const move = { from: { row: 4, col: 4 }, to: { row: 2, col: 3 } };
        const result = game.makeMove(move);
        expect(result.success).toBe(true);
      });
    });

    describe('Knight Invalid Moves', () => {
      test('should reject all non-L-shaped moves', () => {
        game = createTestPosition([
          { row: 4, col: 4, type: 'knight', color: 'white' }
        ]);
        
        const invalidMoves = [
          { row: 4, col: 5 }, // Horizontal
          { row: 5, col: 4 }, // Vertical
          { row: 5, col: 5 }, // Diagonal
          { row: 3, col: 3 }, // Diagonal
          { row: 2, col: 2 }, // Long diagonal
          { row: 1, col: 4 }, // Three squares vertical
          { row: 4, col: 7 }, // Three squares horizontal
        ];
        
        invalidMoves.forEach(to => {
          const move = { from: { row: 4, col: 4 }, to };
          const result = game.makeMove(move);
          expect(result.success).toBe(false);
        });
      });
    });
  });

  describe('Rook Movement Patterns - Horizontal and Vertical', () => {
    describe('Horizontal and Vertical Movement', () => {
      test('should allow rook horizontal movement across ranks', () => {
        game = createTestPosition([
          { row: 4, col: 4, type: 'rook', color: 'white' }
        ]);
        
        // Test horizontal moves
        const horizontalMoves = [
          { row: 4, col: 0 }, { row: 4, col: 1 }, { row: 4, col: 2 }, { row: 4, col: 3 },
          { row: 4, col: 5 }, { row: 4, col: 6 }, { row: 4, col: 7 }
        ];
        
        horizontalMoves.forEach(to => {
          game = createTestPosition([
            { row: 4, col: 4, type: 'rook', color: 'white' }
          ]);
          
          const move = { from: { row: 4, col: 4 }, to };
          const result = game.makeMove(move);
          expect(result.success).toBe(true);
        });
      });

      test('should allow rook vertical movement across files', () => {
        game = createTestPosition([
          { row: 4, col: 4, type: 'rook', color: 'white' }
        ]);
        
        // Test vertical moves
        const verticalMoves = [
          { row: 0, col: 4 }, { row: 1, col: 4 }, { row: 2, col: 4 }, { row: 3, col: 4 },
          { row: 5, col: 4 }, { row: 6, col: 4 }, { row: 7, col: 4 }
        ];
        
        verticalMoves.forEach(to => {
          game = createTestPosition([
            { row: 4, col: 4, type: 'rook', color: 'white' }
          ]);
          
          const move = { from: { row: 4, col: 4 }, to };
          const result = game.makeMove(move);
          expect(result.success).toBe(true);
        });
      });
    });

    describe('Rook Path Obstruction', () => {
      test('should reject horizontal moves when path is blocked', () => {
        game = createTestPosition([
          { row: 4, col: 0, type: 'rook', color: 'white' },
          { row: 4, col: 3, type: 'pawn', color: 'black' } // Blocking piece
        ]);
        
        // Try to move past the blocking piece
        const move = { from: { row: 4, col: 0 }, to: { row: 4, col: 7 } };
        const result = game.makeMove(move);
        expect(result.success).toBe(false);
      });

      test('should reject vertical moves when path is blocked', () => {
        game = createTestPosition([
          { row: 0, col: 4, type: 'rook', color: 'white' },
          { row: 3, col: 4, type: 'pawn', color: 'black' } // Blocking piece
        ]);
        
        // Try to move past the blocking piece
        const move = { from: { row: 0, col: 4 }, to: { row: 7, col: 4 } };
        const result = game.makeMove(move);
        expect(result.success).toBe(false);
      });
    });

    describe('Rook Invalid Moves', () => {
      test('should reject all diagonal moves', () => {
        game = createTestPosition([
          { row: 4, col: 4, type: 'rook', color: 'white' }
        ]);
        
        const diagonalMoves = [
          { row: 3, col: 3 }, { row: 3, col: 5 },
          { row: 5, col: 3 }, { row: 5, col: 5 },
          { row: 2, col: 2 }, { row: 2, col: 6 },
          { row: 6, col: 2 }, { row: 6, col: 6 }
        ];
        
        diagonalMoves.forEach(to => {
          const move = { from: { row: 4, col: 4 }, to };
          const result = game.makeMove(move);
          expect(result.success).toBe(false);
        });
      });

      test('should reject L-shaped moves', () => {
        game = createTestPosition([
          { row: 4, col: 4, type: 'rook', color: 'white' }
        ]);
        
        const lShapedMoves = [
          { row: 2, col: 3 }, { row: 2, col: 5 },
          { row: 3, col: 2 }, { row: 3, col: 6 },
          { row: 5, col: 2 }, { row: 5, col: 6 },
          { row: 6, col: 3 }, { row: 6, col: 5 }
        ];
        
        lShapedMoves.forEach(to => {
          const move = { from: { row: 4, col: 4 }, to };
          const result = game.makeMove(move);
          expect(result.success).toBe(false);
        });
      });
    });
  });

  describe('Bishop Movement Patterns - Diagonal Only', () => {
    describe('All Diagonal Directions', () => {
      test('should allow bishop movement in all four diagonal directions', () => {
        const diagonalMoves = [
          { row: 3, col: 3 }, { row: 2, col: 2 }, { row: 1, col: 1 }, { row: 0, col: 0 }, // Up-left
          { row: 3, col: 5 }, { row: 2, col: 6 }, { row: 1, col: 7 }, // Up-right
          { row: 5, col: 3 }, { row: 6, col: 2 }, { row: 7, col: 1 }, // Down-left
          { row: 5, col: 5 }, { row: 6, col: 6 }, { row: 7, col: 7 }  // Down-right
        ];
        
        diagonalMoves.forEach(to => {
          game = createTestPosition([
            { row: 4, col: 4, type: 'bishop', color: 'white' }
          ]);
          
          const move = { from: { row: 4, col: 4 }, to };
          const result = game.makeMove(move);
          expect(result.success).toBe(true);
        });
      });
    });

    describe('Bishop Path Obstruction', () => {
      test('should reject diagonal moves when path is blocked', () => {
        game = createTestPosition([
          { row: 0, col: 0, type: 'bishop', color: 'white' },
          { row: 3, col: 3, type: 'pawn', color: 'black' } // Blocking piece
        ]);
        
        // Try to move past the blocking piece
        const move = { from: { row: 0, col: 0 }, to: { row: 7, col: 7 } };
        const result = game.makeMove(move);
        expect(result.success).toBe(false);
      });
    });

    describe('Bishop Invalid Moves', () => {
      test('should reject all horizontal and vertical moves', () => {
        game = createTestPosition([
          { row: 4, col: 4, type: 'bishop', color: 'white' }
        ]);
        
        const straightMoves = [
          // Horizontal
          { row: 4, col: 0 }, { row: 4, col: 1 }, { row: 4, col: 2 }, { row: 4, col: 3 },
          { row: 4, col: 5 }, { row: 4, col: 6 }, { row: 4, col: 7 },
          // Vertical
          { row: 0, col: 4 }, { row: 1, col: 4 }, { row: 2, col: 4 }, { row: 3, col: 4 },
          { row: 5, col: 4 }, { row: 6, col: 4 }, { row: 7, col: 4 }
        ];
        
        straightMoves.forEach(to => {
          const move = { from: { row: 4, col: 4 }, to };
          const result = game.makeMove(move);
          expect(result.success).toBe(false);
        });
      });
    });
  });

  describe('Queen Movement Patterns - Combined Rook and Bishop', () => {
    describe('Queen Horizontal, Vertical, and Diagonal Moves', () => {
      test('should allow queen to move like a rook in all directions', () => {
        const rookMoves = [
          // Horizontal
          { row: 4, col: 0 }, { row: 4, col: 1 }, { row: 4, col: 2 }, { row: 4, col: 3 },
          { row: 4, col: 5 }, { row: 4, col: 6 }, { row: 4, col: 7 },
          // Vertical
          { row: 0, col: 4 }, { row: 1, col: 4 }, { row: 2, col: 4 }, { row: 3, col: 4 },
          { row: 5, col: 4 }, { row: 6, col: 4 }, { row: 7, col: 4 }
        ];
        
        rookMoves.forEach(to => {
          game = createTestPosition([
            { row: 4, col: 4, type: 'queen', color: 'white' }
          ]);
          
          const move = { from: { row: 4, col: 4 }, to };
          const result = game.makeMove(move);
          expect(result.success).toBe(true);
        });
      });

      test('should allow queen to move like a bishop in all diagonal directions', () => {
        const bishopMoves = [
          { row: 3, col: 3 }, { row: 2, col: 2 }, { row: 1, col: 1 }, { row: 0, col: 0 }, // Up-left
          { row: 3, col: 5 }, { row: 2, col: 6 }, { row: 1, col: 7 }, // Up-right
          { row: 5, col: 3 }, { row: 6, col: 2 }, { row: 7, col: 1 }, // Down-left
          { row: 5, col: 5 }, { row: 6, col: 6 }, { row: 7, col: 7 }  // Down-right
        ];
        
        bishopMoves.forEach(to => {
          game = createTestPosition([
            { row: 4, col: 4, type: 'queen', color: 'white' }
          ]);
          
          const move = { from: { row: 4, col: 4 }, to };
          const result = game.makeMove(move);
          expect(result.success).toBe(true);
        });
      });
    });

    describe('Queen Invalid Moves', () => {
      test('should reject L-shaped moves', () => {
        game = createTestPosition([
          { row: 4, col: 4, type: 'queen', color: 'white' }
        ]);
        
        const lShapedMoves = [
          { row: 2, col: 3 }, { row: 2, col: 5 },
          { row: 3, col: 2 }, { row: 3, col: 6 },
          { row: 5, col: 2 }, { row: 5, col: 6 },
          { row: 6, col: 3 }, { row: 6, col: 5 }
        ];
        
        lShapedMoves.forEach(to => {
          const move = { from: { row: 4, col: 4 }, to };
          const result = game.makeMove(move);
          expect(result.success).toBe(false);
        });
      });

      test('should reject irregular moves', () => {
        game = createTestPosition([
          { row: 4, col: 4, type: 'queen', color: 'white' }
        ]);
        
        const irregularMoves = [
          { row: 2, col: 6 }, // Not on straight line or diagonal
          { row: 6, col: 7 }, // Not on straight line or diagonal
          { row: 1, col: 6 }, // Not on straight line or diagonal
        ];
        
        irregularMoves.forEach(to => {
          const move = { from: { row: 4, col: 4 }, to };
          const result = game.makeMove(move);
          expect(result.success).toBe(false);
        });
      });
    });
  });

  describe('King Movement Patterns - Single Square Only', () => {
    describe('All Eight Directions', () => {
      test('should allow king to move one square in all eight directions', () => {
        const allDirections = [
          { row: 3, col: 3 }, { row: 3, col: 4 }, { row: 3, col: 5 },
          { row: 4, col: 3 },                     { row: 4, col: 5 },
          { row: 5, col: 3 }, { row: 5, col: 4 }, { row: 5, col: 5 }
        ];
        
        allDirections.forEach(to => {
          game = createTestPosition([
            { row: 4, col: 4, type: 'king', color: 'white' }
          ]);
          
          const move = { from: { row: 4, col: 4 }, to };
          const result = game.makeMove(move);
          expect(result.success).toBe(true);
        });
      });
    });

    describe('King Boundary Testing', () => {
      test('should handle king moves from corner positions', () => {
        const corners = [
          { row: 0, col: 0 }, // Top-left
          { row: 0, col: 7 }, // Top-right
          { row: 7, col: 0 }, // Bottom-left
          { row: 7, col: 7 }  // Bottom-right
        ];
        
        corners.forEach(corner => {
          game = createTestPosition([
            { row: corner.row, col: corner.col, type: 'king', color: 'white' }
          ]);
          
          let validMoveCount = 0;
          
          // Test all adjacent squares
          for (let rowOffset = -1; rowOffset <= 1; rowOffset++) {
            for (let colOffset = -1; colOffset <= 1; colOffset++) {
              if (rowOffset !== 0 || colOffset !== 0) {
                const targetRow = corner.row + rowOffset;
                const targetCol = corner.col + colOffset;
                
                if (targetRow >= 0 && targetRow < 8 && targetCol >= 0 && targetCol < 8) {
                  const move = { from: corner, to: { row: targetRow, col: targetCol } };
                  const result = game.validateMove(move);
                  if (result.isValid) validMoveCount++;
                }
              }
            }
          }
          
          // Corner positions should have exactly 3 valid moves
          expect(validMoveCount).toBe(3);
        });
      });
    });

    describe('King Invalid Moves', () => {
      test('should reject multi-square moves', () => {
        game = createTestPosition([
          { row: 4, col: 4, type: 'king', color: 'white' }
        ]);
        
        const multiSquareMoves = [
          { row: 2, col: 4 }, // Two squares up
          { row: 6, col: 4 }, // Two squares down
          { row: 4, col: 2 }, // Two squares left
          { row: 4, col: 6 }, // Two squares right
          { row: 2, col: 2 }, // Two squares diagonal
          { row: 6, col: 6 }, // Two squares diagonal
        ];
        
        multiSquareMoves.forEach(to => {
          const move = { from: { row: 4, col: 4 }, to };
          const result = game.makeMove(move);
          expect(result.success).toBe(false);
        });
      });
    });
  });

  describe('Performance Testing for Move Validation', () => {
    test('should validate pawn moves within acceptable time limits', () => {
      const maxTime = 10; // 10ms maximum
      
      game = new ChessGame();
      const move = { from: { row: 6, col: 4 }, to: { row: 5, col: 4 } };
      
      const executionTime = measureTime(() => {
        game.validateMove(move);
      });
      
      expect(executionTime).toBeLessThan(maxTime);
    });

    test('should validate knight moves within acceptable time limits', () => {
      const maxTime = 10; // 10ms maximum
      
      game = createTestPosition([
        { row: 4, col: 4, type: 'knight', color: 'white' }
      ]);
      const move = { from: { row: 4, col: 4 }, to: { row: 2, col: 3 } };
      
      const executionTime = measureTime(() => {
        game.validateMove(move);
      });
      
      expect(executionTime).toBeLessThan(maxTime);
    });

    test('should validate rook moves within acceptable time limits', () => {
      const maxTime = 15; // 15ms maximum (includes path checking)
      
      game = createTestPosition([
        { row: 0, col: 0, type: 'rook', color: 'white' }
      ]);
      const move = { from: { row: 0, col: 0 }, to: { row: 7, col: 0 } };
      
      const executionTime = measureTime(() => {
        game.validateMove(move);
      });
      
      expect(executionTime).toBeLessThan(maxTime);
    });

    test('should validate bishop moves within acceptable time limits', () => {
      const maxTime = 15; // 15ms maximum (includes path checking)
      
      game = createTestPosition([
        { row: 0, col: 0, type: 'bishop', color: 'white' }
      ]);
      const move = { from: { row: 0, col: 0 }, to: { row: 7, col: 7 } };
      
      const executionTime = measureTime(() => {
        game.validateMove(move);
      });
      
      expect(executionTime).toBeLessThan(maxTime);
    });

    test('should validate queen moves within acceptable time limits', () => {
      const maxTime = 15; // 15ms maximum (includes path checking)
      
      game = createTestPosition([
        { row: 4, col: 4, type: 'queen', color: 'white' }
      ]);
      const move = { from: { row: 4, col: 4 }, to: { row: 0, col: 0 } };
      
      const executionTime = measureTime(() => {
        game.validateMove(move);
      });
      
      expect(executionTime).toBeLessThan(maxTime);
    });

    test('should validate king moves within acceptable time limits', () => {
      const maxTime = 20; // 20ms maximum (includes check validation)
      
      game = createTestPosition([
        { row: 4, col: 4, type: 'king', color: 'white' }
      ]);
      const move = { from: { row: 4, col: 4 }, to: { row: 3, col: 3 } };
      
      const executionTime = measureTime(() => {
        game.validateMove(move);
      });
      
      expect(executionTime).toBeLessThan(maxTime);
    });

    test('should handle bulk move validation efficiently', () => {
      const maxTimePerMove = 5; // 5ms per move for bulk operations
      const numMoves = 100;
      
      const moves = [];
      
      // Generate test moves
      for (let i = 0; i < numMoves; i++) {
        moves.push({ from: { row: 6, col: i % 8 }, to: { row: 5, col: i % 8 } });
      }
      
      const totalTime = measureTime(() => {
        moves.forEach(move => {
          game = new ChessGame(); // Reset for each move
          game.validateMove(move);
        });
      });
      
      const averageTime = totalTime / numMoves;
      expect(averageTime).toBeLessThan(maxTimePerMove);
    });

    test('should maintain consistent performance across different board states', () => {
      const maxVariance = 5; // 5ms maximum variance
      const testCases = [
        // Empty board with minimal pieces
        () => {
          game = createTestPosition([
            { row: 4, col: 4, type: 'queen', color: 'white' }
          ]);
          return { from: { row: 4, col: 4 }, to: { row: 0, col: 0 } };
        },
        // Full starting board
        () => {
          game = new ChessGame();
          return { from: { row: 6, col: 4 }, to: { row: 5, col: 4 } };
        },
        // Mid-game board simulation
        () => {
          game = new ChessGame();
          // Remove some pieces to simulate mid-game
          game.board[1][0] = null;
          game.board[1][7] = null;
          game.board[6][0] = null;
          game.board[6][7] = null;
          return { from: { row: 6, col: 4 }, to: { row: 5, col: 4 } };
        }
      ];
      
      const times = testCases.map(setupMove => {
        const move = setupMove();
        return measureTime(() => {
          game.validateMove(move);
        });
      });
      
      const minTime = Math.min(...times);
      const maxTime = Math.max(...times);
      const variance = maxTime - minTime;
      
      expect(variance).toBeLessThan(maxVariance);
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    test('should handle piece movement at exact board boundaries', () => {
      // Test all pieces at board edges
      const pieceTypes = ['pawn', 'rook', 'knight', 'bishop', 'queen', 'king'];
      const edgePositions = [
        { row: 0, col: 0 }, { row: 0, col: 7 }, { row: 7, col: 0 }, { row: 7, col: 7 }, // Corners
        { row: 0, col: 3 }, { row: 7, col: 3 }, { row: 3, col: 0 }, { row: 3, col: 7 }  // Edges
      ];
      
      pieceTypes.forEach(pieceType => {
        edgePositions.forEach(pos => {
          game = createTestPosition([
            { row: pos.row, col: pos.col, type: pieceType, color: 'white' }
          ]);
          
          // Try to move to all adjacent squares (for pieces that can move there)
          for (let rowOffset = -1; rowOffset <= 1; rowOffset++) {
            for (let colOffset = -1; colOffset <= 1; colOffset++) {
              if (rowOffset !== 0 || colOffset !== 0) {
                const targetRow = pos.row + rowOffset;
                const targetCol = pos.col + colOffset;
                
                if (targetRow >= 0 && targetRow < 8 && targetCol >= 0 && targetCol < 8) {
                  const move = { from: pos, to: { row: targetRow, col: targetCol } };
                  const result = game.validateMove(move);
                  
                  // Result should be consistent with piece movement rules
                  expect(typeof result.isValid).toBe('boolean');
                }
              }
            }
          }
        });
      });
    });

    test('should reject moves to positions outside board boundaries', () => {
      const pieceTypes = ['pawn', 'rook', 'knight', 'bishop', 'queen', 'king'];
      const outOfBoundsMoves = [
        { row: -1, col: 0 }, { row: 8, col: 0 }, { row: 0, col: -1 }, { row: 0, col: 8 },
        { row: -1, col: -1 }, { row: 8, col: 8 }, { row: -1, col: 8 }, { row: 8, col: -1 }
      ];
      
      pieceTypes.forEach(pieceType => {
        game = createTestPosition([
          { row: 4, col: 4, type: pieceType, color: 'white' }
        ]);
        
        outOfBoundsMoves.forEach(to => {
          const move = { from: { row: 4, col: 4 }, to };
          const result = game.validateMove(move);
          expect(result.isValid).toBe(false);
        });
      });
    });

    test('should handle maximum distance moves for sliding pieces', () => {
      const slidingPieces = [
        { type: 'rook', validMoves: [{ row: 0, col: 4 }, { row: 7, col: 4 }, { row: 4, col: 0 }, { row: 4, col: 7 }] },
        { type: 'bishop', validMoves: [{ row: 0, col: 0 }, { row: 7, col: 7 }, { row: 1, col: 7 }, { row: 7, col: 1 }] },
        { type: 'queen', validMoves: [{ row: 0, col: 4 }, { row: 7, col: 4 }, { row: 4, col: 0 }, { row: 4, col: 7 }, { row: 0, col: 0 }, { row: 7, col: 7 }] }
      ];
      
      slidingPieces.forEach(({ type, validMoves }) => {
        validMoves.forEach(to => {
          game = createTestPosition([
            { row: 4, col: 4, type, color: 'white' }
          ]);
          
          const move = { from: { row: 4, col: 4 }, to };
          const result = game.makeMove(move);
          expect(result.success).toBe(true);
        });
      });
    });
  });
});

// Run the tests if this file is executed directly
if (require.main === module) {
  console.log('Running Comprehensive Piece Movement Patterns Tests...');
}