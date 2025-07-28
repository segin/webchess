const ChessGame = require('../src/shared/chessGame');

describe('Enhanced Check Detection System', () => {
  let game;

  beforeEach(() => {
    game = new ChessGame();
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
      expect(game.checkDetails.attackingPieces[0].attackType).toBe('horizontal_attack');
    });
  });

  describe('Check Status Tracking', () => {
    test('should update game status to check when king is in check', () => {
      // Set up check scenario - clear path between rook and king
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[4][4] = { type: 'king', color: 'white' };
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
      game.board[4][0] = { type: 'rook', color: 'black' };
      game.currentTurn = 'white';
      
      // Trigger check detection and game end check
      game.checkGameEnd();

      const gameState = game.getGameState();
      expect(gameState.inCheck).toBe(true);
      expect(gameState.checkDetails).not.toBeNull();
      expect(gameState.checkDetails.attackingPieces).toHaveLength(1);
    });
  });
});