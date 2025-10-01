/**
 * Enhanced Check Detection System Tests
 * Covers comprehensive check detection from all piece types and complex scenarios
 * 
 * This test file has been normalized to use the current API patterns:
 * - Uses current inCheck property and checkDetails structure
 * - Validates check detection using current API response format
 * - Uses current game state properties (gameStatus, currentTurn, etc.)
 * - Tests check resolution using current validation patterns
 * - Uses current error handling for check-related edge cases
 */

const ChessGame = require('../src/shared/chessGame');

describe('Enhanced Check Detection System', () => {
  let game;

  beforeEach(() => {
    game = testUtils.createFreshGame();
  });

  describe('Check Detection from All Piece Types', () => {
    test('should detect check from rook - horizontal attack', () => {
      // Clear board and set up rook check scenario
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[4][4] = { type: 'king', color: 'white' };
      game.board[4][0] = { type: 'rook', color: 'black' };

      const inCheck = game.isInCheck('white');
      expect(inCheck).toBe(true);
      expect(game.checkDetails).not.toBeNull();
      expect(game.checkDetails.attackingPieces).toHaveLength(1);
      expect(game.checkDetails.attackingPieces[0].piece.type).toBe('rook');
      expect(game.checkDetails.attackingPieces[0].attackType).toBe('horizontal_attack');
      expect(game.checkDetails.checkType).toBe('rook_check');
    });

    test('should detect check from rook - vertical attack', () => {
      // Clear board and set up rook check scenario
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[4][4] = { type: 'king', color: 'white' };
      game.board[0][4] = { type: 'rook', color: 'black' };

      const inCheck = game.isInCheck('white');
      expect(inCheck).toBe(true);
      expect(game.checkDetails.attackingPieces[0].attackType).toBe('vertical_attack');
    });

    test('should detect check from bishop - diagonal attack', () => {
      // Clear board and set up bishop check scenario
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[4][4] = { type: 'king', color: 'white' };
      game.board[1][1] = { type: 'bishop', color: 'black' };

      const inCheck = game.isInCheck('white');
      expect(inCheck).toBe(true);
      expect(game.checkDetails.attackingPieces[0].piece.type).toBe('bishop');
      expect(game.checkDetails.attackingPieces[0].attackType).toBe('diagonal_attack');
      expect(game.checkDetails.checkType).toBe('bishop_check');
    });

    test('should detect check from queen - horizontal attack', () => {
      // Clear board and set up queen check scenario
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[4][4] = { type: 'king', color: 'white' };
      game.board[4][7] = { type: 'queen', color: 'black' };

      const inCheck = game.isInCheck('white');
      expect(inCheck).toBe(true);
      expect(game.checkDetails.attackingPieces[0].piece.type).toBe('queen');
      expect(game.checkDetails.attackingPieces[0].attackType).toBe('horizontal_attack');
      expect(game.checkDetails.checkType).toBe('queen_check');
    });

    test('should detect check from queen - vertical attack', () => {
      // Clear board and set up queen check scenario
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[4][4] = { type: 'king', color: 'white' };
      game.board[7][4] = { type: 'queen', color: 'black' };

      const inCheck = game.isInCheck('white');
      expect(inCheck).toBe(true);
      expect(game.checkDetails.attackingPieces[0].attackType).toBe('vertical_attack');
    });

    test('should detect check from queen - diagonal attack', () => {
      // Clear board and set up queen check scenario
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[4][4] = { type: 'king', color: 'white' };
      game.board[0][0] = { type: 'queen', color: 'black' };

      const inCheck = game.isInCheck('white');
      expect(inCheck).toBe(true);
      expect(game.checkDetails.attackingPieces[0].attackType).toBe('diagonal_attack');
    });

    test('should detect check from knight - L-shaped attack', () => {
      // Clear board and set up knight check scenario
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[4][4] = { type: 'king', color: 'white' };
      game.board[2][3] = { type: 'knight', color: 'black' };

      const inCheck = game.isInCheck('white');
      expect(inCheck).toBe(true);
      expect(game.checkDetails.attackingPieces[0].piece.type).toBe('knight');
      expect(game.checkDetails.attackingPieces[0].attackType).toBe('knight_attack');
      expect(game.checkDetails.checkType).toBe('knight_check');
    });

    test('should detect check from pawn - diagonal attack', () => {
      // Clear board and set up pawn check scenario
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[4][4] = { type: 'king', color: 'white' };
      game.board[3][3] = { type: 'pawn', color: 'black' }; // Black pawn attacks diagonally down

      const inCheck = game.isInCheck('white');
      expect(inCheck).toBe(true);
      expect(game.checkDetails.attackingPieces[0].piece.type).toBe('pawn');
      expect(game.checkDetails.attackingPieces[0].attackType).toBe('diagonal_attack');
      expect(game.checkDetails.checkType).toBe('pawn_check');
    });

    test('should detect check from king - adjacent attack', () => {
      // Clear board and set up king check scenario
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[4][4] = { type: 'king', color: 'white' };
      game.board[3][4] = { type: 'king', color: 'black' };

      const inCheck = game.isInCheck('white');
      expect(inCheck).toBe(true);
      expect(game.checkDetails.attackingPieces[0].piece.type).toBe('king');
      expect(game.checkDetails.attackingPieces[0].attackType).toBe('adjacent_attack');
      expect(game.checkDetails.checkType).toBe('king_check');
    });

    test('should not detect check when path is blocked', () => {
      // Clear board and set up blocked attack scenario
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[4][4] = { type: 'king', color: 'white' };
      game.board[4][0] = { type: 'rook', color: 'black' };
      game.board[4][2] = { type: 'pawn', color: 'white' }; // Blocking piece

      const inCheck = game.isInCheck('white');
      expect(inCheck).toBe(false);
      expect(game.checkDetails).toBeNull();
    });

    test('should not detect check from knight when blocked (knights jump)', () => {
      // Clear board and set up knight scenario with "blocking" pieces
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[4][4] = { type: 'king', color: 'white' };
      game.board[2][3] = { type: 'knight', color: 'black' };
      game.board[3][3] = { type: 'pawn', color: 'white' }; // "Blocking" piece (doesn't block knights)
      game.board[3][4] = { type: 'pawn', color: 'white' }; // "Blocking" piece (doesn't block knights)

      const inCheck = game.isInCheck('white');
      expect(inCheck).toBe(true); // Knight can still attack despite "blocking" pieces
      expect(game.checkDetails.attackingPieces[0].piece.type).toBe('knight');
    });
  });

  describe('Double Check Detection', () => {
    test('should detect double check from two pieces', () => {
      // Clear board and set up double check scenario
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[4][4] = { type: 'king', color: 'white' };
      game.board[4][0] = { type: 'rook', color: 'black' };
      game.board[0][0] = { type: 'bishop', color: 'black' };

      const inCheck = game.isInCheck('white');
      expect(inCheck).toBe(true);
      expect(game.checkDetails.isDoubleCheck).toBe(true);
      expect(game.checkDetails.attackingPieces).toHaveLength(2);
      expect(game.checkDetails.checkType).toBe('double_check');
    });

    test('should detect triple check (theoretical scenario)', () => {
      // Clear board and set up triple check scenario
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[4][4] = { type: 'king', color: 'white' };
      game.board[4][0] = { type: 'rook', color: 'black' };
      game.board[0][0] = { type: 'bishop', color: 'black' };
      game.board[2][3] = { type: 'knight', color: 'black' };

      const inCheck = game.isInCheck('white');
      expect(inCheck).toBe(true);
      expect(game.checkDetails.attackingPieces).toHaveLength(3);
      expect(game.checkDetails.checkType).toBe('double_check'); // Still categorized as double_check
    });
  });

  describe('Discovered Check Detection', () => {
    test('should detect discovered check after piece moves', () => {
      // Set up discovered check scenario
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[4][4] = { type: 'king', color: 'white' };
      game.board[4][0] = { type: 'rook', color: 'black' };
      game.board[4][2] = { type: 'bishop', color: 'black' }; // Blocking piece that will move

      // Initially not in check due to blocking piece
      expect(game.isInCheck('white')).toBe(false);

      // Move the blocking piece to discover check
      game.board[4][2] = null;
      game.board[2][0] = { type: 'bishop', color: 'black' };

      const inCheck = game.isInCheck('white');
      expect(inCheck).toBe(true);
      expect(game.checkDetails.attackingPieces[0].piece.type).toBe('rook');
    });
  });

  describe('Complex Check Scenarios', () => {
    test('should handle check with multiple potential attackers but only one valid', () => {
      // Set up scenario with multiple pieces but only one can attack
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[4][4] = { type: 'king', color: 'white' };
      game.board[4][0] = { type: 'rook', color: 'black' }; // Can attack
      game.board[0][0] = { type: 'rook', color: 'black' }; // Path blocked
      game.board[2][2] = { type: 'pawn', color: 'white' }; // Blocks diagonal

      const inCheck = game.isInCheck('white');
      expect(inCheck).toBe(true);
      expect(game.checkDetails.attackingPieces).toHaveLength(1);
      expect(game.checkDetails.attackingPieces[0].position).toEqual({ row: 4, col: 0 });
    });

    test('should correctly identify no check when king is safe', () => {
      // Set up scenario where king appears threatened but is safe
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[4][4] = { type: 'king', color: 'white' };
      game.board[4][1] = { type: 'rook', color: 'black' };
      game.board[4][2] = { type: 'pawn', color: 'white' }; // Blocks attack

      const inCheck = game.isInCheck('white');
      expect(inCheck).toBe(false);
      expect(game.checkDetails).toBeNull();
    });

    test('should handle edge case with king at board edge', () => {
      // Test check detection with king at board edge
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[0][0] = { type: 'king', color: 'white' }; // Corner position
      game.board[0][7] = { type: 'rook', color: 'black' };

      const inCheck = game.isInCheck('white');
      expect(inCheck).toBe(true);
      expect(game.checkDetails).not.toBeNull();
      expect(game.checkDetails.attackingPieces).toHaveLength(1);
      expect(game.checkDetails.attackingPieces[0].attackType).toBe('horizontal_attack');
      expect(game.checkDetails.checkType).toBe('rook_check');
    });

    test('should handle invalid color parameter gracefully', () => {
      // Test error handling for invalid color parameter
      const inCheck = game.isInCheck('invalid');
      expect(inCheck).toBe(false);
      expect(game.checkDetails).toBeNull();
    });

    test('should handle missing king scenario', () => {
      // Clear board completely (no king)
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      
      const inCheck = game.isInCheck('white');
      expect(inCheck).toBe(false);
      expect(game.checkDetails).toBeNull();
    });
  });

  describe('Check Prevention and Resolution', () => {
    test('should prevent moves that would put own king in check', () => {
      // Set up scenario where moving a piece would expose king to check
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[4][4] = { type: 'king', color: 'white' };
      game.board[0][4] = { type: 'king', color: 'black' }; // Black king required
      game.board[4][3] = { type: 'bishop', color: 'white' }; // Blocking piece
      game.board[4][0] = { type: 'rook', color: 'black' }; // Would attack king if bishop moves
      game.currentTurn = 'white';

      // Try to move the blocking bishop
      const result = game.makeMove({ 
        from: { row: 4, col: 3 }, 
        to: { row: 5, col: 4 } 
      });
      
      testUtils.validateErrorResponse(result);
      expect(result.errorCode).toBe('PINNED_PIECE_INVALID_MOVE');
      expect(result.message).toContain('Pinned piece');
    });

    test('should allow moves that resolve check', () => {
      // Set up check scenario and test valid resolution
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[4][4] = { type: 'king', color: 'white' };
      game.board[0][4] = { type: 'king', color: 'black' }; // Black king required
      game.board[4][0] = { type: 'rook', color: 'black' }; // Attacking king
      game.currentTurn = 'white';

      // Verify king is in check
      expect(game.isInCheck('white')).toBe(true);

      // Move king to safety
      const result = game.makeMove({ 
        from: { row: 4, col: 4 }, 
        to: { row: 5, col: 4 } 
      });
      
      testUtils.validateSuccessResponse(result);
      expect(result.data.gameStatus).toBe('active');
      expect(game.isInCheck('white')).toBe(false);
    });

    test('should detect checkmate scenario correctly', () => {
      // Set up a checkmate position - corner mate with protected pieces
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[0][0] = { type: 'king', color: 'white' }; // White king in corner
      game.board[7][7] = { type: 'king', color: 'black' }; // Black king required
      game.board[1][0] = { type: 'rook', color: 'black' }; // Rook blocking vertical escape
      game.board[0][1] = { type: 'rook', color: 'black' }; // Rook blocking horizontal escape
      game.board[2][0] = { type: 'rook', color: 'black' }; // Rook protecting the vertical rook
      game.board[0][2] = { type: 'rook', color: 'black' }; // Rook protecting the horizontal rook
      game.currentTurn = 'white';

      // Verify king is in check (double check)
      expect(game.isInCheck('white')).toBe(true);
      expect(game.checkDetails.checkType).toBe('double_check');
      expect(game.checkDetails.attackingPieces).toHaveLength(2);
      expect(game.checkDetails.isDoubleCheck).toBe(true);

      // Verify checkmate is detected
      game.checkGameEnd();
      expect(game.gameStatus).toBe('checkmate');
      expect(game.winner).toBe('black');
      expect(game.inCheck).toBe(true);
    });
  });

  describe('Check Status Tracking', () => {
    test('should update game status to check when king is in check', () => {
      // Set up check scenario - clear path between rook and king
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[4][4] = { type: 'king', color: 'white' };
      game.board[7][7] = { type: 'king', color: 'black' }; // Black king required
      game.board[4][0] = { type: 'rook', color: 'black' };
      game.currentTurn = 'white';

      // Verify king is in check first
      expect(game.isInCheck('white')).toBe(true);
      
      game.checkGameEnd();
      expect(game.gameStatus).toBe('check');
      expect(game.inCheck).toBe(true);
    });

    test('should maintain active status when no check', () => {
      game.currentTurn = 'white';
      game.checkGameEnd();
      expect(game.gameStatus).toBe('active');
      expect(game.inCheck).toBe(false);
    });

    test('should include check details in game state', () => {
      // Set up check scenario - clear path between rook and king
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[4][4] = { type: 'king', color: 'white' };
      game.board[7][7] = { type: 'king', color: 'black' }; // Black king required
      game.board[4][0] = { type: 'rook', color: 'black' };
      game.currentTurn = 'white';
      
      // Trigger check detection and game end check
      game.checkGameEnd();

      const gameState = game.getGameState();
      expect(gameState.inCheck).toBe(true);
      expect(gameState.checkDetails).not.toBeNull();
      expect(gameState.checkDetails.attackingPieces).toHaveLength(1);
      expect(gameState.checkDetails.checkType).toBe('rook_check');
      expect(gameState.gameStatus).toBe('check');
    });

    test('should clear check details when no longer in check', () => {
      // Set up check scenario first
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[4][4] = { type: 'king', color: 'white' };
      game.board[7][7] = { type: 'king', color: 'black' }; // Black king required
      game.board[4][0] = { type: 'rook', color: 'black' };
      game.currentTurn = 'white';
      
      // Verify check is detected
      expect(game.isInCheck('white')).toBe(true);
      expect(game.checkDetails).not.toBeNull();
      
      // Remove the attacking piece
      game.board[4][0] = null;
      
      // Check should be cleared
      expect(game.isInCheck('white')).toBe(false);
      expect(game.checkDetails).toBeNull();
      
      // Game state should reflect no check
      const gameState = game.getGameState();
      expect(gameState.inCheck).toBe(false);
      expect(gameState.checkDetails).toBeNull();
    });

    test('should maintain consistent check status across game state methods', () => {
      // Set up check scenario
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[4][4] = { type: 'king', color: 'white' };
      game.board[7][7] = { type: 'king', color: 'black' }; // Black king required
      game.board[2][3] = { type: 'knight', color: 'black' }; // Knight check
      game.currentTurn = 'white';
      
      // Check via isInCheck method
      const directCheck = game.isInCheck('white');
      expect(directCheck).toBe(true);
      
      // Update game state to reflect check status
      game.checkGameEnd();
      
      // Check via game state after checkGameEnd
      const gameState = game.getGameState();
      expect(gameState.inCheck).toBe(directCheck);
      expect(gameState.checkDetails.checkType).toBe('knight_check');
      
      // Verify game properties are consistent
      expect(game.inCheck).toBe(directCheck);
      expect(game.gameStatus).toBe('check');
    });
  });
});