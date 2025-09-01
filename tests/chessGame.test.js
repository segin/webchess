/**
 * ChessGame Core Functionality Tests
 * Comprehensive tests for the main ChessGame class
 * Tests basic game mechanics, piece movement, and game state management
 */

const ChessGame = require('../src/shared/chessGame');

describe('ChessGame - Core Functionality', () => {
  let game;

  beforeEach(() => {
    game = testUtils.createFreshGame();
  });

  describe('Game Initialization', () => {
    test('should initialize with correct starting position and game state', () => {
      const gameState = game.getGameState();

      // Validate game state structure
      testUtils.validateGameState(gameState);

      // Validate initial state values
      expect(gameState.currentTurn).toBe('white');
      expect(gameState.status).toBe('active');
      expect(gameState.winner).toBe(null);

      // Validate starting piece positions
      testUtils.validateBoardPosition(gameState.board, 0, 0, { type: 'rook', color: 'black' });
      testUtils.validateBoardPosition(gameState.board, 0, 4, { type: 'king', color: 'black' });
      testUtils.validateBoardPosition(gameState.board, 7, 4, { type: 'king', color: 'white' });
      testUtils.validateBoardPosition(gameState.board, 1, 0, { type: 'pawn', color: 'black' });
      testUtils.validateBoardPosition(gameState.board, 6, 0, { type: 'pawn', color: 'white' });
    });

    test('should initialize with correct castling rights', () => {
      testUtils.validateCastlingRights(game.castlingRights);

      expect(game.castlingRights.white.kingside).toBe(true);
      expect(game.castlingRights.white.queenside).toBe(true);
      expect(game.castlingRights.black.kingside).toBe(true);
      expect(game.castlingRights.black.queenside).toBe(true);
    });
  });

  describe('Pawn Movement Validation', () => {
    test(testUtils.NamingPatterns.moveValidationTest('pawn', 'allow single square forward movement'), () => {
      const move = testUtils.TestData.VALID_MOVES.pawn[0];
      const result = testUtils.ExecutionHelpers.testMove(game, move, true);

      // Validate piece moved correctly
      testUtils.validateBoardPosition(game.board, 5, 4, { type: 'pawn', color: 'white' });
      testUtils.validateBoardPosition(game.board, 6, 4, null);
    });

    test(testUtils.NamingPatterns.moveValidationTest('pawn', 'allow two square initial movement'), () => {
      const move = testUtils.TestData.VALID_MOVES.pawn[1];
      const result = testUtils.ExecutionHelpers.testMove(game, move, true);

      // Validate piece moved correctly
      testUtils.validateBoardPosition(game.board, 4, 4, { type: 'pawn', color: 'white' });
      testUtils.validateBoardPosition(game.board, 6, 4, null);
    });

    test(testUtils.NamingPatterns.moveValidationTest('pawn', 'reject two square movement from non-starting position'), () => {
      // Execute setup moves
      testUtils.ExecutionHelpers.executeMovesSequence(game, [
        { from: { row: 6, col: 4 }, to: { row: 5, col: 4 } },
        { from: { row: 1, col: 4 }, to: { row: 2, col: 4 } }
      ]);

      // Test invalid two-square move
      const invalidMove = { from: { row: 5, col: 4 }, to: { row: 3, col: 4 } };
      testUtils.ExecutionHelpers.testMove(game, invalidMove, false, testUtils.TestData.ERROR_CODES.INVALID_MOVEMENT);
    });

    test(testUtils.NamingPatterns.moveValidationTest('pawn', 'allow diagonal capture'), () => {
      // Setup capture scenario
      const setupMoves = [
        { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } },
        { from: { row: 1, col: 3 }, to: { row: 3, col: 3 } }
      ];
      testUtils.ExecutionHelpers.executeMovesSequence(game, setupMoves);

      // Test diagonal capture
      const captureMove = { from: { row: 4, col: 4 }, to: { row: 3, col: 3 } };
      testUtils.ExecutionHelpers.testMove(game, captureMove, true);

      // Validate capture result
      testUtils.validateBoardPosition(game.board, 3, 3, { type: 'pawn', color: 'white' });
      testUtils.validateBoardPosition(game.board, 4, 4, null);
    });

    test(testUtils.NamingPatterns.moveValidationTest('pawn', 'reject forward movement when blocked'), () => {
      // Place blocking piece
      game.board[5][4] = { type: 'pawn', color: 'black' };

      const blockedMove = { from: { row: 6, col: 4 }, to: { row: 5, col: 4 } };
      testUtils.ExecutionHelpers.testMove(game, blockedMove, false, testUtils.TestData.ERROR_CODES.INVALID_MOVEMENT);
    });

    test(testUtils.NamingPatterns.moveValidationTest('pawn', 'handle promotion correctly'), () => {
      // Set up promotion scenario
      game.board[1][0] = { type: 'pawn', color: 'white' };
      game.board[6][0] = null;
      game.board[0][0] = null; // Remove black rook

      const promotionMove = {
        from: { row: 1, col: 0 },
        to: { row: 0, col: 0 },
        promotion: 'queen'
      };

      testUtils.ExecutionHelpers.testMove(game, promotionMove, true);
      testUtils.validateBoardPosition(game.board, 0, 0, { type: 'queen', color: 'white' });
    });

    test(testUtils.NamingPatterns.moveValidationTest('pawn', 'handle en passant capture'), () => {
      // Use standardized en passant position
      game = testUtils.TestPositions.EN_PASSANT_SETUP();

      const enPassantMove = { from: { row: 3, col: 4 }, to: { row: 2, col: 3 } };
      testUtils.ExecutionHelpers.testMove(game, enPassantMove, true);

      // Validate en passant result
      testUtils.validateBoardPosition(game.board, 2, 3, { type: 'pawn', color: 'white' });
      testUtils.validateBoardPosition(game.board, 3, 3, null); // Captured pawn removed
    });
  });

  describe('Knight Movement Validation', () => {
    test(testUtils.NamingPatterns.moveValidationTest('knight', 'allow valid L-shaped moves'), () => {
      const validMoves = testUtils.TestData.VALID_MOVES.knight;

      validMoves.forEach(move => {
        const freshGame = testUtils.createFreshGame();
        testUtils.ExecutionHelpers.testMove(freshGame, move, true);
      });
    });

    test(testUtils.NamingPatterns.moveValidationTest('knight', 'reject invalid non-L-shaped moves'), () => {
      const invalidMoves = [
        { from: { row: 7, col: 1 }, to: { row: 5, col: 1 } }, // Straight line
        { from: { row: 7, col: 1 }, to: { row: 6, col: 2 } }, // Too short
        { from: { row: 7, col: 1 }, to: { row: 4, col: 1 } }  // Too far
      ];

      invalidMoves.forEach(move => {
        const freshGame = testUtils.createFreshGame();
        testUtils.ExecutionHelpers.testMove(freshGame, move, false, testUtils.TestData.ERROR_CODES.INVALID_MOVEMENT);
      });
    });

    test(testUtils.NamingPatterns.moveValidationTest('knight', 'allow jumping over pieces'), () => {
      // Knight can jump over pawns in starting position
      const knightJumpMove = { from: { row: 7, col: 1 }, to: { row: 5, col: 2 } };
      testUtils.ExecutionHelpers.testMove(game, knightJumpMove, true);

      // Validate knight moved correctly
      testUtils.validateBoardPosition(game.board, 5, 2, { type: 'knight', color: 'white' });
      testUtils.validateBoardPosition(game.board, 7, 1, null);
    });

    test(testUtils.NamingPatterns.moveValidationTest('knight', 'execute valid tour sequence'), () => {
      // Set up isolated knight for tour with alternating moves
      const tourGame = testUtils.TestPositions.KINGS_ONLY();
      tourGame.board[0][0] = { type: 'knight', color: 'white' };
      tourGame.board[0][7] = { type: 'knight', color: 'black' };

      const knightTourMoves = [
        { from: { row: 0, col: 0 }, to: { row: 2, col: 1 } }, // White knight
        { from: { row: 0, col: 7 }, to: { row: 2, col: 6 } }, // Black knight
        { from: { row: 2, col: 1 }, to: { row: 4, col: 2 } }, // White knight
        { from: { row: 2, col: 6 }, to: { row: 4, col: 5 } }, // Black knight
        { from: { row: 4, col: 2 }, to: { row: 6, col: 3 } }, // White knight
        { from: { row: 4, col: 5 }, to: { row: 6, col: 4 } }, // Black knight
        { from: { row: 6, col: 3 }, to: { row: 4, col: 4 } }, // White knight
        { from: { row: 6, col: 4 }, to: { row: 4, col: 3 } }  // Black knight
      ];

      testUtils.ExecutionHelpers.executeMovesSequence(tourGame, knightTourMoves);

      // Validate final positions
      testUtils.validateBoardPosition(tourGame.board, 4, 4, { type: 'knight', color: 'white' });
      testUtils.validateBoardPosition(tourGame.board, 4, 3, { type: 'knight', color: 'black' });
    });
  });

  describe('Rook Movement Validation', () => {
    test(testUtils.NamingPatterns.moveValidationTest('rook', 'allow horizontal and vertical moves'), () => {
      // Clear path for rook movement
      game.board[6][0] = null;
      game.board[5][0] = null;
      game.board[4][0] = null;

      const verticalMove = { from: { row: 7, col: 0 }, to: { row: 4, col: 0 } };
      testUtils.ExecutionHelpers.testMove(game, verticalMove, true);

      testUtils.validateBoardPosition(game.board, 4, 0, { type: 'rook', color: 'white' });
    });

    test(testUtils.NamingPatterns.moveValidationTest('rook', 'reject diagonal moves'), () => {
      game.board[6][0] = null;

      const diagonalMove = { from: { row: 7, col: 0 }, to: { row: 6, col: 1 } };
      testUtils.ExecutionHelpers.testMove(game, diagonalMove, false, testUtils.TestData.ERROR_CODES.INVALID_MOVEMENT);
    });

    test(testUtils.NamingPatterns.moveValidationTest('rook', 'reject moves through pieces'), () => {
      const blockedMove = { from: { row: 7, col: 0 }, to: { row: 4, col: 0 } };
      testUtils.ExecutionHelpers.testMove(game, blockedMove, false, testUtils.TestData.ERROR_CODES.PATH_BLOCKED);
    });
  });

  describe('Bishop Movement Validation', () => {
    test(testUtils.NamingPatterns.moveValidationTest('bishop', 'allow diagonal moves'), () => {
      game.board[6][3] = null;

      const diagonalMove = { from: { row: 7, col: 2 }, to: { row: 6, col: 3 } };
      testUtils.ExecutionHelpers.testMove(game, diagonalMove, true);

      testUtils.validateBoardPosition(game.board, 6, 3, { type: 'bishop', color: 'white' });
    });

    test(testUtils.NamingPatterns.moveValidationTest('bishop', 'reject non-diagonal moves'), () => {
      game.board[6][2] = null;

      const straightMove = { from: { row: 7, col: 2 }, to: { row: 6, col: 2 } };
      testUtils.ExecutionHelpers.testMove(game, straightMove, false, testUtils.TestData.ERROR_CODES.INVALID_MOVEMENT);
    });

    test(testUtils.NamingPatterns.moveValidationTest('bishop', 'reject moves through pieces'), () => {
      const blockedMove = { from: { row: 7, col: 2 }, to: { row: 5, col: 4 } };
      testUtils.ExecutionHelpers.testMove(game, blockedMove, false, testUtils.TestData.ERROR_CODES.PATH_BLOCKED);
    });
  });

  describe('Queen Movement Validation', () => {
    test(testUtils.NamingPatterns.moveValidationTest('queen', 'allow horizontal, vertical, and diagonal moves'), () => {
      // Clear path for queen movement
      game.board[6][3] = null;
      game.board[5][3] = null;

      const verticalMove = { from: { row: 7, col: 3 }, to: { row: 5, col: 3 } };
      testUtils.ExecutionHelpers.testMove(game, verticalMove, true);

      testUtils.validateBoardPosition(game.board, 5, 3, { type: 'queen', color: 'white' });
    });

    test(testUtils.NamingPatterns.moveValidationTest('queen', 'combine rook and bishop movement patterns'), () => {
      const freshGame = testUtils.createFreshGame();
      freshGame.board[6][3] = null;
      freshGame.board[5][3] = null;
      freshGame.board[4][3] = null;

      const longVerticalMove = { from: { row: 7, col: 3 }, to: { row: 4, col: 3 } };
      testUtils.ExecutionHelpers.testMove(freshGame, longVerticalMove, true);

      testUtils.validateBoardPosition(freshGame.board, 4, 3, { type: 'queen', color: 'white' });
    });
  });

  describe('King Movement Validation', () => {
    test(testUtils.NamingPatterns.moveValidationTest('king', 'allow single square moves in all directions'), () => {
      game.board[6][4] = null;

      const singleSquareMove = { from: { row: 7, col: 4 }, to: { row: 6, col: 4 } };
      testUtils.ExecutionHelpers.testMove(game, singleSquareMove, true);

      testUtils.validateBoardPosition(game.board, 6, 4, { type: 'king', color: 'white' });
    });

    test(testUtils.NamingPatterns.moveValidationTest('king', 'reject moves more than one square'), () => {
      game.board[6][4] = null;
      game.board[5][4] = null;

      const multiSquareMove = { from: { row: 7, col: 4 }, to: { row: 5, col: 4 } };
      testUtils.ExecutionHelpers.testMove(game, multiSquareMove, false, testUtils.TestData.ERROR_CODES.INVALID_MOVEMENT);
    });
  });

  describe('Castling Special Move Validation', () => {
    test(testUtils.NamingPatterns.moveValidationTest('king', 'allow kingside castling when conditions are met'), () => {
      game = testUtils.TestPositions.CASTLING_READY_KINGSIDE();

      const kingsideCastling = { from: { row: 7, col: 4 }, to: { row: 7, col: 6 } };
      testUtils.ExecutionHelpers.testMove(game, kingsideCastling, true);

      // Validate castling result
      testUtils.validateBoardPosition(game.board, 7, 6, { type: 'king', color: 'white' });
      testUtils.validateBoardPosition(game.board, 7, 5, { type: 'rook', color: 'white' });
      testUtils.validateBoardPosition(game.board, 7, 4, null);
      testUtils.validateBoardPosition(game.board, 7, 7, null);
    });

    test(testUtils.NamingPatterns.moveValidationTest('king', 'allow queenside castling when conditions are met'), () => {
      game = testUtils.TestPositions.CASTLING_READY_QUEENSIDE();

      const queensideCastling = { from: { row: 7, col: 4 }, to: { row: 7, col: 2 } };
      testUtils.ExecutionHelpers.testMove(game, queensideCastling, true);

      // Validate castling result
      testUtils.validateBoardPosition(game.board, 7, 2, { type: 'king', color: 'white' });
      testUtils.validateBoardPosition(game.board, 7, 3, { type: 'rook', color: 'white' });
      testUtils.validateBoardPosition(game.board, 7, 4, null);
      testUtils.validateBoardPosition(game.board, 7, 0, null);
    });

    test(testUtils.NamingPatterns.moveValidationTest('king', 'reject castling after king has moved'), () => {
      game = testUtils.TestPositions.CASTLING_READY_KINGSIDE();

      // Move king and back to invalidate castling rights
      const setupMoves = [
        { from: { row: 7, col: 4 }, to: { row: 7, col: 5 } },
        { from: { row: 1, col: 0 }, to: { row: 2, col: 0 } },
        { from: { row: 7, col: 5 }, to: { row: 7, col: 4 } },
        { from: { row: 2, col: 0 }, to: { row: 3, col: 0 } }
      ];
      testUtils.ExecutionHelpers.executeMovesSequence(game, setupMoves);

      const invalidCastling = { from: { row: 7, col: 4 }, to: { row: 7, col: 6 } };
      testUtils.ExecutionHelpers.testMove(game, invalidCastling, false, testUtils.TestData.ERROR_CODES.INVALID_CASTLING);
    });

    test(testUtils.NamingPatterns.moveValidationTest('king', 'reject castling after rook has moved'), () => {
      game = testUtils.TestPositions.CASTLING_READY_KINGSIDE();

      // Move rook and back to invalidate castling rights
      const setupMoves = [
        { from: { row: 7, col: 7 }, to: { row: 7, col: 5 } },
        { from: { row: 1, col: 0 }, to: { row: 2, col: 0 } },
        { from: { row: 7, col: 5 }, to: { row: 7, col: 7 } },
        { from: { row: 2, col: 0 }, to: { row: 3, col: 0 } }
      ];
      testUtils.ExecutionHelpers.executeMovesSequence(game, setupMoves);

      const invalidCastling = { from: { row: 7, col: 4 }, to: { row: 7, col: 6 } };
      testUtils.ExecutionHelpers.testMove(game, invalidCastling, false, testUtils.TestData.ERROR_CODES.INVALID_CASTLING);
    });

    test(testUtils.NamingPatterns.moveValidationTest('king', 'reject castling through check'), () => {
      game = testUtils.TestPositions.CASTLING_READY_KINGSIDE();
      // Clear the f-file and place attacking rook
      game.board[6][5] = null; // Remove f2 pawn
      game.board[1][5] = { type: 'rook', color: 'black' }; // Place rook on f7

      const castlingThroughCheck = { from: { row: 7, col: 4 }, to: { row: 7, col: 6 } };
      testUtils.ExecutionHelpers.testMove(game, castlingThroughCheck, false, testUtils.TestData.ERROR_CODES.INVALID_CASTLING);
    });

    test(testUtils.NamingPatterns.moveValidationTest('king', 'reject castling while in check'), () => {
      game = testUtils.TestPositions.CASTLING_READY_KINGSIDE();
      // Clear the e-file and place attacking rook
      game.board[6][4] = null; // Remove e2 pawn
      game.board[1][4] = { type: 'rook', color: 'black' }; // Place rook on e7

      const castlingInCheck = { from: { row: 7, col: 4 }, to: { row: 7, col: 6 } };
      testUtils.ExecutionHelpers.testMove(game, castlingInCheck, false, testUtils.TestData.ERROR_CODES.INVALID_CASTLING);
    });
  });

  describe('Check, Checkmate, and Stalemate Detection', () => {
    test(testUtils.NamingPatterns.gameStateTest('check detection', 'detect when king is under attack'), () => {
      game = testUtils.TestPositions.CHECK_POSITION();

      const inCheck = game.isInCheck('white');
      expect(inCheck).toBe(true);
    });

    test(testUtils.NamingPatterns.moveValidationTest('any piece', 'prevent moves that expose own king to check'), () => {
      // Set up pinned piece scenario
      game.board[6][4] = null;
      game.board[5][4] = { type: 'bishop', color: 'white' };
      game.board[1][4] = { type: 'rook', color: 'black' };

      const exposingMove = { from: { row: 5, col: 4 }, to: { row: 4, col: 3 } };
      testUtils.ExecutionHelpers.testMove(game, exposingMove, false, testUtils.TestData.ERROR_CODES.PINNED_PIECE_INVALID_MOVE);
    });

    test(testUtils.NamingPatterns.gameStateTest('checkmate detection', 'identify checkmate positions correctly'), () => {
      game = testUtils.TestPositions.CHECKMATE_POSITION();

      // Update game status
      game.checkGameEnd();

      const isCheckmate = game.isCheckmate('black');
      expect(isCheckmate).toBe(true);

      // Validate game state reflects checkmate
      const gameState = game.getGameState();
      expect(gameState.status).toBe('checkmate');
    });

    test(testUtils.NamingPatterns.gameStateTest('stalemate detection', 'identify stalemate positions correctly'), () => {
      game = testUtils.TestPositions.STALEMATE_POSITION();

      // Update game status
      game.checkGameEnd();

      const isStalemate = game.isStalemate('black');
      expect(isStalemate).toBe(true);

      // Validate game state reflects stalemate
      const gameState = game.getGameState();
      expect(gameState.status).toBe('stalemate');
    });
  });

  describe('Turn Management System', () => {
    test(testUtils.NamingPatterns.gameStateTest('turn alternation', 'alternate between white and black players'), () => {
      expect(game.currentTurn).toBe('white');

      // Execute white move
      testUtils.ExecutionHelpers.testMove(game, { from: { row: 6, col: 4 }, to: { row: 5, col: 4 } }, true);
      expect(game.currentTurn).toBe('black');

      // Execute black move
      testUtils.ExecutionHelpers.testMove(game, { from: { row: 1, col: 4 }, to: { row: 2, col: 4 } }, true);
      expect(game.currentTurn).toBe('white');
    });

    test(testUtils.NamingPatterns.moveValidationTest('any piece', 'reject moves by wrong color'), () => {
      // Try to move black piece on white's turn
      const wrongTurnMove = { from: { row: 1, col: 4 }, to: { row: 2, col: 4 } };
      testUtils.ExecutionHelpers.testMove(game, wrongTurnMove, false, testUtils.TestData.ERROR_CODES.WRONG_TURN);
    });
  });

  describe('Game State Management', () => {
    test(testUtils.NamingPatterns.gameStateTest('state structure', 'return complete and valid game state'), () => {
      const state = game.getGameState();

      // Validate complete game state structure
      testUtils.validateGameState(state);

      // Validate specific initial state values
      expect(state.board).toHaveLength(8);
      expect(state.board[0]).toHaveLength(8);
      expect(state.currentTurn).toBe('white');
      expect(state.status).toBe('active');
      expect(state.winner).toBe(null);
      expect(state.inCheck).toBe(false);
    });

    test(testUtils.NamingPatterns.gameStateTest('move history tracking', 'maintain accurate move history'), () => {
      const testMoves = [
        { from: { row: 6, col: 4 }, to: { row: 5, col: 4 } },
        { from: { row: 1, col: 4 }, to: { row: 2, col: 4 } }
      ];

      testUtils.ExecutionHelpers.executeMovesSequence(game, testMoves);

      const state = game.getGameState();
      expect(state.moveHistory).toHaveLength(2);

      // Validate first move history entry
      testUtils.validateMoveHistoryEntry(state.moveHistory[0]);
      expect(state.moveHistory[0]).toEqual({
        from: { row: 6, col: 4 },
        to: { row: 5, col: 4 },
        piece: 'pawn',
        color: 'white',
        captured: null,
        promotion: null
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test(testUtils.NamingPatterns.errorHandlingTest('invalid coordinates', 'coordinates are out of bounds'), () => {
      const invalidCoordinateMove = testUtils.DataGenerators.moveObject(
        { row: -1, col: 0 },
        { row: 0, col: 0 }
      );

      testUtils.ExecutionHelpers.testMove(game, invalidCoordinateMove, false, testUtils.TestData.ERROR_CODES.INVALID_COORDINATES);
    });

    test(testUtils.NamingPatterns.errorHandlingTest('empty square', 'attempting to move from empty square'), () => {
      const emptySquareMove = testUtils.DataGenerators.moveObject(
        { row: 4, col: 4 },
        { row: 3, col: 4 }
      );

      testUtils.ExecutionHelpers.testMove(game, emptySquareMove, false, testUtils.TestData.ERROR_CODES.NO_PIECE);
    });

    test(testUtils.NamingPatterns.errorHandlingTest('friendly fire', 'attempting to capture own piece'), () => {
      const friendlyFireMove = testUtils.DataGenerators.moveObject(
        { row: 6, col: 4 },
        { row: 7, col: 4 }
      );

      testUtils.ExecutionHelpers.testMove(game, friendlyFireMove, false, testUtils.TestData.ERROR_CODES.INVALID_MOVEMENT);
    });
  });
});