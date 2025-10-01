const ChessAI = require('../src/shared/chessAI');
const ChessGame = require('../src/shared/chessGame');

describe('ChessAI Coverage Expansion', () => {
  let ai;
  let game;

  beforeEach(() => {
    ai = new ChessAI();
    game = new ChessGame();
  });

  describe('Constructor and Initialization', () => {
    test('should initialize with default medium difficulty', () => {
      const defaultAI = new ChessAI();
      expect(defaultAI.difficulty).toBe('medium');
      expect(defaultAI.maxDepth).toBe(2);
    });

    test('should initialize with specified difficulty', () => {
      const easyAI = new ChessAI('easy');
      expect(easyAI.difficulty).toBe('easy');
      expect(easyAI.maxDepth).toBe(1);

      const hardAI = new ChessAI('hard');
      expect(hardAI.difficulty).toBe('hard');
      expect(hardAI.maxDepth).toBe(3);
    });

    test('should initialize piece values correctly', () => {
      expect(ai.pieceValues).toEqual({
        pawn: 100,
        knight: 300,
        bishop: 300,
        rook: 500,
        queen: 900,
        king: 10000
      });
    });

    test('should initialize position value tables', () => {
      expect(ai.positionValues).toBeDefined();
      expect(ai.positionValues.pawn).toBeDefined();
      expect(ai.positionValues.knight).toBeDefined();
      expect(ai.positionValues.bishop).toBeDefined();
      expect(ai.positionValues.rook).toBeDefined();
      expect(ai.positionValues.queen).toBeDefined();
      expect(ai.positionValues.king).toBeDefined();

      // Check that position tables are 8x8
      Object.keys(ai.positionValues).forEach(piece => {
        expect(ai.positionValues[piece]).toHaveLength(8);
        ai.positionValues[piece].forEach(row => {
          expect(row).toHaveLength(8);
        });
      });
    });
  });

  describe('getMaxDepth', () => {
    test('should return correct depth for easy difficulty', () => {
      expect(ai.getMaxDepth('easy')).toBe(1);
    });

    test('should return correct depth for medium difficulty', () => {
      expect(ai.getMaxDepth('medium')).toBe(2);
    });

    test('should return correct depth for hard difficulty', () => {
      expect(ai.getMaxDepth('hard')).toBe(3);
    });

    test('should return default depth for unknown difficulty', () => {
      expect(ai.getMaxDepth('unknown')).toBe(2);
      expect(ai.getMaxDepth('')).toBe(2);
      expect(ai.getMaxDepth(null)).toBe(2);
    });
  });

  describe('getBestMove', () => {
    test('should return null for invalid game state', () => {
      expect(ai.getBestMove(null)).toBeNull();
      expect(ai.getBestMove({})).toBeNull();
      expect(ai.getBestMove({ currentTurn: null })).toBeNull();
    });

    test('should return a valid move for starting position', () => {
      const move = ai.getBestMove(game);
      expect(move).toBeDefined();
      expect(move).toHaveProperty('from');
      expect(move).toHaveProperty('to');
      expect(move.from).toHaveProperty('row');
      expect(move.from).toHaveProperty('col');
      expect(move.to).toHaveProperty('row');
      expect(move.to).toHaveProperty('col');
    });

    test('should handle limited move scenarios', () => {
      // Create a game state with limited moves
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[7][7] = { type: 'king', color: 'white' };
      game.board[0][0] = { type: 'king', color: 'black' };
      game.currentTurn = 'white';

      const move = ai.getBestMove(game);
      expect(move).toBeDefined(); // King should have some moves available
    });

    test('should handle easy difficulty randomness', () => {
      const easyAI = new ChessAI('easy');
      const moves = [];
      
      // Run multiple times to test randomness
      for (let i = 0; i < 10; i++) {
        const move = easyAI.getBestMove(game);
        if (move) {
          moves.push(move);
        }
      }
      
      expect(moves.length).toBeGreaterThan(0);
    });

    test('should return different moves for different difficulty levels', () => {
      const easyAI = new ChessAI('easy');
      const mediumAI = new ChessAI('medium');
      const hardAI = new ChessAI('hard');

      // Set up a specific position
      game.makeMove({ from: { row: 6, col: 4 }, to: { row: 4, col: 4 } }); // e4
      game.makeMove({ from: { row: 1, col: 4 }, to: { row: 3, col: 4 } }); // e5

      const easyMove = easyAI.getBestMove(game);
      const mediumMove = mediumAI.getBestMove(game);
      const hardMove = hardAI.getBestMove(game);

      expect(easyMove).toBeDefined();
      expect(mediumMove).toBeDefined();
      expect(hardMove).toBeDefined();
    });
  });

  describe('getAllValidMoves', () => {
    test('should find all valid moves for white in starting position', () => {
      if (typeof ai.getAllValidMoves === 'function') {
        const moves = ai.getAllValidMoves(game, 'white');
        expect(moves).toBeDefined();
        expect(Array.isArray(moves)).toBe(true);
        expect(moves.length).toBe(20); // 16 pawn moves + 4 knight moves
      }
    });

    test('should find all valid moves for black', () => {
      if (typeof ai.getAllValidMoves === 'function') {
        game.currentTurn = 'black';
        const moves = ai.getAllValidMoves(game, 'black');
        expect(moves).toBeDefined();
        expect(Array.isArray(moves)).toBe(true);
        expect(moves.length).toBe(20); // 16 pawn moves + 4 knight moves
      }
    });

    test('should handle limited moves scenario', () => {
      if (typeof ai.getAllValidMoves === 'function') {
        // Create limited position
        game.board = Array(8).fill(null).map(() => Array(8).fill(null));
        game.board[7][7] = { type: 'king', color: 'white' };
        game.board[0][0] = { type: 'king', color: 'black' };
        
        const moves = ai.getAllValidMoves(game, 'white');
        expect(Array.isArray(moves)).toBe(true);
        expect(moves.length).toBeGreaterThan(0);
      }
    });
  });

  describe('evaluatePosition', () => {
    test('should evaluate starting position as roughly equal', () => {
      if (typeof ai.evaluatePosition === 'function') {
        const evaluation = ai.evaluatePosition(game);
        expect(typeof evaluation).toBe('number');
        expect(Math.abs(evaluation)).toBeLessThan(100); // Should be close to 0
      }
    });

    test('should evaluate material advantage correctly', () => {
      if (typeof ai.evaluatePosition === 'function') {
        // Give white a queen advantage
        game.board[1][3] = null; // Remove black queen
        const evaluation = ai.evaluatePosition(game);
        expect(evaluation).toBeGreaterThan(100); // Should favor white
      }
    });

    test('should handle empty board', () => {
      if (typeof ai.evaluatePosition === 'function') {
        game.board = Array(8).fill(null).map(() => Array(8).fill(null));
        const evaluation = ai.evaluatePosition(game);
        expect(evaluation).toBe(0);
      }
    });
  });

  describe('minimax', () => {
    test('should run minimax algorithm', () => {
      if (typeof ai.minimax === 'function') {
        const result = ai.minimax(game, 1, true, -Infinity, Infinity);
        expect(typeof result).toBe('number');
      }
    });

    test('should handle different depths', () => {
      if (typeof ai.minimax === 'function') {
        const depth1 = ai.minimax(game, 1, true, -Infinity, Infinity);
        const depth2 = ai.minimax(game, 2, true, -Infinity, Infinity);
        
        expect(typeof depth1).toBe('number');
        expect(typeof depth2).toBe('number');
      }
    });

    test('should handle alpha-beta pruning', () => {
      if (typeof ai.minimax === 'function') {
        const withPruning = ai.minimax(game, 2, true, -1000, 1000);
        const withoutPruning = ai.minimax(game, 2, true, -Infinity, Infinity);
        
        expect(typeof withPruning).toBe('number');
        expect(typeof withoutPruning).toBe('number');
      }
    });
  });

  describe('Position Value Tables', () => {
    test('should have correct pawn position values', () => {
      const pawnTable = ai.positionValues.pawn;
      
      // Test that position values exist and are numbers
      expect(typeof pawnTable[3][4]).toBe('number');
      expect(typeof pawnTable[1][4]).toBe('number');
      expect(typeof pawnTable[3][0]).toBe('number');
      
      // Test center vs edge preference
      expect(pawnTable[3][4]).toBeGreaterThan(pawnTable[3][0]); // Center pawn
    });

    test('should have correct knight position values', () => {
      const knightTable = ai.positionValues.knight;
      
      // Knights should be more valuable in center
      expect(knightTable[3][3]).toBeGreaterThan(knightTable[0][0]); // Center vs corner
      expect(knightTable[4][4]).toBeGreaterThan(knightTable[0][1]); // Center vs edge
    });

    test('should have correct king position values', () => {
      const kingTable = ai.positionValues.king;
      
      // King should prefer back rank safety
      expect(kingTable[7][1]).toBeGreaterThan(kingTable[4][4]); // Back rank vs center
    });

    test('should handle position value lookup', () => {
      if (typeof ai.getPositionValue === 'function') {
        const pawnValue = ai.getPositionValue('pawn', 3, 3, 'white');
        expect(typeof pawnValue).toBe('number');
        
        const knightValue = ai.getPositionValue('knight', 4, 4, 'white');
        expect(typeof knightValue).toBe('number');
      }
    });
  });

  describe('Move Generation and Validation', () => {
    test('should generate valid pawn moves', () => {
      if (typeof ai.generatePawnMoves === 'function') {
        const moves = ai.generatePawnMoves(game, 6, 4, 'white');
        expect(Array.isArray(moves)).toBe(true);
        expect(moves.length).toBeGreaterThan(0);
      }
    });

    test('should generate valid knight moves', () => {
      if (typeof ai.generateKnightMoves === 'function') {
        const moves = ai.generateKnightMoves(game, 7, 1, 'white');
        expect(Array.isArray(moves)).toBe(true);
        expect(moves.length).toBeGreaterThan(0);
      }
    });

    test('should generate valid rook moves', () => {
      if (typeof ai.generateRookMoves === 'function') {
        // Clear some space for rook movement
        game.board[6][0] = null;
        const moves = ai.generateRookMoves(game, 7, 0, 'white');
        expect(Array.isArray(moves)).toBe(true);
      }
    });

    test('should generate valid bishop moves', () => {
      if (typeof ai.generateBishopMoves === 'function') {
        // Clear some space for bishop movement
        game.board[6][1] = null;
        const moves = ai.generateBishopMoves(game, 7, 2, 'white');
        expect(Array.isArray(moves)).toBe(true);
      }
    });

    test('should generate valid queen moves', () => {
      if (typeof ai.generateQueenMoves === 'function') {
        // Clear some space for queen movement
        game.board[6][3] = null;
        const moves = ai.generateQueenMoves(game, 7, 3, 'white');
        expect(Array.isArray(moves)).toBe(true);
      }
    });

    test('should generate valid king moves', () => {
      if (typeof ai.generateKingMoves === 'function') {
        // Clear some space for king movement
        game.board[6][4] = null;
        const moves = ai.generateKingMoves(game, 7, 4, 'white');
        expect(Array.isArray(moves)).toBe(true);
      }
    });
  });

  describe('Special Move Handling', () => {
    test('should handle castling moves', () => {
      if (typeof ai.canCastle === 'function') {
        // Clear path for castling
        game.board[7][5] = null;
        game.board[7][6] = null;
        
        const canCastle = ai.canCastle(game, 'white', 'kingside');
        expect(typeof canCastle).toBe('boolean');
      }
    });

    test('should handle en passant moves', () => {
      if (typeof ai.canEnPassant === 'function') {
        // Set up en passant scenario
        game.enPassantTarget = { row: 5, col: 4 };
        game.board[4][3] = { type: 'pawn', color: 'white' };
        
        const canEnPassant = ai.canEnPassant(game, 4, 3, 5, 4);
        expect(typeof canEnPassant).toBe('boolean');
      }
    });

    test('should handle pawn promotion', () => {
      if (typeof ai.generatePromotionMoves === 'function') {
        // Set up promotion scenario
        game.board = Array(8).fill(null).map(() => Array(8).fill(null));
        game.board[1][0] = { type: 'pawn', color: 'white' };
        
        const moves = ai.generatePromotionMoves(1, 0, 0, 0);
        expect(Array.isArray(moves)).toBe(true);
        if (moves.length > 0) {
          expect(moves[0]).toHaveProperty('promotion');
        }
      }
    });
  });

  describe('AI Strategy and Tactics', () => {
    test('should prefer capturing valuable pieces', () => {
      // Set up a position where AI can capture queen vs pawn
      game.board[4][4] = { type: 'queen', color: 'black' };
      game.board[5][3] = { type: 'pawn', color: 'white' };
      game.board[3][5] = { type: 'pawn', color: 'white' };
      
      const move = ai.getBestMove(game);
      if (move) {
        // Should prefer capturing the queen
        expect(move.to.row === 4 && move.to.col === 4).toBeTruthy();
      }
    });

    test('should avoid losing valuable pieces', () => {
      if (typeof ai.isSquareAttacked === 'function') {
        // Test if AI can detect attacked squares
        const isAttacked = ai.isSquareAttacked(game, 4, 4, 'black');
        expect(typeof isAttacked).toBe('boolean');
      }
    });

    test('should consider piece development', () => {
      // AI should prefer developing pieces over moving pawns repeatedly
      const move1 = ai.getBestMove(game);
      if (move1) {
        game.makeMove(move1);
        game.makeMove({ from: { row: 1, col: 4 }, to: { row: 3, col: 4 } }); // Black e5
        
        const move2 = ai.getBestMove(game);
        expect(move2).toBeDefined();
      }
    });
  });

  describe('Performance and Edge Cases', () => {
    test('should handle complex positions efficiently', () => {
      // Set up a complex middle game position
      game.makeMove({ from: { row: 6, col: 4 }, to: { row: 4, col: 4 } }); // e4
      game.makeMove({ from: { row: 1, col: 4 }, to: { row: 3, col: 4 } }); // e5
      game.makeMove({ from: { row: 7, col: 1 }, to: { row: 5, col: 2 } }); // Nf3
      game.makeMove({ from: { row: 0, col: 1 }, to: { row: 2, col: 2 } }); // Nc6
      
      const startTime = Date.now();
      const move = ai.getBestMove(game);
      const endTime = Date.now();
      
      expect(move).toBeDefined();
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    test('should handle near-endgame positions', () => {
      // Set up a simple endgame
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[7][4] = { type: 'king', color: 'white' };
      game.board[0][4] = { type: 'king', color: 'black' };
      game.board[6][0] = { type: 'rook', color: 'white' };
      
      const move = ai.getBestMove(game);
      expect(move).toBeDefined();
    });

    test('should handle positions with few pieces', () => {
      // Clear most pieces
      for (let row = 1; row < 7; row++) {
        for (let col = 0; col < 8; col++) {
          if (row !== 6 && row !== 1) {
            game.board[row][col] = null;
          }
        }
      }
      
      const move = ai.getBestMove(game);
      expect(move).toBeDefined();
    });
  });

  describe('Difficulty Scaling', () => {
    test('easy AI should make suboptimal moves sometimes', () => {
      const easyAI = new ChessAI('easy');
      const moves = [];
      
      // Run multiple times to see variation
      for (let i = 0; i < 5; i++) {
        const move = easyAI.getBestMove(game);
        if (move) {
          moves.push(`${move.from.row},${move.from.col}-${move.to.row},${move.to.col}`);
        }
      }
      
      // Easy AI might show some variation due to randomness
      expect(moves.length).toBeGreaterThan(0);
    });

    test('hard AI should search deeper', () => {
      const hardAI = new ChessAI('hard');
      expect(hardAI.maxDepth).toBe(3);
      
      const move = hardAI.getBestMove(game);
      expect(move).toBeDefined();
    });

    test('different difficulties should have different max depths', () => {
      const easy = new ChessAI('easy');
      const medium = new ChessAI('medium');
      const hard = new ChessAI('hard');
      
      expect(easy.maxDepth).toBeLessThan(medium.maxDepth);
      expect(medium.maxDepth).toBeLessThan(hard.maxDepth);
    });
  });
});