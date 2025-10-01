const ChessGame = require('../src/shared/chessGame');

describe('Comprehensive Queen Movement Validation', () => {
  let game;

  beforeEach(() => {
    game = new ChessGame();
  });

  describe('Queen Horizontal and Vertical Moves', () => {
    test('should allow queen horizontal moves with path clearing validation', () => {
      // Create fresh game and set up board with queen in center
      game = new ChessGame();
      
      // Place kings for valid game state
      game.board[7][4] = { type: 'king', color: 'white' };
      game.board[0][4] = { type: 'king', color: 'black' };
      
      // Place queen in center and clear original queen
      game.board[4][4] = { type: 'queen', color: 'white' };
      game.board[7][3] = null;
      
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
        const result = game.makeMove({ from: { row: 4, col: 4 }, to: to });
        
        // Validate success response
        expect(result.success).toBe(true);
        expect(result.message).toBeDefined();
        expect(result.data).toBeDefined();
        expect(game.board[to.row][to.col]).toEqual({ type: 'queen', color: 'white' });
        expect(game.board[4][4]).toBe(null);
        
        // Reset for next test
        game.board[4][4] = { type: 'queen', color: 'white' };
        game.board[to.row][to.col] = null;
        game.currentTurn = 'white';
      });
    });

    test('should allow queen vertical moves with path clearing validation', () => {
      // Create fresh game and set up board with queen in center
      game = new ChessGame();
      
      // Clear the board completely
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          game.board[row][col] = null;
        }
      }
      
      // Place kings for valid game state (avoiding vertical path)
      game.board[7][3] = { type: 'king', color: 'white' };
      game.board[0][3] = { type: 'king', color: 'black' };
      
      // Place queen in center
      game.board[4][4] = { type: 'queen', color: 'white' };
      
      // Ensure game is active and it's white's turn
      game.gameStatus = 'active';
      game.currentTurn = 'white';
      
      // Test vertical moves in both directions
      const verticalMoves = [
        { row: 0, col: 4 }, // Up
        { row: 6, col: 4 }  // Down (avoiding king at 7,3)
      ];
      
      verticalMoves.forEach((to) => {
        // Ensure queen is at starting position before each move
        game.board[4][4] = { type: 'queen', color: 'white' };
        game.board[to.row][to.col] = null;
        game.currentTurn = 'white';
        game.gameStatus = 'active'; // Reset game status
        
        const result = game.makeMove({ from: { row: 4, col: 4 }, to: to });
        
        // Validate success response
        expect(result.success).toBe(true);
        expect(result.message).toBeDefined();
        expect(result.data).toBeDefined();
        expect(game.board[to.row][to.col]).toEqual({ type: 'queen', color: 'white' });
        expect(game.board[4][4]).toBe(null);
      });
    });

    test('should reject horizontal moves when path is blocked', () => {
      // Create fresh game and set up board
      game = new ChessGame();
      
      // Place kings for valid game state
      game.board[7][4] = { type: 'king', color: 'white' };
      game.board[0][4] = { type: 'king', color: 'black' };
      
      // Place queen and clear original queen
      game.board[4][4] = { type: 'queen', color: 'white' };
      game.board[7][3] = null;
      
      // Place blocking piece
      game.board[4][6] = { type: 'pawn', color: 'black' };
      
      // Try to move past the blocking piece
      const result = game.makeMove({ from: { row: 4, col: 4 }, to: { row: 4, col: 7 } });
      
      // Validate error response
      expect(result.success).toBe(false);
      expect(result.message).toBeDefined();
      expect(result.errorCode).toBe('PATH_BLOCKED');
    });

    test('should reject vertical moves when path is blocked', () => {
      // Create fresh game and set up board
      game = new ChessGame();
      
      // Place kings for valid game state
      game.board[7][4] = { type: 'king', color: 'white' };
      game.board[0][4] = { type: 'king', color: 'black' };
      
      // Place queen and clear original queen
      game.board[4][4] = { type: 'queen', color: 'white' };
      game.board[7][3] = null;
      
      // Place blocking piece
      game.board[2][4] = { type: 'pawn', color: 'black' };
      
      // Try to move past the blocking piece
      const result = game.makeMove({ from: { row: 4, col: 4 }, to: { row: 0, col: 4 } });
      
      // Validate error response
      expect(result.success).toBe(false);
      expect(result.message).toBeDefined();
      expect(result.errorCode).toBe('PATH_BLOCKED');
    });
  });

  describe('Queen Diagonal Moves in All Four Directions', () => {
    test('should allow queen diagonal moves in all four diagonal directions', () => {
      // Create fresh game and set up board
      game = new ChessGame();
      
      // Place kings for valid game state
      game.board[7][4] = { type: 'king', color: 'white' };
      game.board[0][4] = { type: 'king', color: 'black' };
      
      // Place queen in center and clear original queen
      game.board[4][4] = { type: 'queen', color: 'white' };
      game.board[7][3] = null;
      
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
        const result = game.makeMove({ from: { row: 4, col: 4 }, to: to });
        
        // Validate success response
        expect(result.success).toBe(true);
        expect(result.message).toBeDefined();
        expect(result.data).toBeDefined();
        expect(game.board[to.row][to.col]).toEqual({ type: 'queen', color: 'white' });
        expect(game.board[4][4]).toBe(null);
        
        // Reset for next test
        game.board[4][4] = { type: 'queen', color: 'white' };
        game.board[to.row][to.col] = null;
        game.currentTurn = 'white';
      });
    });

    test('should allow queen to move across entire diagonal when path is clear', () => {
      // Create fresh game and set up board
      game = new ChessGame();
      
      // Place kings for valid game state (avoiding diagonal path)
      game.board[7][4] = { type: 'king', color: 'white' };
      game.board[0][4] = { type: 'king', color: 'black' };
      
      // Place queen at corner and clear original queen
      game.board[0][0] = { type: 'queen', color: 'white' };
      game.board[7][3] = null;
      
      // Clear diagonal path including destination
      const diagonalPath = [[1, 1], [2, 2], [3, 3], [4, 4], [5, 5], [6, 6], [7, 7]];
      diagonalPath.forEach(([row, col]) => {
        game.board[row][col] = null;
      });
      
      // Move across entire diagonal
      const result = game.makeMove({ from: { row: 0, col: 0 }, to: { row: 7, col: 7 } });
      
      // Validate success response
      expect(result.success).toBe(true);
      expect(result.message).toBeDefined();
      expect(result.data).toBeDefined();
      expect(game.board[7][7]).toEqual({ type: 'queen', color: 'white' });
      expect(game.board[0][0]).toBe(null);
    });

    test('should reject diagonal moves when path is blocked', () => {
      // Create fresh game and set up board
      game = new ChessGame();
      
      // Place kings for valid game state
      game.board[7][4] = { type: 'king', color: 'white' };
      game.board[0][4] = { type: 'king', color: 'black' };
      
      // Place queen and clear original queen
      game.board[4][4] = { type: 'queen', color: 'white' };
      game.board[7][3] = null;
      
      // Place blocking piece on diagonal path
      game.board[3][3] = { type: 'pawn', color: 'black' };
      
      // Try to move past the blocking piece
      const result = game.makeMove({ from: { row: 4, col: 4 }, to: { row: 2, col: 2 } });
      
      // Validate error response
      expect(result.success).toBe(false);
      expect(result.message).toBeDefined();
      expect(result.errorCode).toBe('PATH_BLOCKED');
    });
  });

  describe('Invalid Queen Moves and Complex Path Obstruction Scenarios', () => {
    test('should reject L-shaped moves (not rook or bishop pattern)', () => {
      // Create fresh game and set up board
      game = new ChessGame();
      
      // Place kings for valid game state
      game.board[7][4] = { type: 'king', color: 'white' };
      game.board[0][4] = { type: 'king', color: 'black' };
      
      // Place queen and clear original queen
      game.board[4][4] = { type: 'queen', color: 'white' };
      game.board[7][3] = null;
      
      const result = game.makeMove({ from: { row: 4, col: 4 }, to: { row: 6, col: 5 } });
      
      // Validate error response
      expect(result.success).toBe(false);
      expect(result.message).toBeDefined();
      expect(result.errorCode).toBe('INVALID_MOVEMENT');
    });

    test('should reject irregular moves that are neither straight nor diagonal', () => {
      // Create fresh game and set up board
      game = new ChessGame();
      
      // Place kings for valid game state
      game.board[7][4] = { type: 'king', color: 'white' };
      game.board[0][4] = { type: 'king', color: 'black' };
      
      // Place queen and clear original queen
      game.board[4][4] = { type: 'queen', color: 'white' };
      game.board[7][3] = null;
      
      // Move that's not on a straight line or true diagonal
      const result = game.makeMove({ from: { row: 4, col: 4 }, to: { row: 6, col: 7 } });
      
      // Validate error response
      expect(result.success).toBe(false);
      expect(result.message).toBeDefined();
      expect(result.errorCode).toBe('INVALID_MOVEMENT');
    });

    test('should reject capturing own pieces', () => {
      // Create fresh game and set up board
      game = new ChessGame();
      
      // Place kings for valid game state
      game.board[7][4] = { type: 'king', color: 'white' };
      game.board[0][4] = { type: 'king', color: 'black' };
      
      // Place queen and clear original queen
      game.board[4][4] = { type: 'queen', color: 'white' };
      game.board[7][3] = null;
      
      // Place own piece at destination
      game.board[4][7] = { type: 'pawn', color: 'white' };
      
      const result = game.makeMove({ from: { row: 4, col: 4 }, to: { row: 4, col: 7 } });
      
      // Validate error response
      expect(result.success).toBe(false);
      expect(result.message).toBeDefined();
      expect(result.errorCode).toBe('CAPTURE_OWN_PIECE');
    });

    test('should handle complex path obstruction with multiple pieces', () => {
      // Create fresh game and set up board
      game = new ChessGame();
      
      // Place kings for valid game state
      game.board[7][4] = { type: 'king', color: 'white' };
      game.board[0][4] = { type: 'king', color: 'black' };
      
      // Place queen and clear original queen
      game.board[4][4] = { type: 'queen', color: 'white' };
      game.board[7][3] = null;
      
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
        const result = game.makeMove({ from: { row: 4, col: 4 }, to: to });
        
        // Validate error response
        expect(result.success).toBe(false);
        expect(result.message).toBeDefined();
        expect(result.errorCode).toBe('PATH_BLOCKED');
      });
    });

    test('should allow queen to capture pieces at destination when path is clear', () => {
      // Create fresh game and set up board
      game = new ChessGame();
      
      // Place kings for valid game state (avoiding capture paths)
      game.board[7][0] = { type: 'king', color: 'white' };
      game.board[0][0] = { type: 'king', color: 'black' };
      
      // Place queen and clear original queen
      game.board[4][4] = { type: 'queen', color: 'white' };
      game.board[7][3] = null;
      
      // Place enemy pieces at various destinations (with clear paths)
      game.board[4][7] = { type: 'pawn', color: 'black' }; // Horizontal
      game.board[1][4] = { type: 'pawn', color: 'black' }; // Vertical (avoiding king)
      game.board[2][2] = { type: 'pawn', color: 'black' }; // Diagonal
      
      // Clear paths to these pieces
      game.board[4][5] = null;
      game.board[4][6] = null;
      game.board[2][4] = null;
      game.board[3][4] = null;
      game.board[3][3] = null;
      
      const captureMoves = [
        { row: 4, col: 7 }, // Horizontal capture
        { row: 1, col: 4 }, // Vertical capture
        { row: 2, col: 2 }  // Diagonal capture
      ];
      
      captureMoves.forEach((to) => {
        const result = game.makeMove({ from: { row: 4, col: 4 }, to: to });
        
        // Validate success response
        expect(result.success).toBe(true);
        expect(result.message).toBeDefined();
        expect(result.data).toBeDefined();
        expect(game.board[to.row][to.col]).toEqual({ type: 'queen', color: 'white' });
        expect(game.board[4][4]).toBe(null);
        
        // Reset for next test
        game.board[4][4] = { type: 'queen', color: 'white' };
        game.board[to.row][to.col] = { type: 'pawn', color: 'black' };
        game.currentTurn = 'white';
      });
    });

    test('should validate queen movement combines both rook and bishop patterns correctly', () => {
      // Create fresh game and set up board
      game = new ChessGame();
      
      // Place kings for valid game state (avoiding test paths)
      game.board[6][0] = { type: 'king', color: 'white' };
      game.board[0][1] = { type: 'king', color: 'black' };
      
      // Place queen and clear original queen
      game.board[4][4] = { type: 'queen', color: 'white' };
      game.board[7][3] = null;
      
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
        { row: 4, col: 2 }, { row: 4, col: 7 }, // Horizontal
        { row: 2, col: 4 }, { row: 7, col: 4 }, // Vertical
        // Bishop-like moves
        { row: 2, col: 2 }, { row: 1, col: 7 }, // Diagonals
        { row: 7, col: 1 }, { row: 7, col: 7 }
      ];
      
      validQueenMoves.forEach((to) => {
        const result = game.makeMove({ from: { row: 4, col: 4 }, to: to });
        
        // Validate success response
        expect(result.success).toBe(true);
        expect(result.message).toBeDefined();
        expect(result.data).toBeDefined();
        
        // Reset for next test
        game.board[4][4] = { type: 'queen', color: 'white' };
        game.board[to.row][to.col] = null;
        game.currentTurn = 'white';
      });
    });

    test('should handle queen moves from corner and edge positions', () => {
      // Create fresh game and set up board
      game = new ChessGame();
      
      // Place kings for valid game state (avoiding test paths)
      game.board[6][4] = { type: 'king', color: 'white' };
      game.board[1][4] = { type: 'king', color: 'black' };
      
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
        { row: 5, col: 5 }  // Diagonal (shorter to avoid king)
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
          for (let i = 1; i <= 5; i++) {
            game.board[i][i] = null;
          }
        }
        
        const result = game.makeMove({ from: { row: 0, col: 0 }, to: to });
        
        // Validate success response
        expect(result.success).toBe(true);
        expect(result.message).toBeDefined();
        expect(result.data).toBeDefined();
        
        // Reset for next test
        game.board[0][0] = { type: 'queen', color: 'white' };
        game.board[to.row][to.col] = null;
        game.currentTurn = 'white';
      });
    });
  });
});

