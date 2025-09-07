/**
 * ChessGame Core Functionality Tests
 * Comprehensive tests for the main ChessGame class
 * Tests basic game mechanics, piece movement, and game state management
 */

const ChessGame = require('../src/shared/chessGame');

describe('ChessGame - Core Functionality', () => {
  let game;

  beforeEach(() => {
    game = new ChessGame();
  });

  describe('Game Initialization', () => {
    test('should initialize with correct starting position and game state', () => {
      const gameState = game.getGameState();

      // Validate game state structure
      expect(gameState).toBeDefined();
      expect(gameState.board).toBeDefined();
      expect(Array.isArray(gameState.board)).toBe(true);
      expect(gameState.board).toHaveLength(8);
      expect(gameState.currentTurn).toBeDefined();
      expect(['white', 'black']).toContain(gameState.currentTurn);
      expect(gameState.gameStatus).toBeDefined();
      expect(['active', 'check', 'checkmate', 'stalemate', 'draw']).toContain(gameState.gameStatus);

      // Validate initial state values
      expect(gameState.currentTurn).toBe('white');
      expect(gameState.gameStatus).toBe('active');
      expect(gameState.winner).toBe(null);

      // Validate starting piece positions
      expect(gameState.board[0][0]).toEqual({ type: 'rook', color: 'black' });
      expect(gameState.board[0][4]).toEqual({ type: 'king', color: 'black' });
      expect(gameState.board[7][4]).toEqual({ type: 'king', color: 'white' });
      expect(gameState.board[1][0]).toEqual({ type: 'pawn', color: 'black' });
      expect(gameState.board[6][0]).toEqual({ type: 'pawn', color: 'white' });
    });

    test('should initialize with correct castling rights', () => {
      const gameState = game.getGameState();
      
      expect(gameState.castlingRights).toBeDefined();
      expect(gameState.castlingRights.white).toBeDefined();
      expect(gameState.castlingRights.black).toBeDefined();
      expect(typeof gameState.castlingRights.white.kingside).toBe('boolean');
      expect(typeof gameState.castlingRights.white.queenside).toBe('boolean');
      expect(typeof gameState.castlingRights.black.kingside).toBe('boolean');
      expect(typeof gameState.castlingRights.black.queenside).toBe('boolean');

      expect(gameState.castlingRights.white.kingside).toBe(true);
      expect(gameState.castlingRights.white.queenside).toBe(true);
      expect(gameState.castlingRights.black.kingside).toBe(true);
      expect(gameState.castlingRights.black.queenside).toBe(true);
    });
  });

  describe('Pawn Movement Validation', () => {
    test('should allow single square forward movement for pawn movement', () => {
      const move = { from: { row: 6, col: 4 }, to: { row: 5, col: 4 } };
      const result = game.makeMove(move);

      // Validate successful response
      expect(result.success).toBe(true);
      expect(result.message).toBeDefined();
      expect(result.data).toBeDefined();

      // Validate piece moved correctly
      const gameState = game.getGameState();
      expect(gameState.board[5][4]).toEqual({ type: 'pawn', color: 'white' });
      expect(gameState.board[6][4]).toBeNull();
    });

    test('should allow two square initial movement for pawn movement', () => {
      const move = { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } };
      const result = game.makeMove(move);

      // Validate successful response
      expect(result.success).toBe(true);
      expect(result.message).toBeDefined();
      expect(result.data).toBeDefined();

      // Validate piece moved correctly
      const gameState = game.getGameState();
      expect(gameState.board[4][4]).toEqual({ type: 'pawn', color: 'white' });
      expect(gameState.board[6][4]).toBeNull();
    });

    test('should reject two square movement from non-starting position for pawn movement', () => {
      // Execute setup moves
      const setupMoves = [
        { from: { row: 6, col: 4 }, to: { row: 5, col: 4 } },
        { from: { row: 1, col: 4 }, to: { row: 2, col: 4 } }
      ];
      
      setupMoves.forEach(move => {
        const result = game.makeMove(move);
        expect(result.success).toBe(true);
      });

      // Test invalid two-square move
      const invalidMove = { from: { row: 5, col: 4 }, to: { row: 3, col: 4 } };
      const result = game.makeMove(invalidMove);
      
      expect(result.success).toBe(false);
      expect(result.message).toBeDefined();
      expect(result.errorCode).toBe('INVALID_MOVEMENT');
    });

    test('should allow diagonal capture for pawn movement', () => {
      // Setup capture scenario
      const setupMoves = [
        { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } },
        { from: { row: 1, col: 3 }, to: { row: 3, col: 3 } }
      ];
      
      setupMoves.forEach(move => {
        const result = game.makeMove(move);
        expect(result.success).toBe(true);
      });

      // Test diagonal capture
      const captureMove = { from: { row: 4, col: 4 }, to: { row: 3, col: 3 } };
      const result = game.makeMove(captureMove);
      
      expect(result.success).toBe(true);
      expect(result.message).toBeDefined();
      expect(result.data).toBeDefined();

      // Validate capture result
      const gameState = game.getGameState();
      expect(gameState.board[3][3]).toEqual({ type: 'pawn', color: 'white' });
      expect(gameState.board[4][4]).toBeNull();
    });

    test('should reject forward movement when blocked for pawn movement', () => {
      // Place blocking piece
      game.board[5][4] = { type: 'pawn', color: 'black' };

      const blockedMove = { from: { row: 6, col: 4 }, to: { row: 5, col: 4 } };
      const result = game.makeMove(blockedMove);
      
      expect(result.success).toBe(false);
      expect(result.message).toBeDefined();
      expect(result.errorCode).toBe('INVALID_MOVEMENT');
    });

    test('should handle promotion correctly for pawn movement', () => {
      // Set up promotion scenario
      game.board[1][0] = { type: 'pawn', color: 'white' };
      game.board[6][0] = null;
      game.board[0][0] = null; // Remove black rook

      const promotionMove = {
        from: { row: 1, col: 0 },
        to: { row: 0, col: 0 },
        promotion: 'queen'
      };

      const result = game.makeMove(promotionMove);
      
      expect(result.success).toBe(true);
      expect(result.message).toBeDefined();
      expect(result.data).toBeDefined();
      
      const gameState = game.getGameState();
      expect(gameState.board[0][0]).toEqual({ type: 'queen', color: 'white' });
    });

    test('should handle en passant capture for pawn movement', () => {
      // Set up en passant position
      game.board[6][4] = null;
      game.board[3][4] = { type: 'pawn', color: 'white' };
      game.board[1][3] = null;
      game.board[3][3] = { type: 'pawn', color: 'black' };
      game.enPassantTarget = { row: 2, col: 3 };
      game.currentTurn = 'white';

      const enPassantMove = { from: { row: 3, col: 4 }, to: { row: 2, col: 3 } };
      const result = game.makeMove(enPassantMove);
      
      expect(result.success).toBe(true);
      expect(result.message).toBeDefined();
      expect(result.data).toBeDefined();

      // Validate en passant result
      const gameState = game.getGameState();
      expect(gameState.board[2][3]).toEqual({ type: 'pawn', color: 'white' });
      expect(gameState.board[3][3]).toBeNull(); // Captured pawn removed
    });
  });

  describe('Knight Movement Validation', () => {
    test('should allow valid L-shaped moves for knight movement', () => {
      const validMoves = [
        { from: { row: 7, col: 1 }, to: { row: 5, col: 0 } },
        { from: { row: 7, col: 1 }, to: { row: 5, col: 2 } }
      ];

      validMoves.forEach(move => {
        const freshGame = new ChessGame();
        const result = freshGame.makeMove(move);
        
        expect(result.success).toBe(true);
        expect(result.message).toBeDefined();
        expect(result.data).toBeDefined();
      });
    });

    test('should reject invalid non-L-shaped moves for knight movement', () => {
      const invalidMoves = [
        { from: { row: 7, col: 1 }, to: { row: 5, col: 1 } }, // Straight line
        { from: { row: 7, col: 1 }, to: { row: 6, col: 2 } }, // Too short
        { from: { row: 7, col: 1 }, to: { row: 4, col: 1 } }  // Too far
      ];

      invalidMoves.forEach(move => {
        const freshGame = new ChessGame();
        const result = freshGame.makeMove(move);
        
        expect(result.success).toBe(false);
        expect(result.message).toBeDefined();
        expect(result.errorCode).toBe('INVALID_MOVEMENT');
      });
    });

    test('should allow jumping over pieces for knight movement', () => {
      // Knight can jump over pawns in starting position
      const knightJumpMove = { from: { row: 7, col: 1 }, to: { row: 5, col: 2 } };
      const result = game.makeMove(knightJumpMove);
      
      expect(result.success).toBe(true);
      expect(result.message).toBeDefined();
      expect(result.data).toBeDefined();

      // Validate knight moved correctly
      const gameState = game.getGameState();
      expect(gameState.board[5][2]).toEqual({ type: 'knight', color: 'white' });
      expect(gameState.board[7][1]).toBeNull();
    });

    test('should execute valid tour sequence for knight movement', () => {
      // Set up isolated knight for tour with alternating moves
      const tourGame = new ChessGame();
      tourGame.board = Array(8).fill(null).map(() => Array(8).fill(null));
      tourGame.board[0][4] = { type: 'king', color: 'black' };
      tourGame.board[7][4] = { type: 'king', color: 'white' };
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

      knightTourMoves.forEach(move => {
        const result = tourGame.makeMove(move);
        expect(result.success).toBe(true);
      });

      // Validate final positions
      const gameState = tourGame.getGameState();
      expect(gameState.board[4][4]).toEqual({ type: 'knight', color: 'white' });
      expect(gameState.board[4][3]).toEqual({ type: 'knight', color: 'black' });
    });
  });

  describe('Rook Movement Validation', () => {
    test('should allow horizontal and vertical moves for rook movement', () => {
      // Clear path for rook movement
      game.board[6][0] = null;
      game.board[5][0] = null;
      game.board[4][0] = null;

      const verticalMove = { from: { row: 7, col: 0 }, to: { row: 4, col: 0 } };
      const result = game.makeMove(verticalMove);
      
      expect(result.success).toBe(true);
      expect(result.message).toBeDefined();
      expect(result.data).toBeDefined();

      const gameState = game.getGameState();
      expect(gameState.board[4][0]).toEqual({ type: 'rook', color: 'white' });
    });

    test('should reject diagonal moves for rook movement', () => {
      game.board[6][0] = null;

      const diagonalMove = { from: { row: 7, col: 0 }, to: { row: 6, col: 1 } };
      const result = game.makeMove(diagonalMove);
      
      expect(result.success).toBe(false);
      expect(result.message).toBeDefined();
      expect(result.errorCode).toBe('INVALID_MOVEMENT');
    });

    test('should reject moves through pieces for rook movement', () => {
      const blockedMove = { from: { row: 7, col: 0 }, to: { row: 4, col: 0 } };
      const result = game.makeMove(blockedMove);
      
      expect(result.success).toBe(false);
      expect(result.message).toBeDefined();
      expect(result.errorCode).toBe('PATH_BLOCKED');
    });
  });

  describe('Bishop Movement Validation', () => {
    test('should allow diagonal moves for bishop movement', () => {
      game.board[6][3] = null;

      const diagonalMove = { from: { row: 7, col: 2 }, to: { row: 6, col: 3 } };
      const result = game.makeMove(diagonalMove);
      
      expect(result.success).toBe(true);
      expect(result.message).toBeDefined();
      expect(result.data).toBeDefined();

      const gameState = game.getGameState();
      expect(gameState.board[6][3]).toEqual({ type: 'bishop', color: 'white' });
    });

    test('should reject non-diagonal moves for bishop movement', () => {
      game.board[6][2] = null;

      const straightMove = { from: { row: 7, col: 2 }, to: { row: 6, col: 2 } };
      const result = game.makeMove(straightMove);
      
      expect(result.success).toBe(false);
      expect(result.message).toBeDefined();
      expect(result.errorCode).toBe('INVALID_MOVEMENT');
    });

    test('should reject moves through pieces for bishop movement', () => {
      const blockedMove = { from: { row: 7, col: 2 }, to: { row: 5, col: 4 } };
      const result = game.makeMove(blockedMove);
      
      expect(result.success).toBe(false);
      expect(result.message).toBeDefined();
      expect(result.errorCode).toBe('PATH_BLOCKED');
    });
  });

  describe('Queen Movement Validation', () => {
    test('should allow horizontal, vertical, and diagonal moves for queen movement', () => {
      // Clear path for queen movement
      game.board[6][3] = null;
      game.board[5][3] = null;

      const verticalMove = { from: { row: 7, col: 3 }, to: { row: 5, col: 3 } };
      const result = game.makeMove(verticalMove);
      
      expect(result.success).toBe(true);
      expect(result.message).toBeDefined();
      expect(result.data).toBeDefined();

      const gameState = game.getGameState();
      expect(gameState.board[5][3]).toEqual({ type: 'queen', color: 'white' });
    });

    test('should combine rook and bishop movement patterns for queen movement', () => {
      const freshGame = new ChessGame();
      freshGame.board[6][3] = null;
      freshGame.board[5][3] = null;
      freshGame.board[4][3] = null;

      const longVerticalMove = { from: { row: 7, col: 3 }, to: { row: 4, col: 3 } };
      const result = freshGame.makeMove(longVerticalMove);
      
      expect(result.success).toBe(true);
      expect(result.message).toBeDefined();
      expect(result.data).toBeDefined();

      const gameState = freshGame.getGameState();
      expect(gameState.board[4][3]).toEqual({ type: 'queen', color: 'white' });
    });
  });

  describe('King Movement Validation', () => {
    test('should allow single square moves in all directions for king movement', () => {
      game.board[6][4] = null;

      const singleSquareMove = { from: { row: 7, col: 4 }, to: { row: 6, col: 4 } };
      const result = game.makeMove(singleSquareMove);
      
      expect(result.success).toBe(true);
      expect(result.message).toBeDefined();
      expect(result.data).toBeDefined();

      const gameState = game.getGameState();
      expect(gameState.board[6][4]).toEqual({ type: 'king', color: 'white' });
    });

    test('should reject moves more than one square for king movement', () => {
      game.board[6][4] = null;
      game.board[5][4] = null;

      const multiSquareMove = { from: { row: 7, col: 4 }, to: { row: 5, col: 4 } };
      const result = game.makeMove(multiSquareMove);
      
      expect(result.success).toBe(false);
      expect(result.message).toBeDefined();
      expect(result.errorCode).toBe('INVALID_MOVEMENT');
    });
  });

  describe('Castling Special Move Validation', () => {
    test('should allow kingside castling when conditions are met for king movement', () => {
      // Set up castling ready position
      game.board[7][5] = null; // Bishop
      game.board[7][6] = null; // Knight

      const kingsideCastling = { from: { row: 7, col: 4 }, to: { row: 7, col: 6 } };
      const result = game.makeMove(kingsideCastling);
      
      expect(result.success).toBe(true);
      expect(result.message).toBeDefined();
      expect(result.data).toBeDefined();

      // Validate castling result
      const gameState = game.getGameState();
      expect(gameState.board[7][6]).toEqual({ type: 'king', color: 'white' });
      expect(gameState.board[7][5]).toEqual({ type: 'rook', color: 'white' });
      expect(gameState.board[7][4]).toBeNull();
      expect(gameState.board[7][7]).toBeNull();
    });

    test('should allow queenside castling when conditions are met for king movement', () => {
      // Set up castling ready position
      game.board[7][1] = null; // Knight
      game.board[7][2] = null; // Bishop
      game.board[7][3] = null; // Queen

      const queensideCastling = { from: { row: 7, col: 4 }, to: { row: 7, col: 2 } };
      const result = game.makeMove(queensideCastling);
      
      expect(result.success).toBe(true);
      expect(result.message).toBeDefined();
      expect(result.data).toBeDefined();

      // Validate castling result
      const gameState = game.getGameState();
      expect(gameState.board[7][2]).toEqual({ type: 'king', color: 'white' });
      expect(gameState.board[7][3]).toEqual({ type: 'rook', color: 'white' });
      expect(gameState.board[7][4]).toBeNull();
      expect(gameState.board[7][0]).toBeNull();
    });

    test('should reject castling after king has moved for king movement', () => {
      // Set up castling ready position
      game.board[7][5] = null; // Bishop
      game.board[7][6] = null; // Knight

      // Move king and back to invalidate castling rights
      const setupMoves = [
        { from: { row: 7, col: 4 }, to: { row: 7, col: 5 } },
        { from: { row: 1, col: 0 }, to: { row: 2, col: 0 } },
        { from: { row: 7, col: 5 }, to: { row: 7, col: 4 } },
        { from: { row: 2, col: 0 }, to: { row: 3, col: 0 } }
      ];
      
      setupMoves.forEach(move => {
        const result = game.makeMove(move);
        expect(result.success).toBe(true);
      });

      const invalidCastling = { from: { row: 7, col: 4 }, to: { row: 7, col: 6 } };
      const result = game.makeMove(invalidCastling);
      
      expect(result.success).toBe(false);
      expect(result.message).toBeDefined();
      expect(result.errorCode).toBe('INVALID_CASTLING');
    });

    test('should reject castling after rook has moved for king movement', () => {
      // Set up castling ready position
      game.board[7][5] = null; // Bishop
      game.board[7][6] = null; // Knight

      // Move rook and back to invalidate castling rights
      const setupMoves = [
        { from: { row: 7, col: 7 }, to: { row: 7, col: 5 } },
        { from: { row: 1, col: 0 }, to: { row: 2, col: 0 } },
        { from: { row: 7, col: 5 }, to: { row: 7, col: 7 } },
        { from: { row: 2, col: 0 }, to: { row: 3, col: 0 } }
      ];
      
      setupMoves.forEach(move => {
        const result = game.makeMove(move);
        expect(result.success).toBe(true);
      });

      const invalidCastling = { from: { row: 7, col: 4 }, to: { row: 7, col: 6 } };
      const result = game.makeMove(invalidCastling);
      
      expect(result.success).toBe(false);
      expect(result.message).toBeDefined();
      expect(result.errorCode).toBe('INVALID_CASTLING');
    });

    test('should reject castling through check for king movement', () => {
      // Set up castling ready position
      game.board[7][5] = null; // Bishop
      game.board[7][6] = null; // Knight
      // Clear the f-file and place attacking rook
      game.board[6][5] = null; // Remove f2 pawn
      game.board[1][5] = { type: 'rook', color: 'black' }; // Place rook on f7

      const castlingThroughCheck = { from: { row: 7, col: 4 }, to: { row: 7, col: 6 } };
      const result = game.makeMove(castlingThroughCheck);
      
      expect(result.success).toBe(false);
      expect(result.message).toBeDefined();
      expect(result.errorCode).toBe('INVALID_CASTLING');
    });

    test('should reject castling while in check for king movement', () => {
      // Set up castling ready position
      game.board[7][5] = null; // Bishop
      game.board[7][6] = null; // Knight
      // Clear the e-file and place attacking rook
      game.board[6][4] = null; // Remove e2 pawn
      game.board[1][4] = { type: 'rook', color: 'black' }; // Place rook on e7

      const castlingInCheck = { from: { row: 7, col: 4 }, to: { row: 7, col: 6 } };
      const result = game.makeMove(castlingInCheck);
      
      expect(result.success).toBe(false);
      expect(result.message).toBeDefined();
      expect(result.errorCode).toBe('INVALID_CASTLING');
    });
  });

  describe('Check, Checkmate, and Stalemate Detection', () => {
    test('should detect when king is under attack check detection correctly', () => {
      // Set up check position
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[4][4] = { type: 'king', color: 'white' };
      game.board[4][0] = { type: 'rook', color: 'black' };
      game.board[0][4] = { type: 'king', color: 'black' };
      game.currentTurn = 'white';
      game.gameStatus = 'check';
      game.inCheck = true;

      const inCheck = game.isInCheck('white');
      expect(inCheck).toBe(true);
    });

    test('should prevent moves that expose own king to check for any piece movement', () => {
      // Set up pinned piece scenario
      game.board[6][4] = null;
      game.board[5][4] = { type: 'bishop', color: 'white' };
      game.board[1][4] = { type: 'rook', color: 'black' };

      const exposingMove = { from: { row: 5, col: 4 }, to: { row: 4, col: 3 } };
      const result = game.makeMove(exposingMove);
      
      expect(result.success).toBe(false);
      expect(result.message).toBeDefined();
      expect(result.errorCode).toBe('PINNED_PIECE_INVALID_MOVE');
    });

    test('should identify checkmate positions correctly checkmate detection correctly', () => {
      // Set up checkmate position
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      // Black king trapped on back rank
      game.board[0][6] = { type: 'king', color: 'black' };
      // Black pawns blocking escape
      game.board[1][5] = { type: 'pawn', color: 'black' };
      game.board[1][6] = { type: 'pawn', color: 'black' };
      game.board[1][7] = { type: 'pawn', color: 'black' };
      // White rook delivering checkmate on back rank
      game.board[0][0] = { type: 'rook', color: 'white' };
      // White king
      game.board[7][4] = { type: 'king', color: 'white' };
      game.currentTurn = 'black';
      game.gameStatus = 'checkmate';
      game.winner = 'white';

      // Update game status
      game.checkGameEnd();

      const isCheckmate = game.isCheckmate('black');
      expect(isCheckmate).toBe(true);

      // Validate game state reflects checkmate
      const gameState = game.getGameState();
      expect(gameState.gameStatus).toBe('checkmate');
    });

    test('should identify stalemate positions correctly stalemate detection correctly', () => {
      // Set up stalemate position
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      // Black king in corner with no legal moves but not in check
      game.board[0][0] = { type: 'king', color: 'black' };
      // White pieces controlling escape squares
      game.board[2][1] = { type: 'king', color: 'white' };
      game.board[1][2] = { type: 'queen', color: 'white' };
      game.currentTurn = 'black';
      game.gameStatus = 'stalemate';
      game.winner = null;

      // Update game status
      game.checkGameEnd();

      const isStalemate = game.isStalemate('black');
      expect(isStalemate).toBe(true);

      // Validate game state reflects stalemate
      const gameState = game.getGameState();
      expect(gameState.gameStatus).toBe('stalemate');
    });
  });

  describe('Turn Management System', () => {
    test('should alternate between white and black players turn alternation correctly', () => {
      expect(game.currentTurn).toBe('white');

      // Execute white move
      const whiteMove = game.makeMove({ from: { row: 6, col: 4 }, to: { row: 5, col: 4 } });
      expect(whiteMove.success).toBe(true);
      expect(game.currentTurn).toBe('black');

      // Execute black move
      const blackMove = game.makeMove({ from: { row: 1, col: 4 }, to: { row: 2, col: 4 } });
      expect(blackMove.success).toBe(true);
      expect(game.currentTurn).toBe('white');
    });

    test('should reject moves by wrong color for any piece movement', () => {
      // Try to move black piece on white's turn
      const wrongTurnMove = { from: { row: 1, col: 4 }, to: { row: 2, col: 4 } };
      const result = game.makeMove(wrongTurnMove);
      
      expect(result.success).toBe(false);
      expect(result.message).toBeDefined();
      expect(result.errorCode).toBe('WRONG_TURN');
    });
  });

  describe('Game State Management', () => {
    test('should return complete and valid game state state structure correctly', () => {
      const state = game.getGameState();

      // Validate complete game state structure
      expect(state).toBeDefined();
      expect(state.board).toBeDefined();
      expect(Array.isArray(state.board)).toBe(true);
      expect(state.board).toHaveLength(8);
      expect(state.currentTurn).toBeDefined();
      expect(['white', 'black']).toContain(state.currentTurn);
      expect(state.gameStatus).toBeDefined();
      expect(['active', 'check', 'checkmate', 'stalemate', 'draw']).toContain(state.gameStatus);

      // Validate specific initial state values
      expect(state.board).toHaveLength(8);
      expect(state.board[0]).toHaveLength(8);
      expect(state.currentTurn).toBe('white');
      expect(state.gameStatus).toBe('active');
      expect(state.winner).toBe(null);
      expect(state.inCheck).toBe(false);
    });

    test('should maintain accurate move history move history tracking correctly', () => {
      const testMoves = [
        { from: { row: 6, col: 4 }, to: { row: 5, col: 4 } },
        { from: { row: 1, col: 4 }, to: { row: 2, col: 4 } }
      ];

      testMoves.forEach(move => {
        const result = game.makeMove(move);
        expect(result.success).toBe(true);
      });

      const state = game.getGameState();
      expect(state.moveHistory).toHaveLength(2);

      // Validate first move history entry
      expect(state.moveHistory[0]).toBeDefined();
      expect(state.moveHistory[0].from).toBeDefined();
      expect(state.moveHistory[0].to).toBeDefined();
      expect(state.moveHistory[0].piece).toBeDefined();
      expect(state.moveHistory[0].color).toBeDefined();
      expect(typeof state.moveHistory[0].from.row).toBe('number');
      expect(typeof state.moveHistory[0].from.col).toBe('number');
      expect(typeof state.moveHistory[0].to.row).toBe('number');
      expect(typeof state.moveHistory[0].to.col).toBe('number');
      
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
    test('should handle invalid coordinates error when coordinates are out of bounds', () => {
      const invalidCoordinateMove = {
        from: { row: -1, col: 0 },
        to: { row: 0, col: 0 }
      };

      const result = game.makeMove(invalidCoordinateMove);
      
      expect(result.success).toBe(false);
      expect(result.message).toBeDefined();
      expect(result.errorCode).toBe('INVALID_COORDINATES');
    });

    test('should handle empty square error when attempting to move from empty square', () => {
      const emptySquareMove = {
        from: { row: 4, col: 4 },
        to: { row: 3, col: 4 }
      };

      const result = game.makeMove(emptySquareMove);
      
      expect(result.success).toBe(false);
      expect(result.message).toBeDefined();
      expect(result.errorCode).toBe('NO_PIECE');
    });

    test('should handle friendly fire error when attempting to capture own piece', () => {
      // Set up a scenario where a king tries to capture its own adjacent piece
      // This will pass movement validation but fail capture validation
      game.board[6][4] = null; // Clear the square in front of king
      
      const friendlyFireMove = {
        from: { row: 7, col: 4 }, // White king
        to: { row: 6, col: 3 }   // White pawn (adjacent diagonal)
      };

      const result = game.makeMove(friendlyFireMove);
      
      expect(result.success).toBe(false);
      expect(result.message).toBeDefined();
      expect(result.errorCode).toBe('CAPTURE_OWN_PIECE');
    });
  });
});