const ChessGame = require('../src/shared/chessGame');

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
    }
  });
}

describe('Comprehensive Queen Movement Validation', () => {
  let game;

  beforeEach(() => {
    game = new ChessGame();
  });

  describe('Queen Horizontal and Vertical Moves', () => {
    test('should allow queen horizontal moves with path clearing validation', () => {
      game = new ChessGame(); // Reset game
      // Place queen in center
      game.board[4][4] = { type: 'queen', color: 'white' };
      game.board[7][3] = null; // Remove original queen
      
      // Clear horizontal path
      for (let col = 0; col < 8; col++) {
        if (col !== 4) {
          game.board[4][col] = null;
        }
      }
      
      // Test horizontal moves in both directions
      const horizontalMoves = [
        { row: 4, col: 0 }, // Left
        { row: 4, col: 7 }  // Right
      ];
      
      horizontalMoves.forEach((to) => {
        const move = { from: { row: 4, col: 4 }, to: to };
        const result = game.makeMove(move);
        expect(result.success).toBe(true);
        expect(game.board[to.row][to.col]).toEqual({ type: 'queen', color: 'white' });
        expect(game.board[4][4]).toBe(null);
        
        // Reset for next test
        game.board[4][4] = { type: 'queen', color: 'white' };
        game.board[to.row][to.col] = null;
        game.currentTurn = 'white';
      });
    });

    test('should allow queen vertical moves with path clearing validation', () => {
      game = new ChessGame(); // Reset game
      // Place queen in center
      game.board[4][4] = { type: 'queen', color: 'white' };
      game.board[7][3] = null; // Remove original queen
      
      // Clear vertical path
      for (let row = 0; row < 8; row++) {
        if (row !== 4) {
          game.board[row][4] = null;
        }
      }
      
      // Test vertical moves in both directions
      const verticalMoves = [
        { row: 0, col: 4 }, // Up
        { row: 7, col: 4 }  // Down
      ];
      
      verticalMoves.forEach((to) => {
        const move = { from: { row: 4, col: 4 }, to: to };
        const result = game.makeMove(move);
        expect(result.success).toBe(true);
        expect(game.board[to.row][to.col]).toEqual({ type: 'queen', color: 'white' });
        expect(game.board[4][4]).toBe(null);
        
        // Reset for next test
        game.board[4][4] = { type: 'queen', color: 'white' };
        game.board[to.row][to.col] = null;
        game.currentTurn = 'white';
      });
    });

    test('should reject horizontal moves when path is blocked', () => {
      game = new ChessGame(); // Reset game
      game.board[4][4] = { type: 'queen', color: 'white' };
      game.board[7][3] = null; // Remove original queen
      
      // Place blocking piece
      game.board[4][6] = { type: 'pawn', color: 'black' };
      
      // Try to move past the blocking piece
      const move = { from: { row: 4, col: 4 }, to: { row: 4, col: 7 } };
      const result = game.makeMove(move);
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('PATH_BLOCKED');
    });

    test('should reject vertical moves when path is blocked', () => {
      game = new ChessGame(); // Reset game
      game.board[4][4] = { type: 'queen', color: 'white' };
      game.board[7][3] = null; // Remove original queen
      
      // Place blocking piece
      game.board[2][4] = { type: 'pawn', color: 'black' };
      
      // Try to move past the blocking piece
      const move = { from: { row: 4, col: 4 }, to: { row: 0, col: 4 } };
      const result = game.makeMove(move);
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('PATH_BLOCKED');
    });
  });

  describe('Queen Diagonal Moves in All Four Directions', () => {
    test('should allow queen diagonal moves in all four diagonal directions', () => {
      game = new ChessGame(); // Reset game
      // Place queen in center
      game.board[4][4] = { type: 'queen', color: 'white' };
      game.board[7][3] = null; // Remove original queen
      
      // Clear all diagonal paths
      const diagonalSquares = [
        [3, 3], [2, 2], [1, 1], [0, 0], // Up-left diagonal
        [3, 5], [2, 6], [1, 7],         // Up-right diagonal
        [5, 3], [6, 2], [7, 1],         // Down-left diagonal
        [5, 5], [6, 6], [7, 7]          // Down-right diagonal
      ];
      
      diagonalSquares.forEach(([row, col]) => {
        game.board[row][col] = null;
      });
      
      // Test moves in all four diagonal directions
      const diagonalMoves = [
        { row: 2, col: 2 }, // Up-left
        { row: 2, col: 6 }, // Up-right
        { row: 6, col: 2 }, // Down-left
        { row: 6, col: 6 }  // Down-right
      ];
      
      diagonalMoves.forEach((to) => {
        const move = { from: { row: 4, col: 4 }, to: to };
        const result = game.makeMove(move);
        expect(result.success).toBe(true);
        expect(game.board[to.row][to.col]).toEqual({ type: 'queen', color: 'white' });
        expect(game.board[4][4]).toBe(null);
        
        // Reset for next test
        game.board[4][4] = { type: 'queen', color: 'white' };
        game.board[to.row][to.col] = null;
        game.currentTurn = 'white';
      });
    });

    test('should allow queen to move across entire diagonal when path is clear', () => {
      game = new ChessGame(); // Reset game
      game.board[0][0] = { type: 'queen', color: 'white' };
      game.board[7][3] = null; // Remove original queen
      
      // Clear diagonal path including destination
      const diagonalPath = [[1, 1], [2, 2], [3, 3], [4, 4], [5, 5], [6, 6], [7, 7]];
      diagonalPath.forEach(([row, col]) => {
        game.board[row][col] = null;
      });
      
      // Move across entire diagonal
      const move = { from: { row: 0, col: 0 }, to: { row: 7, col: 7 } };
      const result = game.makeMove(move);
      expect(result.success).toBe(true);
      expect(game.board[7][7]).toEqual({ type: 'queen', color: 'white' });
      expect(game.board[0][0]).toBe(null);
    });

    test('should reject diagonal moves when path is blocked', () => {
      game = new ChessGame(); // Reset game
      game.board[4][4] = { type: 'queen', color: 'white' };
      game.board[7][3] = null; // Remove original queen
      
      // Place blocking piece on diagonal path
      game.board[3][3] = { type: 'pawn', color: 'black' };
      
      // Try to move past the blocking piece
      const move = { from: { row: 4, col: 4 }, to: { row: 2, col: 2 } };
      const result = game.makeMove(move);
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('PATH_BLOCKED');
    });
  });

  describe('Invalid Queen Moves and Complex Path Obstruction Scenarios', () => {
    test('should reject L-shaped moves (not rook or bishop pattern)', () => {
      game = new ChessGame(); // Reset game
      game.board[4][4] = { type: 'queen', color: 'white' };
      game.board[7][3] = null; // Remove original queen
      
      const lShapedMove = { from: { row: 4, col: 4 }, to: { row: 6, col: 5 } };
      const result = game.makeMove(lShapedMove);
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_MOVEMENT');
    });

    test('should reject irregular moves that are neither straight nor diagonal', () => {
      game = new ChessGame(); // Reset game
      game.board[4][4] = { type: 'queen', color: 'white' };
      game.board[7][3] = null; // Remove original queen
      
      // Move that's not on a straight line or true diagonal
      const irregularMove = { from: { row: 4, col: 4 }, to: { row: 6, col: 7 } };
      const result = game.makeMove(irregularMove);
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_MOVEMENT');
    });

    test('should reject capturing own pieces', () => {
      game = new ChessGame(); // Reset game
      game.board[4][4] = { type: 'queen', color: 'white' };
      game.board[7][3] = null; // Remove original queen
      
      // Place own piece at destination
      game.board[4][7] = { type: 'pawn', color: 'white' };
      
      const move = { from: { row: 4, col: 4 }, to: { row: 4, col: 7 } };
      const result = game.makeMove(move);
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('CAPTURE_OWN_PIECE');
    });

    test('should handle complex path obstruction with multiple pieces', () => {
      game = new ChessGame(); // Reset game
      game.board[4][4] = { type: 'queen', color: 'white' };
      game.board[7][3] = null; // Remove original queen
      
      // Place multiple pieces creating complex obstruction pattern
      game.board[4][5] = { type: 'pawn', color: 'black' }; // Horizontal block
      game.board[3][4] = { type: 'pawn', color: 'black' }; // Vertical block
      game.board[3][3] = { type: 'pawn', color: 'black' }; // Diagonal block
      
      // Test that all blocked directions are properly rejected
      const blockedMoves = [
        { row: 4, col: 7 }, // Horizontal (blocked by pawn at 4,5)
        { row: 0, col: 4 }, // Vertical (blocked by pawn at 3,4)
        { row: 2, col: 2 }  // Diagonal (blocked by pawn at 3,3)
      ];
      
      blockedMoves.forEach((to) => {
        const move = { from: { row: 4, col: 4 }, to: to };
        const result = game.makeMove(move);
        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('PATH_BLOCKED');
      });
    });

    test('should allow queen to capture pieces at destination when path is clear', () => {
      game = new ChessGame(); // Reset game
      game.board[4][4] = { type: 'queen', color: 'white' };
      game.board[7][3] = null; // Remove original queen
      
      // Place enemy pieces at various destinations (with clear paths)
      game.board[4][7] = { type: 'pawn', color: 'black' }; // Horizontal
      game.board[0][4] = { type: 'pawn', color: 'black' }; // Vertical
      game.board[2][2] = { type: 'pawn', color: 'black' }; // Diagonal
      
      // Clear paths to these pieces
      game.board[4][5] = null;
      game.board[4][6] = null;
      game.board[1][4] = null;
      game.board[2][4] = null;
      game.board[3][4] = null;
      game.board[3][3] = null;
      
      const captureMoves = [
        { row: 4, col: 7 }, // Horizontal capture
        { row: 0, col: 4 }, // Vertical capture
        { row: 2, col: 2 }  // Diagonal capture
      ];
      
      captureMoves.forEach((to) => {
        const move = { from: { row: 4, col: 4 }, to: to };
        const result = game.makeMove(move);
        expect(result.success).toBe(true);
        expect(game.board[to.row][to.col]).toEqual({ type: 'queen', color: 'white' });
        expect(game.board[4][4]).toBe(null);
        
        // Reset for next test
        game.board[4][4] = { type: 'queen', color: 'white' };
        game.board[to.row][to.col] = { type: 'pawn', color: 'black' };
        game.currentTurn = 'white';
      });
    });

    test('should validate queen movement combines both rook and bishop patterns correctly', () => {
      game = new ChessGame(); // Reset game
      game.board[4][4] = { type: 'queen', color: 'white' };
      game.board[7][3] = null; // Remove original queen
      
      // Clear paths for testing
      for (let i = 0; i < 8; i++) {
        if (i !== 4) {
          game.board[4][i] = null; // Clear horizontal
          game.board[i][4] = null; // Clear vertical
        }
      }
      
      // Clear diagonals
      const diagonalSquares = [
        [3, 3], [2, 2], [1, 1], [0, 0],
        [3, 5], [2, 6], [1, 7],
        [5, 3], [6, 2], [7, 1],
        [5, 5], [6, 6], [7, 7]
      ];
      diagonalSquares.forEach(([row, col]) => {
        game.board[row][col] = null;
      });
      
      // Test that queen can move like both rook and bishop
      const validQueenMoves = [
        // Rook-like moves
        { row: 4, col: 0 }, { row: 4, col: 7 }, // Horizontal
        { row: 0, col: 4 }, { row: 7, col: 4 }, // Vertical
        // Bishop-like moves
        { row: 0, col: 0 }, { row: 1, col: 7 }, // Diagonals
        { row: 7, col: 1 }, { row: 7, col: 7 }
      ];
      
      validQueenMoves.forEach((to) => {
        const move = { from: { row: 4, col: 4 }, to: to };
        const result = game.makeMove(move);
        expect(result.success).toBe(true);
        
        // Reset for next test
        game.board[4][4] = { type: 'queen', color: 'white' };
        game.board[to.row][to.col] = null;
        game.currentTurn = 'white';
      });
    });

    test('should handle queen moves from corner and edge positions', () => {
      game = new ChessGame(); // Reset game
      // Test queen from corner
      game.board[0][0] = { type: 'queen', color: 'white' };
      game.board[7][3] = null; // Remove original queen
      
      // Clear some paths
      game.board[0][1] = null;
      game.board[1][0] = null;
      game.board[1][1] = null;
      
      const cornerMoves = [
        { row: 0, col: 7 }, // Horizontal across top rank
        { row: 7, col: 0 }, // Vertical down left file
        { row: 7, col: 7 }  // Diagonal across board
      ];
      
      cornerMoves.forEach((to) => {
        // Clear path for each move including destination
        if (to.row === 0) {
          // Clear horizontal path including destination
          for (let col = 1; col <= 7; col++) {
            game.board[0][col] = null;
          }
        } else if (to.col === 0) {
          // Clear vertical path including destination
          for (let row = 1; row <= 7; row++) {
            game.board[row][0] = null;
          }
        } else {
          // Clear diagonal path including destination
          for (let i = 1; i <= 7; i++) {
            game.board[i][i] = null;
          }
        }
        
        const move = { from: { row: 0, col: 0 }, to: to };
        const result = game.makeMove(move);
        expect(result.success).toBe(true);
        
        // Reset for next test
        game.board[0][0] = { type: 'queen', color: 'white' };
        game.board[to.row][to.col] = null;
        game.currentTurn = 'white';
      });
    });
  });
});

// Run the tests if this file is executed directly
if (require.main === module) {
  console.log('Running Queen Movement Validation Tests...');
}