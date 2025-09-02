const ChessGame = require('../src/shared/chessGame');

describe('Comprehensive Checkmate Detection System', () => {
  let game;

  beforeEach(() => {
    game = new ChessGame();
  });

  describe('Basic Checkmate Scenarios', () => {
    test('should detect back rank mate with rook', () => {
      // Set up back rank mate scenario
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      
      // White king trapped on back rank by own pawns
      game.board[7][4] = { type: 'king', color: 'white' };
      game.board[6][3] = { type: 'pawn', color: 'white' };
      game.board[6][4] = { type: 'pawn', color: 'white' };
      game.board[6][5] = { type: 'pawn', color: 'white' };
      
      // Black rook delivering checkmate
      game.board[7][0] = { type: 'rook', color: 'black' };
      
      // Black king (required for valid position)
      game.board[0][4] = { type: 'king', color: 'black' };
      
      game.currentTurn = 'white';
      
      // Verify checkmate detection
      expect(game.isInCheck('white')).toBe(true);
      expect(game.isCheckmate('white')).toBe(true);
      expect(game.hasValidMoves('white')).toBe(false);
      
      // Test game ending logic
      game.checkGameEnd();
      expect(game.gameStatus).toBe('checkmate');
      expect(game.winner).toBe('black');
    });

    test('should detect simple corner checkmate', () => {
      // Set up simple corner checkmate
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      
      // White king in corner
      game.board[0][0] = { type: 'king', color: 'white' };
      
      // Black pieces delivering mate
      game.board[0][2] = { type: 'queen', color: 'black' }; // Attacks king horizontally and controls escape squares
      game.board[2][1] = { type: 'king', color: 'black' }; // Supports queen and controls escape squares
      
      game.currentTurn = 'white';
      
      // Verify checkmate detection
      expect(game.isInCheck('white')).toBe(true);
      expect(game.isCheckmate('white')).toBe(true);
      expect(game.hasValidMoves('white')).toBe(false);
      
      // Test game ending logic
      game.checkGameEnd();
      expect(game.gameStatus).toBe('checkmate');
      expect(game.winner).toBe('black');
    });

    test('should detect queen and king mate', () => {
      // Set up queen and king mate scenario
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      
      // White king in corner
      game.board[7][7] = { type: 'king', color: 'white' };
      
      // Black queen and king delivering mate
      game.board[6][6] = { type: 'queen', color: 'black' }; // Diagonal attack
      game.board[5][6] = { type: 'king', color: 'black' };
      
      game.currentTurn = 'white';
      
      // Verify checkmate detection
      expect(game.isInCheck('white')).toBe(true);
      expect(game.isCheckmate('white')).toBe(true);
      expect(game.hasValidMoves('white')).toBe(false);
      
      // Test game ending logic
      game.checkGameEnd();
      expect(game.gameStatus).toBe('checkmate');
      expect(game.winner).toBe('black');
    });

    test('should detect two rooks mate', () => {
      // Set up two rooks mate scenario
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      
      // White king on edge
      game.board[7][4] = { type: 'king', color: 'white' };
      
      // Black rooks delivering mate
      game.board[6][0] = { type: 'rook', color: 'black' };
      game.board[7][0] = { type: 'rook', color: 'black' };
      
      // Black king
      game.board[0][4] = { type: 'king', color: 'black' };
      
      game.currentTurn = 'white';
      
      // Verify checkmate detection
      expect(game.isInCheck('white')).toBe(true);
      expect(game.isCheckmate('white')).toBe(true);
      expect(game.hasValidMoves('white')).toBe(false);
      
      // Test game ending logic
      game.checkGameEnd();
      expect(game.gameStatus).toBe('checkmate');
      expect(game.winner).toBe('black');
    });

    test('should detect simple queen checkmate', () => {
      // Set up simple queen checkmate
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      
      // White king in corner
      game.board[7][7] = { type: 'king', color: 'white' };
      
      // Black pieces delivering mate
      game.board[6][6] = { type: 'queen', color: 'black' }; // Attacks king diagonally
      game.board[5][6] = { type: 'king', color: 'black' }; // Supports queen and controls escape squares
      
      game.currentTurn = 'white';
      
      // Verify checkmate detection
      expect(game.isInCheck('white')).toBe(true);
      expect(game.isCheckmate('white')).toBe(true);
      expect(game.hasValidMoves('white')).toBe(false);
      
      // Test game ending logic
      game.checkGameEnd();
      expect(game.gameStatus).toBe('checkmate');
      expect(game.winner).toBe('black');
    });
  });

  describe('Checkmate Detection with Different Pieces', () => {
    test('should detect knight checkmate', () => {
      // Set up knight checkmate scenario - back rank mate with knight
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      
      // White king trapped on back rank
      game.board[7][4] = { type: 'king', color: 'white' };
      game.board[6][3] = { type: 'pawn', color: 'white' }; // Blocks escape
      game.board[6][4] = { type: 'pawn', color: 'white' }; // Blocks escape  
      game.board[6][5] = { type: 'pawn', color: 'white' }; // Blocks escape
      
      // Black knight delivering checkmate
      game.board[5][3] = { type: 'knight', color: 'black' }; // Attacks king at (7,4) - L-shape (2,1)
      game.board[5][6] = { type: 'rook', color: 'black' }; // Controls escape squares
      
      // Black king
      game.board[0][0] = { type: 'king', color: 'black' };
      
      game.currentTurn = 'white';
      
      // Verify checkmate detection
      expect(game.isInCheck('white')).toBe(true);
      expect(game.isCheckmate('white')).toBe(true);
      expect(game.hasValidMoves('white')).toBe(false);
      
      // Test game ending logic
      game.checkGameEnd();
      expect(game.gameStatus).toBe('checkmate');
      expect(game.winner).toBe('black');
    });

    test('should detect bishop checkmate', () => {
      // Set up bishop checkmate scenario
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      
      // White king trapped
      game.board[7][7] = { type: 'king', color: 'white' };
      game.board[6][6] = { type: 'pawn', color: 'white' }; // Blocks escape
      game.board[6][7] = { type: 'pawn', color: 'white' }; // Blocks escape
      game.board[7][6] = { type: 'pawn', color: 'white' }; // Blocks escape
      
      // Black bishop delivering checkmate (diagonal attack)
      game.board[5][5] = { type: 'bishop', color: 'black' }; // Attacks (7,7) diagonally
      
      // Black king
      game.board[0][0] = { type: 'king', color: 'black' };
      
      game.currentTurn = 'white';
      
      // Verify checkmate detection
      expect(game.isInCheck('white')).toBe(true);
      expect(game.isCheckmate('white')).toBe(true);
      expect(game.hasValidMoves('white')).toBe(false);
      
      // Test game ending logic
      game.checkGameEnd();
      expect(game.gameStatus).toBe('checkmate');
      expect(game.winner).toBe('black');
    });
  });

  describe('Near-Checkmate Scenarios (Should NOT Trigger Checkmate)', () => {
    test('should not detect checkmate when king can escape', () => {
      // Set up scenario where king appears trapped but has escape
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      
      // White king with one escape square
      game.board[7][4] = { type: 'king', color: 'white' };
      game.board[6][3] = { type: 'pawn', color: 'white' };
      game.board[6][4] = { type: 'pawn', color: 'white' };
      // Note: no pawn at 6,5 - king can escape to 7,5
      
      // Black rook attacking
      game.board[7][0] = { type: 'rook', color: 'black' };
      
      // Black king
      game.board[0][4] = { type: 'king', color: 'black' };
      
      game.currentTurn = 'white';
      
      // Verify NOT checkmate
      expect(game.isInCheck('white')).toBe(true);
      expect(game.isCheckmate('white')).toBe(false);
      expect(game.hasValidMoves('white')).toBe(true);
      
      // Test game status remains check, not checkmate
      game.checkGameEnd();
      expect(game.gameStatus).toBe('check');
      expect(game.winner).toBeNull();
    });

    test('should not detect checkmate when check can be blocked', () => {
      // Set up scenario where check can be blocked
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      
      // White king and pieces
      game.board[7][4] = { type: 'king', color: 'white' };
      game.board[5][2] = { type: 'rook', color: 'white' }; // Can block
      
      // Black rook attacking
      game.board[0][4] = { type: 'rook', color: 'black' };
      
      // Black king
      game.board[0][0] = { type: 'king', color: 'black' };
      
      game.currentTurn = 'white';
      
      // Verify NOT checkmate
      expect(game.isInCheck('white')).toBe(true);
      expect(game.isCheckmate('white')).toBe(false);
      expect(game.hasValidMoves('white')).toBe(true);
      
      // Test game status remains check, not checkmate
      game.checkGameEnd();
      expect(game.gameStatus).toBe('check');
      expect(game.winner).toBeNull();
    });

    test('should not detect checkmate when attacking piece can be captured', () => {
      // Set up scenario where attacking piece can be captured
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      
      // White king and pieces
      game.board[7][4] = { type: 'king', color: 'white' };
      game.board[5][0] = { type: 'rook', color: 'white' }; // Can capture attacker
      
      // Black rook attacking (can be captured)
      game.board[7][0] = { type: 'rook', color: 'black' };
      
      // Black king
      game.board[0][4] = { type: 'king', color: 'black' };
      
      game.currentTurn = 'white';
      
      // Verify NOT checkmate
      expect(game.isInCheck('white')).toBe(true);
      expect(game.isCheckmate('white')).toBe(false);
      expect(game.hasValidMoves('white')).toBe(true);
      
      // Test game status remains check, not checkmate
      game.checkGameEnd();
      expect(game.gameStatus).toBe('check');
      expect(game.winner).toBeNull();
    });

    test('should not detect checkmate when pinned piece can still move legally', () => {
      // Set up scenario with pinned piece that can still make legal moves
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      
      // White king and pieces
      game.board[7][4] = { type: 'king', color: 'white' };
      game.board[7][2] = { type: 'rook', color: 'white' }; // Pinned but can move along pin line
      
      // Black pieces
      game.board[7][0] = { type: 'rook', color: 'black' }; // Pinning the white rook
      game.board[0][4] = { type: 'rook', color: 'black' }; // Attacking king
      
      // Black king
      game.board[0][0] = { type: 'king', color: 'black' };
      
      game.currentTurn = 'white';
      
      // Verify NOT checkmate (pinned rook can block)
      expect(game.isInCheck('white')).toBe(true);
      expect(game.isCheckmate('white')).toBe(false);
      expect(game.hasValidMoves('white')).toBe(true);
      
      // Test game status remains check, not checkmate
      game.checkGameEnd();
      expect(game.gameStatus).toBe('check');
      expect(game.winner).toBeNull();
    });

    test('should not detect checkmate in stalemate position', () => {
      // Set up stalemate scenario (king not in check, no legal moves)
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      
      // White king trapped but not in check
      game.board[7][7] = { type: 'king', color: 'white' };
      
      // Black pieces controlling escape squares but not giving check
      game.board[5][6] = { type: 'king', color: 'black' };
      game.board[6][5] = { type: 'queen', color: 'black' };
      
      game.currentTurn = 'white';
      
      // Verify NOT checkmate (this is stalemate)
      expect(game.isInCheck('white')).toBe(false);
      expect(game.isCheckmate('white')).toBe(false);
      expect(game.isStalemate('white')).toBe(true);
      expect(game.hasValidMoves('white')).toBe(false);
      
      // Test game status becomes stalemate, not checkmate
      game.checkGameEnd();
      expect(game.gameStatus).toBe('stalemate');
      expect(game.winner).toBeNull();
    });
  });

  describe('Checkmate vs Stalemate Distinction', () => {
    test('should detect checkmate when king is in check with no moves', () => {
      // Set up clear checkmate position
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      
      // White king trapped and in check
      game.board[7][7] = { type: 'king', color: 'white' };
      game.board[6][6] = { type: 'pawn', color: 'white' }; // Blocks escape
      game.board[6][7] = { type: 'pawn', color: 'white' }; // Blocks escape
      game.board[7][6] = { type: 'pawn', color: 'white' }; // Blocks escape
      
      // Black queen delivering check
      game.board[5][7] = { type: 'queen', color: 'black' }; // Attacks king
      
      // Black king
      game.board[0][0] = { type: 'king', color: 'black' };
      
      game.currentTurn = 'white';
      
      // Verify this is checkmate, not stalemate
      expect(game.isInCheck('white')).toBe(true);
      expect(game.isCheckmate('white')).toBe(true);
      expect(game.isStalemate('white')).toBe(false);
      expect(game.hasValidMoves('white')).toBe(false);
      
      // Test game ending logic
      game.checkGameEnd();
      expect(game.gameStatus).toBe('checkmate');
      expect(game.winner).toBe('black');
    });

    test('should detect stalemate when king is not in check with no moves', () => {
      // Set up clear stalemate position
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      
      // White king trapped but not in check
      game.board[7][7] = { type: 'king', color: 'white' };
      
      // Black pieces controlling escape squares but not giving check
      game.board[5][6] = { type: 'king', color: 'black' };
      game.board[6][5] = { type: 'queen', color: 'black' }; // Controls escape squares
      
      game.currentTurn = 'white';
      
      // Verify this is stalemate, not checkmate
      expect(game.isInCheck('white')).toBe(false);
      expect(game.isCheckmate('white')).toBe(false);
      expect(game.isStalemate('white')).toBe(true);
      expect(game.hasValidMoves('white')).toBe(false);
      
      // Test game ending logic
      game.checkGameEnd();
      expect(game.gameStatus).toBe('stalemate');
      expect(game.winner).toBeNull();
    });
  });

  describe('Legal Move Generation for Checkmate Validation', () => {
    test('should correctly identify all legal moves in check position', () => {
      // Set up position where king has limited but valid moves
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      
      // White king with some escape options
      game.board[4][4] = { type: 'king', color: 'white' };
      
      // Black rook attacking
      game.board[4][0] = { type: 'rook', color: 'black' };
      
      // Black king
      game.board[0][0] = { type: 'king', color: 'black' };
      
      game.currentTurn = 'white';
      
      // Verify that hasValidMoves correctly identifies available moves
      expect(game.isInCheck('white')).toBe(true);
      expect(game.hasValidMoves('white')).toBe(true);
      expect(game.isCheckmate('white')).toBe(false);
    });

    test('should correctly identify no legal moves in checkmate position', () => {
      // Set up true checkmate position
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      
      // White king trapped
      game.board[7][7] = { type: 'king', color: 'white' };
      game.board[6][6] = { type: 'pawn', color: 'white' };
      game.board[6][7] = { type: 'pawn', color: 'white' };
      game.board[7][6] = { type: 'pawn', color: 'white' };
      
      // Black queen delivering mate
      game.board[5][7] = { type: 'queen', color: 'black' };
      
      // Black king
      game.board[0][0] = { type: 'king', color: 'black' };
      
      game.currentTurn = 'white';
      
      // Verify no legal moves available
      expect(game.isInCheck('white')).toBe(true);
      expect(game.hasValidMoves('white')).toBe(false);
      expect(game.isCheckmate('white')).toBe(true);
    });
  });

  describe('Game Ending Logic Integration', () => {
    test('should properly declare winner when checkmate is detected', () => {
      // Set up checkmate scenario
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      
      // White king in checkmate
      game.board[7][7] = { type: 'king', color: 'white' };
      game.board[6][6] = { type: 'pawn', color: 'white' };
      game.board[6][7] = { type: 'pawn', color: 'white' };
      game.board[7][6] = { type: 'pawn', color: 'white' };
      
      // Black queen delivering mate
      game.board[5][7] = { type: 'queen', color: 'black' };
      
      // Black king
      game.board[0][0] = { type: 'king', color: 'black' };
      
      game.currentTurn = 'white';
      
      // Test game ending logic
      game.checkGameEnd();
      
      expect(game.gameStatus).toBe('checkmate');
      expect(game.winner).toBe('black');
      expect(game.inCheck).toBe(true);
      
      // Verify game state includes checkmate information
      const gameState = game.getGameState();
      expect(gameState.status).toBe('checkmate');
      expect(gameState.winner).toBe('black');
      expect(gameState.inCheck).toBe(true);
    });

    test('should handle checkmate for black player', () => {
      // Set up checkmate scenario for black
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      
      // Black king in checkmate
      game.board[0][0] = { type: 'king', color: 'black' };
      game.board[1][1] = { type: 'pawn', color: 'black' };
      game.board[1][0] = { type: 'pawn', color: 'black' };
      game.board[0][1] = { type: 'pawn', color: 'black' };
      
      // White queen delivering mate
      game.board[2][0] = { type: 'queen', color: 'white' };
      
      // White king
      game.board[7][7] = { type: 'king', color: 'white' };
      
      game.currentTurn = 'black';
      
      // Test game ending logic
      game.checkGameEnd();
      
      expect(game.gameStatus).toBe('checkmate');
      expect(game.winner).toBe('white');
      expect(game.inCheck).toBe(true);
      
      // Verify game state includes checkmate information
      const gameState = game.getGameState();
      expect(gameState.status).toBe('checkmate');
      expect(gameState.winner).toBe('white');
      expect(gameState.inCheck).toBe(true);
    });

    test('should not allow moves after checkmate is declared', () => {
      // Set up checkmate scenario
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      
      // White king in checkmate
      game.board[7][7] = { type: 'king', color: 'white' };
      game.board[6][6] = { type: 'pawn', color: 'white' };
      game.board[6][7] = { type: 'pawn', color: 'white' };
      game.board[7][6] = { type: 'pawn', color: 'white' };
      
      // Black queen delivering mate
      game.board[5][7] = { type: 'queen', color: 'black' };
      
      // Black king
      game.board[0][0] = { type: 'king', color: 'black' };
      
      game.currentTurn = 'white';
      game.checkGameEnd();
      
      // Attempt to make a move after checkmate
      const moveResult = game.makeMove({
        from: { row: 7, col: 7 },
        to: { row: 6, col: 7 }
      });
      
      expect(moveResult.success).toBe(false);
      expect(moveResult.errorCode).toBe('GAME_NOT_ACTIVE');
      expect(moveResult.message).toBe('Game is not active');
    });
  });
});