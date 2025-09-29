/**
 * Comprehensive Check and Checkmate Test Suite
 * Tests complex check/checkmate scenarios using current API patterns
 * 
 * This test file has been normalized to use the current API patterns:
 * - Uses current inCheck property and checkDetails structure
 * - Validates check/checkmate detection using current API response format
 * - Uses current game state properties (gameStatus, currentTurn, etc.)
 * - Tests check resolution using current validation patterns
 * - Uses current error handling for check-related edge cases
 */

const ChessGame = require('../src/shared/chessGame');

describe('Comprehensive Check and Checkmate Test Suite', () => {
  let game;

  beforeEach(() => {
    game = new ChessGame();
  });

  describe('Exhaustive Check Detection from All Piece Types', () => {
    describe('Rook Check Detection', () => {
      test('should detect horizontal rook check from left', () => {
        // Clear board and set up horizontal rook check
        game.board = Array(8).fill(null).map(() => Array(8).fill(null));
        game.board[4][4] = { type: 'king', color: 'white' };
        game.board[4][0] = { type: 'rook', color: 'black' };
        game.board[0][0] = { type: 'king', color: 'black' };

        // Test check detection using current API
        const inCheck = game.isInCheck('white');
        expect(inCheck).toBe(true);
        expect(game.checkDetails).not.toBeNull();
        expect(game.checkDetails.attackingPieces).toHaveLength(1);
        expect(game.checkDetails.attackingPieces[0].piece.type).toBe('rook');
        expect(game.checkDetails.attackingPieces[0].attackType).toBe('horizontal_attack');
      });

      test('should detect horizontal rook check from right', () => {
        game.board = Array(8).fill(null).map(() => Array(8).fill(null));
        game.board[4][4] = { type: 'king', color: 'white' };
        game.board[4][7] = { type: 'rook', color: 'black' };
        game.board[0][0] = { type: 'king', color: 'black' };

        const inCheck = game.isInCheck('white');
        expect(inCheck).toBe(true);
        expect(game.checkDetails.attackingPieces[0].attackType).toBe('horizontal_attack');
      });

      test('should detect vertical rook check from above', () => {
        game.board = Array(8).fill(null).map(() => Array(8).fill(null));
        game.board[4][4] = { type: 'king', color: 'white' };
        game.board[0][4] = { type: 'rook', color: 'black' };
        game.board[0][0] = { type: 'king', color: 'black' };

        const inCheck = game.isInCheck('white');
        expect(inCheck).toBe(true);
        expect(game.checkDetails.attackingPieces[0].attackType).toBe('vertical_attack');
      });

      test('should detect vertical rook check from below', () => {
        game.board = Array(8).fill(null).map(() => Array(8).fill(null));
        game.board[4][4] = { type: 'king', color: 'white' };
        game.board[7][4] = { type: 'rook', color: 'black' };
        game.board[0][0] = { type: 'king', color: 'black' };

        const inCheck = game.isInCheck('white');
        expect(inCheck).toBe(true);
        expect(game.checkDetails.attackingPieces[0].attackType).toBe('vertical_attack');
      });

      test('should not detect rook check when path is blocked', () => {
        game.board = Array(8).fill(null).map(() => Array(8).fill(null));
        game.board[4][4] = { type: 'king', color: 'white' };
        game.board[4][0] = { type: 'rook', color: 'black' };
        game.board[4][2] = { type: 'pawn', color: 'white' }; // Blocking piece
        game.board[0][0] = { type: 'king', color: 'black' };

        const inCheck = game.isInCheck('white');
        expect(inCheck).toBe(false);
        expect(game.checkDetails).toBeNull();
      });
    });

    describe('Bishop Check Detection', () => {
      test('should detect diagonal bishop check from top-left', () => {
        game.board = Array(8).fill(null).map(() => Array(8).fill(null));
        game.board[4][4] = { type: 'king', color: 'white' };
        game.board[1][1] = { type: 'bishop', color: 'black' };
        game.board[0][0] = { type: 'king', color: 'black' };

        const inCheck = game.isInCheck('white');
        expect(inCheck).toBe(true);
        expect(game.checkDetails.attackingPieces[0].piece.type).toBe('bishop');
        expect(game.checkDetails.attackingPieces[0].attackType).toBe('diagonal_attack');
      });

      test('should detect diagonal bishop check from top-right', () => {
        game.board = Array(8).fill(null).map(() => Array(8).fill(null));
        game.board[4][4] = { type: 'king', color: 'white' };
        game.board[1][7] = { type: 'bishop', color: 'black' };
        game.board[0][0] = { type: 'king', color: 'black' };

        const inCheck = game.isInCheck('white');
        expect(inCheck).toBe(true);
        expect(game.checkDetails.attackingPieces[0].attackType).toBe('diagonal_attack');
      });

      test('should detect diagonal bishop check from bottom-left', () => {
        game.board = Array(8).fill(null).map(() => Array(8).fill(null));
        game.board[4][4] = { type: 'king', color: 'white' };
        game.board[7][1] = { type: 'bishop', color: 'black' };
        game.board[0][0] = { type: 'king', color: 'black' };

        const inCheck = game.isInCheck('white');
        expect(inCheck).toBe(true);
        expect(game.checkDetails.attackingPieces[0].attackType).toBe('diagonal_attack');
      });

      test('should detect diagonal bishop check from bottom-right', () => {
        game.board = Array(8).fill(null).map(() => Array(8).fill(null));
        game.board[4][4] = { type: 'king', color: 'white' };
        game.board[7][7] = { type: 'bishop', color: 'black' };
        game.board[0][0] = { type: 'king', color: 'black' };

        const inCheck = game.isInCheck('white');
        expect(inCheck).toBe(true);
        expect(game.checkDetails.attackingPieces[0].attackType).toBe('diagonal_attack');
      });

      test('should not detect bishop check when path is blocked', () => {
        game.board = Array(8).fill(null).map(() => Array(8).fill(null));
        game.board[4][4] = { type: 'king', color: 'white' };
        game.board[1][1] = { type: 'bishop', color: 'black' };
        game.board[3][3] = { type: 'pawn', color: 'white' }; // Blocking piece
        game.board[0][0] = { type: 'king', color: 'black' };

        const inCheck = game.isInCheck('white');
        expect(inCheck).toBe(false);
        expect(game.checkDetails).toBeNull();
      });
    });

    describe('Queen Check Detection', () => {
      test('should detect queen check - horizontal attack', () => {
        game.board = Array(8).fill(null).map(() => Array(8).fill(null));
        game.board[4][4] = { type: 'king', color: 'white' };
        game.board[4][0] = { type: 'queen', color: 'black' };
        game.board[0][0] = { type: 'king', color: 'black' };

        const inCheck = game.isInCheck('white');
        expect(inCheck).toBe(true);
        expect(game.checkDetails.attackingPieces[0].piece.type).toBe('queen');
        expect(game.checkDetails.attackingPieces[0].attackType).toBe('horizontal_attack');
      });

      test('should detect queen check - vertical attack', () => {
        game.board = Array(8).fill(null).map(() => Array(8).fill(null));
        game.board[4][4] = { type: 'king', color: 'white' };
        game.board[0][4] = { type: 'queen', color: 'black' };
        game.board[0][0] = { type: 'king', color: 'black' };

        const inCheck = game.isInCheck('white');
        expect(inCheck).toBe(true);
        expect(game.checkDetails.attackingPieces[0].attackType).toBe('vertical_attack');
      });

      test('should detect queen check - diagonal attack', () => {
        game.board = Array(8).fill(null).map(() => Array(8).fill(null));
        game.board[4][4] = { type: 'king', color: 'white' };
        game.board[1][1] = { type: 'queen', color: 'black' };
        game.board[0][0] = { type: 'king', color: 'black' };

        const inCheck = game.isInCheck('white');
        expect(inCheck).toBe(true);
        expect(game.checkDetails.attackingPieces[0].attackType).toBe('diagonal_attack');
      });
    });

    describe('Knight Check Detection', () => {
      test('should detect knight check from all 8 L-shaped positions', () => {
        const knightMoves = [
          { row: 2, col: 3 }, // Up 2, right 1
          { row: 2, col: 5 }, // Up 2, left 1
          { row: 3, col: 2 }, // Up 1, right 2
          { row: 3, col: 6 }, // Up 1, left 2
          { row: 5, col: 2 }, // Down 1, right 2
          { row: 5, col: 6 }, // Down 1, left 2
          { row: 6, col: 3 }, // Down 2, right 1
          { row: 6, col: 5 }  // Down 2, left 1
        ];

        knightMoves.forEach((knightPos, index) => {
          game.board = Array(8).fill(null).map(() => Array(8).fill(null));
          game.board[4][4] = { type: 'king', color: 'white' };
          game.board[knightPos.row][knightPos.col] = { type: 'knight', color: 'black' };
          game.board[0][0] = { type: 'king', color: 'black' };

          const inCheck = game.isInCheck('white');
          expect(inCheck).toBe(true);
          expect(game.checkDetails.attackingPieces[0].piece.type).toBe('knight');
          expect(game.checkDetails.attackingPieces[0].attackType).toBe('knight_attack');
        });
      });

      test('should detect knight check even with blocking pieces', () => {
        game.board = Array(8).fill(null).map(() => Array(8).fill(null));
        game.board[4][4] = { type: 'king', color: 'white' };
        game.board[2][3] = { type: 'knight', color: 'black' };
        // Add "blocking" pieces (knights jump over them)
        game.board[3][3] = { type: 'pawn', color: 'white' };
        game.board[3][4] = { type: 'pawn', color: 'white' };
        game.board[0][0] = { type: 'king', color: 'black' };

        const inCheck = game.isInCheck('white');
        expect(inCheck).toBe(true);
        expect(game.checkDetails.attackingPieces[0].piece.type).toBe('knight');
      });
    });

    describe('Pawn Check Detection', () => {
      test('should detect pawn check - white pawn attacking black king', () => {
        game.board = Array(8).fill(null).map(() => Array(8).fill(null));
        game.board[3][3] = { type: 'king', color: 'black' };
        game.board[4][2] = { type: 'pawn', color: 'white' }; // White pawn attacks diagonally up
        game.board[7][7] = { type: 'king', color: 'white' };

        const inCheck = game.isInCheck('black');
        expect(inCheck).toBe(true);
        expect(game.checkDetails.attackingPieces[0].piece.type).toBe('pawn');
        expect(game.checkDetails.attackingPieces[0].attackType).toBe('diagonal_attack');
      });

      test('should detect pawn check - black pawn attacking white king', () => {
        game.board = Array(8).fill(null).map(() => Array(8).fill(null));
        game.board[4][4] = { type: 'king', color: 'white' };
        game.board[3][3] = { type: 'pawn', color: 'black' }; // Black pawn attacks diagonally down
        game.board[0][0] = { type: 'king', color: 'black' };

        const inCheck = game.isInCheck('white');
        expect(inCheck).toBe(true);
        expect(game.checkDetails.attackingPieces[0].piece.type).toBe('pawn');
        expect(game.checkDetails.attackingPieces[0].attackType).toBe('diagonal_attack');
      });

      test('should not detect pawn check from forward direction', () => {
        game.board = Array(8).fill(null).map(() => Array(8).fill(null));
        game.board[4][4] = { type: 'king', color: 'white' };
        game.board[3][4] = { type: 'pawn', color: 'black' }; // Pawn directly in front
        game.board[0][0] = { type: 'king', color: 'black' };

        const inCheck = game.isInCheck('white');
        expect(inCheck).toBe(false);
      });
    });

    describe('King Check Detection', () => {
      test('should detect king check from adjacent squares', () => {
        const adjacentPositions = [
          { row: 3, col: 3 }, // Top-left
          { row: 3, col: 4 }, // Top
          { row: 3, col: 5 }, // Top-right
          { row: 4, col: 3 }, // Left
          { row: 4, col: 5 }, // Right
          { row: 5, col: 3 }, // Bottom-left
          { row: 5, col: 4 }, // Bottom
          { row: 5, col: 5 }  // Bottom-right
        ];

        adjacentPositions.forEach((kingPos) => {
          game.board = Array(8).fill(null).map(() => Array(8).fill(null));
          game.board[4][4] = { type: 'king', color: 'white' };
          game.board[kingPos.row][kingPos.col] = { type: 'king', color: 'black' };

          const inCheck = game.isInCheck('white');
          expect(inCheck).toBe(true);
          expect(game.checkDetails.attackingPieces[0].piece.type).toBe('king');
          expect(game.checkDetails.attackingPieces[0].attackType).toBe('adjacent_attack');
        });
      });
    });
  });

  describe('Double and Multiple Check Detection', () => {
    test('should detect double check from rook and bishop', () => {
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[4][4] = { type: 'king', color: 'white' };
      game.board[4][0] = { type: 'rook', color: 'black' }; // Horizontal attack
      game.board[0][0] = { type: 'bishop', color: 'black' }; // Diagonal attack
      game.board[7][7] = { type: 'king', color: 'black' };

      const inCheck = game.isInCheck('white');
      expect(inCheck).toBe(true);
      expect(game.checkDetails.isDoubleCheck).toBe(true);
      expect(game.checkDetails.attackingPieces).toHaveLength(2);
      expect(game.checkDetails.checkType).toBe('double_check');
    });

    test('should detect triple check scenario', () => {
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[4][4] = { type: 'king', color: 'white' };
      game.board[4][0] = { type: 'rook', color: 'black' }; // Horizontal attack
      game.board[0][0] = { type: 'bishop', color: 'black' }; // Diagonal attack
      game.board[2][3] = { type: 'knight', color: 'black' }; // Knight attack
      game.board[7][7] = { type: 'king', color: 'black' };

      const inCheck = game.isInCheck('white');
      expect(inCheck).toBe(true);
      expect(game.checkDetails.attackingPieces).toHaveLength(3);
      expect(game.checkDetails.checkType).toBe('double_check'); // Still categorized as double_check
    });

    test('should detect discovered check', () => {
      // Set up discovered check scenario
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[4][4] = { type: 'king', color: 'white' };
      game.board[4][0] = { type: 'rook', color: 'black' };
      game.board[4][2] = { type: 'bishop', color: 'black' }; // Initially blocking

      // Initially not in check
      let inCheck = game.isInCheck('white');
      expect(inCheck).toBe(false);

      // Move blocking piece to discover check
      game.board[4][2] = null;
      game.board[2][0] = { type: 'bishop', color: 'black' };
      game.board[7][7] = { type: 'king', color: 'black' };

      inCheck = game.isInCheck('white');
      expect(inCheck).toBe(true);
      expect(game.checkDetails.attackingPieces[0].piece.type).toBe('rook');
    });
  });

  describe('Basic Checkmate Patterns', () => {
    test('should detect back rank mate', () => {
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      
      // White king trapped on back rank
      game.board[7][4] = { type: 'king', color: 'white' };
      game.board[6][3] = { type: 'pawn', color: 'white' };
      game.board[6][4] = { type: 'pawn', color: 'white' };
      game.board[6][5] = { type: 'pawn', color: 'white' };
      
      // Black rook delivering mate
      game.board[7][0] = { type: 'rook', color: 'black' };
      game.board[0][4] = { type: 'king', color: 'black' };
      
      game.currentTurn = 'white';
      
      // Test checkmate detection using current API
      const inCheck = game.isInCheck('white');
      const isCheckmate = game.isCheckmate('white');
      const hasValidMoves = game.hasValidMoves('white');
      
      expect(inCheck).toBe(true);
      expect(isCheckmate).toBe(true);
      expect(hasValidMoves).toBe(false);
    });

    test('should detect simple queen checkmate', () => {
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      
      // White king in corner
      game.board[0][0] = { type: 'king', color: 'white' };
      
      // Black pieces delivering mate - simpler setup
      game.board[2][0] = { type: 'queen', color: 'black' }; // Attacks king vertically
      game.board[1][1] = { type: 'king', color: 'black' }; // Controls escape squares
      
      game.currentTurn = 'white';
      
      const inCheck = game.isInCheck('white');
      const isCheckmate = game.isCheckmate('white');
      const hasValidMoves = game.hasValidMoves('white');
      
      expect(inCheck).toBe(true);
      expect(isCheckmate).toBe(true);
      expect(hasValidMoves).toBe(false);
    });

    test('should detect rook and king mate', () => {
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      
      // Smothered mate position - white king trapped by own pieces
      game.board[0][7] = { type: 'king', color: 'white' }; // h8
      game.board[0][6] = { type: 'rook', color: 'white' }; // g8 (own rook blocks escape)
      game.board[1][6] = { type: 'pawn', color: 'white' }; // g7 (own pawn blocks escape)
      game.board[1][7] = { type: 'pawn', color: 'white' }; // h7 (own pawn blocks escape)
      
      // Black knight delivering checkmate
      game.board[2][6] = { type: 'knight', color: 'black' }; // g6 (attacks h8)
      
      // Black king to support
      game.board[3][5] = { type: 'king', color: 'black' }; // f5
      
      game.currentTurn = 'white';
      
      const inCheck = game.isInCheck('white');
      const isCheckmate = game.isCheckmate('white');
      const hasValidMoves = game.hasValidMoves('white');
      
      expect(inCheck).toBe(true);
      expect(isCheckmate).toBe(true);
      expect(hasValidMoves).toBe(false);
    });

    test('should detect ladder mate with two rooks', () => {
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      
      // White king on edge
      game.board[7][4] = { type: 'king', color: 'white' };
      
      // Black rooks delivering mate
      game.board[6][0] = { type: 'rook', color: 'black' };
      game.board[7][0] = { type: 'rook', color: 'black' };
      game.board[0][4] = { type: 'king', color: 'black' };
      
      game.currentTurn = 'white';
      
      const inCheck = game.isInCheck('white');
      const isCheckmate = game.isCheckmate('white');
      const hasValidMoves = game.hasValidMoves('white');
      
      expect(inCheck).toBe(true);
      expect(isCheckmate).toBe(true);
      expect(hasValidMoves).toBe(false);
    });
  });

  describe('Complex Checkmate Scenarios', () => {
    test('should detect checkmate with multiple pieces involved', () => {
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      
      // Set up a known checkmate position - back rank mate
      game.board[7][4] = { type: 'king', color: 'white' };
      game.board[6][3] = { type: 'pawn', color: 'white' };
      game.board[6][4] = { type: 'pawn', color: 'white' };
      game.board[6][5] = { type: 'pawn', color: 'white' };
      
      // Black queen delivering checkmate on back rank
      game.board[7][0] = { type: 'queen', color: 'black' };
      game.board[0][0] = { type: 'king', color: 'black' };
      
      game.currentTurn = 'white';
      game.gameStatus = 'active';
      
      const inCheck = game.isInCheck('white');
      const isCheckmate = game.isCheckmate('white');
      const hasValidMoves = game.hasValidMoves('white');
      
      expect(inCheck).toBe(true);
      expect(isCheckmate).toBe(true);
      expect(hasValidMoves).toBe(false);
    });

    test('should detect checkmate with pinned pieces', () => {
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      
      // King with pinned defender
      game.board[7][4] = { type: 'king', color: 'white' };
      game.board[7][2] = { type: 'rook', color: 'white' }; // Pinned piece
      game.board[7][0] = { type: 'rook', color: 'black' }; // Pinning piece
      game.board[0][4] = { type: 'rook', color: 'black' }; // Attacking piece
      game.board[0][0] = { type: 'king', color: 'black' };
      
      game.currentTurn = 'white';
      
      const inCheck = game.isInCheck('white');
      const isCheckmate = game.isCheckmate('white');
      const hasValidMoves = game.hasValidMoves('white');
      
      expect(inCheck).toBe(true);
      expect(isCheckmate).toBe(true);
      expect(hasValidMoves).toBe(false);
    });
  });

  describe('Stalemate Detection and Distinction', () => {
    test('should detect classic stalemate position', () => {
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      
      // King trapped but not in check
      game.board[0][0] = { type: 'king', color: 'black' };
      game.board[1][2] = { type: 'queen', color: 'white' };
      game.board[2][1] = { type: 'king', color: 'white' };
      
      game.currentTurn = 'black';
      
      // Test stalemate detection using current API
      const inCheck = game.isInCheck('black');
      const isStalemate = game.isStalemate('black');
      const isCheckmate = game.isCheckmate('black');
      const hasValidMoves = game.hasValidMoves('black');
      
      expect(inCheck).toBe(false);
      expect(isStalemate).toBe(true);
      expect(isCheckmate).toBe(false);
      expect(hasValidMoves).toBe(false);
    });

    test('should distinguish between checkmate and stalemate', () => {
      // First test checkmate
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[0][0] = { type: 'king', color: 'black' };
      game.board[1][0] = { type: 'rook', color: 'white' }; // Giving check
      game.board[0][2] = { type: 'rook', color: 'white' }; // Blocking escape
      game.board[2][1] = { type: 'king', color: 'white' };
      game.currentTurn = 'black';
      
      let inCheck = game.isInCheck('black');
      let isCheckmate = game.isCheckmate('black');
      let isStalemate = game.isStalemate('black');
      
      expect(inCheck).toBe(true);
      expect(isCheckmate).toBe(true);
      expect(isStalemate).toBe(false);
      
      // Now test stalemate
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[0][0] = { type: 'king', color: 'black' };
      game.board[1][2] = { type: 'queen', color: 'white' }; // Not giving check
      game.board[2][1] = { type: 'king', color: 'white' };
      game.currentTurn = 'black';
      
      inCheck = game.isInCheck('black');
      isStalemate = game.isStalemate('black');
      isCheckmate = game.isCheckmate('black');
      
      expect(inCheck).toBe(false);
      expect(isStalemate).toBe(true);
      expect(isCheckmate).toBe(false);
    });

    test('should detect stalemate with multiple pieces', () => {
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      
      // Complex stalemate position
      game.board[0][0] = { type: 'king', color: 'black' };
      game.board[0][1] = { type: 'bishop', color: 'black' }; // Pinned piece
      game.board[0][7] = { type: 'rook', color: 'white' }; // Pinning piece
      game.board[1][2] = { type: 'queen', color: 'white' }; // Controlling squares
      game.board[2][1] = { type: 'king', color: 'white' };
      
      game.currentTurn = 'black';
      
      const inCheck = game.isInCheck('black');
      const isStalemate = game.isStalemate('black');
      const hasValidMoves = game.hasValidMoves('black');
      
      expect(inCheck).toBe(false);
      expect(isStalemate).toBe(true);
      expect(hasValidMoves).toBe(false);
    });
  });

  describe('Check Resolution Validation', () => {
    test('should validate check resolution by blocking', () => {
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[4][4] = { type: 'king', color: 'white' };
      game.board[4][0] = { type: 'rook', color: 'black' };
      game.board[6][1] = { type: 'rook', color: 'white' };
      game.board[0][0] = { type: 'king', color: 'black' };
      game.currentTurn = 'white';

      // Test initial check state using current API
      let inCheck = game.isInCheck('white');
      expect(inCheck).toBe(true);

      // Test that blocking move would resolve check
      const tempBoard = JSON.parse(JSON.stringify(game.board));
      tempBoard[4][1] = tempBoard[6][1]; // Move rook to block
      tempBoard[6][1] = null;
      
      const originalBoard = game.board;
      game.board = tempBoard;
      inCheck = game.isInCheck('white');
      expect(inCheck).toBe(false);
      game.board = originalBoard;
    });

    test('should validate check resolution by capturing', () => {
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[4][4] = { type: 'king', color: 'white' };
      game.board[4][0] = { type: 'rook', color: 'black' };
      game.board[2][0] = { type: 'rook', color: 'white' };
      game.board[0][0] = { type: 'king', color: 'black' };
      game.currentTurn = 'white';

      let inCheck = game.isInCheck('white');
      expect(inCheck).toBe(true);

      // Test that capturing move would resolve check
      const tempBoard = JSON.parse(JSON.stringify(game.board));
      tempBoard[4][0] = tempBoard[2][0]; // Capture attacking rook
      tempBoard[2][0] = null;
      
      const originalBoard = game.board;
      game.board = tempBoard;
      inCheck = game.isInCheck('white');
      expect(inCheck).toBe(false);
      game.board = originalBoard;
    });

    test('should validate check resolution by king movement', () => {
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[4][4] = { type: 'king', color: 'white' };
      game.board[4][0] = { type: 'rook', color: 'black' };
      game.board[0][0] = { type: 'king', color: 'black' };
      game.currentTurn = 'white';

      let inCheck = game.isInCheck('white');
      expect(inCheck).toBe(true);

      // Test that king movement would resolve check
      const tempBoard = JSON.parse(JSON.stringify(game.board));
      tempBoard[3][4] = tempBoard[4][4]; // Move king out of check
      tempBoard[4][4] = null;
      
      const originalBoard = game.board;
      game.board = tempBoard;
      inCheck = game.isInCheck('white');
      expect(inCheck).toBe(false);
      game.board = originalBoard;
    });
  });

  describe('Edge Cases and Complex Scenarios', () => {
    test('should handle check at board edges', () => {
      // King in corner under attack
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[0][0] = { type: 'king', color: 'white' };
      game.board[0][7] = { type: 'rook', color: 'black' };
      game.board[7][7] = { type: 'king', color: 'black' };

      const inCheck = game.isInCheck('white');
      expect(inCheck).toBe(true);
      expect(game.checkDetails.attackingPieces[0].attackType).toBe('horizontal_attack');
    });

    test('should handle multiple potential attackers with only one valid', () => {
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[4][4] = { type: 'king', color: 'white' };
      game.board[4][0] = { type: 'rook', color: 'black' }; // Can attack
      game.board[0][0] = { type: 'rook', color: 'black' }; // Path blocked
      game.board[2][2] = { type: 'pawn', color: 'white' }; // Blocks diagonal
      game.board[7][7] = { type: 'king', color: 'black' };

      const inCheck = game.isInCheck('white');
      expect(inCheck).toBe(true);
      expect(game.checkDetails.attackingPieces).toHaveLength(1);
      expect(game.checkDetails.attackingPieces[0].position).toEqual({ row: 4, col: 0 });
    });

    test('should correctly identify no check when king is safe', () => {
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[4][4] = { type: 'king', color: 'white' };
      game.board[4][1] = { type: 'rook', color: 'black' };
      game.board[4][2] = { type: 'pawn', color: 'white' }; // Blocks attack
      game.board[0][0] = { type: 'king', color: 'black' };

      const inCheck = game.isInCheck('white');
      expect(inCheck).toBe(false);
      expect(game.checkDetails).toBeNull();
    });

    test('should handle en passant in check scenarios', () => {
      // Set up en passant scenario where it might resolve check
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[3][3] = { type: 'king', color: 'white' };
      game.board[3][4] = { type: 'pawn', color: 'white' };
      game.board[3][5] = { type: 'pawn', color: 'black' };
      game.board[0][3] = { type: 'rook', color: 'black' }; // Attacking king
      game.board[0][0] = { type: 'king', color: 'black' };
      game.enPassantTarget = { row: 2, col: 5 };
      game.currentTurn = 'white';

      const inCheck = game.isInCheck('white');
      expect(inCheck).toBe(true);
      
      // Test that en passant capture could potentially resolve check
      // (This is a complex scenario that depends on the specific position)
    });
  });

  describe('Performance and Efficiency Tests', () => {
    test('should detect check efficiently in complex positions', () => {
      // Set up complex position with many pieces
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      
      // Add many pieces
      game.board[4][4] = { type: 'king', color: 'white' };
      game.board[4][0] = { type: 'rook', color: 'black' };
      game.board[0][0] = { type: 'king', color: 'black' };
      
      // Add more pieces that don't affect the check
      for (let i = 0; i < 8; i++) {
        if (i !== 4) {
          game.board[6][i] = { type: 'pawn', color: 'white' };
          game.board[1][i] = { type: 'pawn', color: 'black' };
        }
      }

      const startTime = Date.now();
      const inCheck = game.isInCheck('white');
      const endTime = Date.now();

      expect(inCheck).toBe(true);
      expect(endTime - startTime).toBeLessThan(50); // Should complete within 50ms
    });

    test('should detect checkmate efficiently', () => {
      // Set up checkmate position
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[0][0] = { type: 'king', color: 'white' };
      game.board[1][2] = { type: 'queen', color: 'black' };
      game.board[2][1] = { type: 'king', color: 'black' };
      game.currentTurn = 'white';

      const startTime = Date.now();
      const isCheckmate = game.isCheckmate('white');
      const endTime = Date.now();

      expect(isCheckmate).toBe(true);
      expect(endTime - startTime).toBeLessThan(100); // Should complete within 100ms
    });
  });

  describe('Game State Integration', () => {
    test('should update game status correctly for check', () => {
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[4][4] = { type: 'king', color: 'white' };
      game.board[4][0] = { type: 'rook', color: 'black' };
      game.board[0][0] = { type: 'king', color: 'black' };
      game.currentTurn = 'white';

      // Test game state updates using current API
      game.checkGameEnd();
      expect(game.gameStatus).toBe('check');
      expect(game.inCheck).toBe(true);
    });

    test('should update game status correctly for checkmate', () => {
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[0][0] = { type: 'king', color: 'white' };
      game.board[2][0] = { type: 'queen', color: 'black' };
      game.board[1][1] = { type: 'king', color: 'black' };
      game.currentTurn = 'white';

      game.checkGameEnd();
      expect(game.gameStatus).toBe('checkmate');
      expect(game.winner).toBe('black');
      expect(game.inCheck).toBe(true);
    });

    test('should update game status correctly for stalemate', () => {
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[0][0] = { type: 'king', color: 'black' };
      game.board[1][2] = { type: 'queen', color: 'white' };
      game.board[2][1] = { type: 'king', color: 'white' };
      game.currentTurn = 'black';

      game.checkGameEnd();
      expect(game.gameStatus).toBe('stalemate');
      expect(game.winner).toBeNull();
      expect(game.inCheck).toBe(false);
    });

    test('should include check details in game state', () => {
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[4][4] = { type: 'king', color: 'white' };
      game.board[4][0] = { type: 'rook', color: 'black' };
      game.board[0][0] = { type: 'king', color: 'black' };
      game.currentTurn = 'white';

      // Test check details integration using current API
      game.checkGameEnd();
      expect(game.checkDetails).not.toBeNull();
      expect(game.checkDetails.attackingPieces).toHaveLength(1);
      expect(game.checkDetails.attackingPieces[0].piece.type).toBe('rook');
    });
  });
});