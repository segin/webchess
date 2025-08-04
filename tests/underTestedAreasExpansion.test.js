const ChessGame = require('../src/shared/chessGame');
const GameStateManager = require('../src/shared/gameState');
const ChessErrorHandler = require('../src/shared/errorHandler');

describe('Under-Tested Areas - Comprehensive Coverage Expansion', () => {
  let game;
  let stateManager;
  let errorHandler;

  beforeEach(() => {
    game = new ChessGame();
    stateManager = new GameStateManager();
    errorHandler = new ChessErrorHandler();
  });

  describe('Advanced Move Validation Functions', () => {
    test('should test extractPromotionFromMove function', () => {
      // Set up a pawn ready for promotion
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[1][4] = { type: 'pawn', color: 'white' };
      
      const from = { row: 1, col: 4 };
      const to = { row: 0, col: 4 };
      const piece = game.board[1][4];
      
      const promotion = game.extractPromotionFromMove(from, to, piece);
      expect(promotion).toBe('queen'); // Default promotion
    });

    test('should test getCheckResolutionType function', () => {
      // Set up a check scenario
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[7][4] = { type: 'king', color: 'white' };
      game.board[0][4] = { type: 'rook', color: 'black' };
      
      const from = { row: 6, col: 4 };
      const to = { row: 5, col: 4 };
      const piece = { type: 'pawn', color: 'white' };
      const attacker = { position: { row: 0, col: 4 } };
      
      const resolutionType = game.getCheckResolutionType(from, to, piece, attacker);
      expect(typeof resolutionType).toBe('string');
    });

    test('should test isBlockingSquare function', () => {
      const blockSquare = { row: 3, col: 4 };
      const attackerPos = { row: 0, col: 4 };
      const kingPos = { row: 7, col: 4 };
      
      const isBlocking = game.isBlockingSquare(blockSquare, attackerPos, kingPos);
      expect(typeof isBlocking).toBe('boolean');
    });

    test('should test validateCheckResolution function', () => {
      // Set up a check scenario
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[7][4] = { type: 'king', color: 'white' };
      game.board[0][4] = { type: 'rook', color: 'black' };
      game.checkDetails = {
        kingPosition: { row: 7, col: 4 },
        attackingPieces: [{ piece: { type: 'rook', color: 'black' }, position: { row: 0, col: 4 } }]
      };
      
      const from = { row: 6, col: 4 };
      const to = { row: 5, col: 4 };
      const piece = { type: 'pawn', color: 'white' };
      
      const result = game.validateCheckResolution(from, to, piece);
      expect(result).toHaveProperty('success');
    });
  });

  describe('Stalemate Analysis Functions', () => {
    test('should test analyzeStalematePosition function', () => {
      // Set up a potential stalemate position
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[7][7] = { type: 'king', color: 'white' };
      game.board[6][6] = { type: 'king', color: 'black' };
      game.currentTurn = 'white';
      
      const analysis = game.analyzeStalematePosition('white');
      expect(analysis).toHaveProperty('isStalemate');
      expect(analysis).toHaveProperty('analysis');
    });

    test('should test identifyStalematePattern function', () => {
      // Set up a corner stalemate pattern
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[0][0] = { type: 'king', color: 'white' };
      game.board[1][1] = { type: 'king', color: 'black' };
      game.currentTurn = 'white';
      
      const pattern = game.identifyStalematePattern('white');
      expect(pattern).toHaveProperty('isClassicPattern');
      expect(pattern).toHaveProperty('pattern');
    });

    test('should test isKingInCorner function', () => {
      const cornerPositions = [
        { row: 0, col: 0 },
        { row: 0, col: 7 },
        { row: 7, col: 0 },
        { row: 7, col: 7 }
      ];
      
      cornerPositions.forEach(pos => {
        expect(game.isKingInCorner(pos)).toBe(true);
      });
      
      expect(game.isKingInCorner({ row: 3, col: 3 })).toBe(false);
      expect(game.isKingInCorner(null)).toBe(false);
    });

    test('should test isKingOnEdge function', () => {
      const edgePositions = [
        { row: 0, col: 3 },
        { row: 7, col: 3 },
        { row: 3, col: 0 },
        { row: 3, col: 7 }
      ];
      
      edgePositions.forEach(pos => {
        expect(game.isKingOnEdge(pos)).toBe(true);
      });
      
      expect(game.isKingOnEdge({ row: 3, col: 3 })).toBe(false);
      expect(game.isKingOnEdge(null)).toBe(false);
    });

    test('should test isPawnStalematePattern function', () => {
      // Set up a pawn stalemate pattern
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[3][3] = { type: 'king', color: 'white' };
      game.board[2][2] = { type: 'pawn', color: 'black' };
      game.board[2][4] = { type: 'pawn', color: 'black' };
      game.board[4][2] = { type: 'pawn', color: 'black' };
      
      const isPawnPattern = game.isPawnStalematePattern('white');
      expect(typeof isPawnPattern).toBe('boolean');
    });

    test('should test declareStalemateDraw function', () => {
      // Set up a stalemate position
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[0][0] = { type: 'king', color: 'white' };
      game.board[1][1] = { type: 'king', color: 'black' };
      game.currentTurn = 'white';
      
      const result = game.declareStalemateDraw('white');
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('message');
    });
  });

  describe('Advanced Check Detection Functions', () => {
    test('should test getAttackDetails function', () => {
      // Set up an attack scenario
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[7][4] = { type: 'king', color: 'white' };
      game.board[0][4] = { type: 'rook', color: 'black' };
      
      const attackDetails = game.getAttackDetails(7, 4, 'white');
      expect(attackDetails).toHaveProperty('isUnderAttack');
      expect(attackDetails).toHaveProperty('attackingPieces');
      expect(attackDetails).toHaveProperty('attackingSquares');
      expect(attackDetails).toHaveProperty('attackCount');
    });

    test('should test categorizeCheck function', () => {
      const singleAttack = [{ piece: { type: 'rook', color: 'black' } }];
      const doubleAttack = [
        { piece: { type: 'rook', color: 'black' } },
        { piece: { type: 'bishop', color: 'black' } }
      ];
      
      expect(game.categorizeCheck([])).toBe('none');
      expect(game.categorizeCheck(singleAttack)).toBe('rook_check');
      expect(game.categorizeCheck(doubleAttack)).toBe('double_check');
    });

    test('should test getAttackType function', () => {
      const piece = { type: 'rook', color: 'black' };
      const from = { row: 0, col: 4 };
      const to = { row: 7, col: 4 };
      
      const attackType = game.getAttackType(piece, from, to);
      expect(attackType).toBe('vertical_attack');
      
      const horizontalAttack = game.getAttackType(piece, { row: 0, col: 0 }, { row: 0, col: 7 });
      expect(horizontalAttack).toBe('horizontal_attack');
    });

    test('should test canPieceAttackSquare function', () => {
      const from = { row: 0, col: 0 };
      const to = { row: 0, col: 7 };
      const piece = { type: 'rook', color: 'black' };
      
      // Clear the path
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[0][0] = piece;
      
      const canAttack = game.canPieceAttackSquare(from, to, piece);
      expect(canAttack).toBe(true);
    });

    test('should test canPawnAttackSquare function', () => {
      const from = { row: 1, col: 4 };
      const to = { row: 2, col: 5 };
      const piece = { type: 'pawn', color: 'black' };
      
      const canAttack = game.canPawnAttackSquare(from, to, piece);
      expect(canAttack).toBe(true);
      
      // Test invalid pawn attack
      const invalidAttack = game.canPawnAttackSquare(from, { row: 2, col: 4 }, piece);
      expect(invalidAttack).toBe(false);
    });

    test('should test canKingAttackSquare function', () => {
      const from = { row: 4, col: 4 };
      const to = { row: 4, col: 5 };
      
      const canAttack = game.canKingAttackSquare(from, to);
      expect(canAttack).toBe(true);
      
      // Test invalid king attack (too far)
      const invalidAttack = game.canKingAttackSquare(from, { row: 4, col: 6 });
      expect(invalidAttack).toBe(false);
    });
  });

  describe('Pin Detection Functions', () => {
    test('should test isPiecePinned function', () => {
      // Set up a pin scenario
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[7][4] = { type: 'king', color: 'white' };
      game.board[5][4] = { type: 'bishop', color: 'white' };
      game.board[0][4] = { type: 'rook', color: 'black' };
      
      const pinInfo = game.isPiecePinned({ row: 5, col: 4 }, 'white');
      expect(pinInfo).toHaveProperty('isPinned');
      expect(pinInfo).toHaveProperty('pinDirection');
      expect(pinInfo).toHaveProperty('pinningPiece');
    });

    test('should test canPiecePin function', () => {
      expect(game.canPiecePin({ type: 'rook' }, 'horizontal')).toBe(true);
      expect(game.canPiecePin({ type: 'rook' }, 'vertical')).toBe(true);
      expect(game.canPiecePin({ type: 'rook' }, 'diagonal')).toBe(false);
      
      expect(game.canPiecePin({ type: 'bishop' }, 'diagonal')).toBe(true);
      expect(game.canPiecePin({ type: 'bishop' }, 'horizontal')).toBe(false);
      
      expect(game.canPiecePin({ type: 'queen' }, 'horizontal')).toBe(true);
      expect(game.canPiecePin({ type: 'queen' }, 'diagonal')).toBe(true);
      
      expect(game.canPiecePin({ type: 'knight' }, 'horizontal')).toBe(false);
    });

    test('should test isPathClearForPin function', () => {
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      
      const kingPos = { row: 7, col: 4 };
      const pinningPos = { row: 0, col: 4 };
      const excludePos = { row: 3, col: 4 };
      
      const isClear = game.isPathClearForPin(kingPos, pinningPos, excludePos);
      expect(typeof isClear).toBe('boolean');
    });

    test('should test isPinnedPieceMoveValid function', () => {
      const from = { row: 3, col: 4 };
      const to = { row: 2, col: 4 };
      const pinInfo = {
        isPinned: true,
        pinDirection: 'vertical',
        pinningPiece: { position: { row: 0, col: 4 } }
      };
      
      game.board[7][4] = { type: 'king', color: 'white' };
      game.board[3][4] = { type: 'bishop', color: 'white' }; // Add the piece being tested
      
      const isValid = game.isPinnedPieceMoveValid(from, to, pinInfo);
      expect(typeof isValid).toBe('boolean');
    });
  });

  describe('Utility and Helper Functions', () => {
    test('should test getMoveNotation function', () => {
      const from = { row: 6, col: 4 };
      const to = { row: 4, col: 4 };
      const piece = { type: 'pawn', color: 'white' };
      
      const notation = game.getMoveNotation(from, to, piece);
      expect(typeof notation).toBe('string');
      expect(notation).toContain('e2-e4');
    });

    test('should test getBoardState function', () => {
      const boardState = game.getBoardState();
      expect(boardState).toHaveProperty('board');
      expect(boardState).toHaveProperty('currentTurn');
      expect(boardState).toHaveProperty('gameStatus');
      expect(boardState).toHaveProperty('winner');
      expect(boardState).toHaveProperty('moveHistory');
      expect(boardState).toHaveProperty('castlingRights');
      expect(boardState).toHaveProperty('enPassantTarget');
    });

    test('should test generatePossibleMoves function', () => {
      const from = { row: 6, col: 4 };
      const piece = { type: 'pawn', color: 'white' };
      
      const moves = game.generatePossibleMoves(from, piece);
      expect(Array.isArray(moves)).toBe(true);
    });

    test('should test generatePawnMoves function', () => {
      const from = { row: 6, col: 4 };
      const piece = { type: 'pawn', color: 'white' };
      
      const moves = game.generatePawnMoves(from, piece);
      expect(Array.isArray(moves)).toBe(true);
      expect(moves.length).toBeGreaterThan(0);
    });

    test('should test generateRookMoves function', () => {
      const from = { row: 4, col: 4 };
      
      const moves = game.generateRookMoves(from);
      expect(Array.isArray(moves)).toBe(true);
      expect(moves.length).toBeGreaterThan(0);
    });

    test('should test generateKnightMoves function', () => {
      const from = { row: 4, col: 4 };
      
      const moves = game.generateKnightMoves(from);
      expect(Array.isArray(moves)).toBe(true);
      expect(moves.length).toBeGreaterThan(0);
    });
  });

  describe('Castling Rights Management Functions', () => {
    test('should test updateCastlingRightsForCapturedRook function', () => {
      const captureSquare = { row: 0, col: 0 };
      const capturedRook = { type: 'rook', color: 'black' };
      
      game.updateCastlingRightsForCapturedRook(captureSquare, capturedRook);
      expect(game.castlingRights.black.queenside).toBe(false);
    });

    test('should test updateCastlingRightsForKingMove function', () => {
      game.updateCastlingRightsForKingMove('white');
      expect(game.castlingRights.white.kingside).toBe(false);
      expect(game.castlingRights.white.queenside).toBe(false);
    });

    test('should test updateCastlingRightsForRookMove function', () => {
      const from = { row: 7, col: 0 };
      const rook = { type: 'rook', color: 'white' };
      
      game.updateCastlingRightsForRookMove(from, rook);
      expect(game.castlingRights.white.queenside).toBe(false);
    });

    test('should test trackCastlingRightsChanges function', () => {
      const originalRights = { white: { kingside: true, queenside: true } };
      const newRights = { white: { kingside: false, queenside: true } };
      const moveInfo = { from: { row: 7, col: 4 }, to: { row: 7, col: 6 } };
      
      // This function primarily logs changes, so we just test it doesn't throw
      expect(() => {
        game.trackCastlingRightsChanges(originalRights, newRights, moveInfo);
      }).not.toThrow();
    });

    test('should test getCastlingRightsStatus function', () => {
      const status = game.getCastlingRightsStatus();
      expect(status).toHaveProperty('white');
      expect(status).toHaveProperty('black');
      expect(status.white).toHaveProperty('kingside');
      expect(status.white).toHaveProperty('queenside');
    });

    test('should test getGameStateForSnapshot function', () => {
      const snapshot = game.getGameStateForSnapshot();
      expect(snapshot).toHaveProperty('board');
      expect(snapshot).toHaveProperty('currentTurn');
      expect(snapshot).toHaveProperty('gameStatus');
      expect(snapshot).toHaveProperty('castlingRights');
    });

    test('should test serializeCastlingRights function', () => {
      const serialized = game.serializeCastlingRights();
      expect(serialized).toHaveProperty('white');
      expect(serialized).toHaveProperty('black');
      expect(serialized.white).toHaveProperty('kingside');
      expect(serialized.white).toHaveProperty('queenside');
    });
  });

  describe('Enhanced Move Validation Edge Cases', () => {
    test('should test isValidMoveSimple function', () => {
      const from = { row: 6, col: 4 };
      const to = { row: 4, col: 4 };
      const piece = { type: 'pawn', color: 'white' };
      
      const isValid = game.isValidMoveSimple(from, to, piece);
      expect(typeof isValid).toBe('boolean');
    });

    test('should test wouldBeInCheck with en passant', () => {
      // Set up en passant scenario
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[3][4] = { type: 'pawn', color: 'white' };
      game.board[3][5] = { type: 'pawn', color: 'black' };
      game.enPassantTarget = { row: 2, col: 5 };
      
      const from = { row: 3, col: 4 };
      const to = { row: 2, col: 5 };
      const piece = { type: 'pawn', color: 'white' };
      
      const wouldBeInCheck = game.wouldBeInCheck(from, to, 'white', piece);
      expect(typeof wouldBeInCheck).toBe('boolean');
    });

    test('should test wouldBeInCheck with castling', () => {
      // Set up castling scenario
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[7][4] = { type: 'king', color: 'white' };
      game.board[7][7] = { type: 'rook', color: 'white' };
      
      const from = { row: 7, col: 4 };
      const to = { row: 7, col: 6 };
      const piece = { type: 'king', color: 'white' };
      
      const wouldBeInCheck = game.wouldBeInCheck(from, to, 'white', piece);
      expect(typeof wouldBeInCheck).toBe('boolean');
    });

    test('should test wouldBeInCheck with promotion', () => {
      // Set up promotion scenario
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[1][4] = { type: 'pawn', color: 'white' };
      
      const from = { row: 1, col: 4 };
      const to = { row: 0, col: 4 };
      const piece = { type: 'pawn', color: 'white' };
      
      const wouldBeInCheck = game.wouldBeInCheck(from, to, 'white', piece, 'queen');
      expect(typeof wouldBeInCheck).toBe('boolean');
    });
  });

  describe('Game State Validation Functions', () => {
    test('should test isCheckmateGivenCheckStatus function', () => {
      // Set up a checkmate position
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[0][0] = { type: 'king', color: 'white' };
      game.board[1][1] = { type: 'king', color: 'black' };
      game.board[0][1] = { type: 'rook', color: 'black' };
      game.board[1][0] = { type: 'rook', color: 'black' };
      
      const isCheckmate = game.isCheckmateGivenCheckStatus('white', true);
      expect(typeof isCheckmate).toBe('boolean');
    });

    test('should test isStalemateGivenCheckStatus function', () => {
      // Set up a stalemate position
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[0][0] = { type: 'king', color: 'white' };
      game.board[1][1] = { type: 'king', color: 'black' };
      
      const isStalemate = game.isStalemateGivenCheckStatus('white', false);
      expect(typeof isStalemate).toBe('boolean');
    });

    test('should test getKingLegalMoves function', () => {
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[4][4] = { type: 'king', color: 'white' };
      
      const legalMoves = game.getKingLegalMoves('white');
      expect(Array.isArray(legalMoves)).toBe(true);
    });

    test('should test getPieceLegalMoves function', () => {
      const legalMoves = game.getPieceLegalMoves('white');
      expect(Array.isArray(legalMoves)).toBe(true);
    });
  });

  describe('Error Handler Integration', () => {
    test('should test error handler createError function', () => {
      const error = errorHandler.createError('TEST_ERROR', 'Test message', { detail: 'test' });
      expect(error.success).toBe(false);
      expect(error.message).toBe('Test message');
    });

    test('should test error handler createSuccess function', () => {
      const success = errorHandler.createSuccess('Test success', { data: 'test' }, { meta: 'test' });
      expect(success.success).toBe(true);
      expect(success.message).toBe('Test success');
      expect(success.data).toEqual({ data: 'test' });
    });
  });
});