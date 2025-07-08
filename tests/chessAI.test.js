const ChessAI = require('../src/shared/chessAI');
const ChessGame = require('../src/shared/chessGame');

describe('ChessAI', () => {
  let ai;
  let game;

  beforeEach(() => {
    ai = new ChessAI('medium');
    game = new ChessGame();
  });

  describe('AI Initialization', () => {
    test('should initialize with correct difficulty settings', () => {
      const easyAI = new ChessAI('easy');
      const mediumAI = new ChessAI('medium');
      const hardAI = new ChessAI('hard');

      expect(easyAI.difficulty).toBe('easy');
      expect(easyAI.maxDepth).toBe(2);
      expect(mediumAI.difficulty).toBe('medium');
      expect(mediumAI.maxDepth).toBe(3);
      expect(hardAI.difficulty).toBe('hard');
      expect(hardAI.maxDepth).toBe(4);
    });

    test('should have correct piece values', () => {
      expect(ai.pieceValues.pawn).toBe(100);
      expect(ai.pieceValues.knight).toBe(300);
      expect(ai.pieceValues.bishop).toBe(300);
      expect(ai.pieceValues.rook).toBe(500);
      expect(ai.pieceValues.queen).toBe(900);
      expect(ai.pieceValues.king).toBe(10000);
    });
  });

  describe('Move Generation', () => {
    test('should find valid moves for white in starting position', () => {
      const moves = ai.getAllValidMoves(game, 'white');
      expect(moves.length).toBe(20); // 16 pawn moves + 4 knight moves
    });

    test('should find valid moves for black in starting position', () => {
      const moves = ai.getAllValidMoves(game, 'black');
      expect(moves.length).toBe(20); // 16 pawn moves + 4 knight moves
    });

    test('should return best move', () => {
      const bestMove = ai.getBestMove(game);
      expect(bestMove).toBeTruthy();
      expect(bestMove.from).toBeDefined();
      expect(bestMove.to).toBeDefined();
      expect(bestMove.from.row).toBeGreaterThanOrEqual(0);
      expect(bestMove.from.row).toBeLessThan(8);
      expect(bestMove.from.col).toBeGreaterThanOrEqual(0);
      expect(bestMove.from.col).toBeLessThan(8);
    });

    test('should prefer capturing moves', () => {
      // Set up a position where black can capture a white pawn
      game.board[4][4] = { type: 'pawn', color: 'white' };
      game.board[5][3] = { type: 'pawn', color: 'black' };
      game.currentTurn = 'black';

      const bestMove = ai.getBestMove(game);
      
      // AI should consider capturing the white pawn
      const captureMoves = ai.getAllValidMoves(game, 'black').filter(move => 
        move.to.row === 4 && move.to.col === 4
      );
      
      expect(captureMoves.length).toBeGreaterThan(0);
    });
  });

  describe('Position Evaluation', () => {
    test('should evaluate starting position as roughly equal', () => {
      const score = ai.evaluatePosition(game);
      expect(Math.abs(score)).toBeLessThan(100); // Should be close to 0
    });

    test('should evaluate checkmate correctly', () => {
      // Set up a simple checkmate position
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[0][0] = { type: 'king', color: 'black' };
      game.board[1][1] = { type: 'queen', color: 'white' };
      game.board[2][0] = { type: 'rook', color: 'white' };
      game.gameStatus = 'checkmate';
      game.winner = 'white';

      const score = ai.evaluatePosition(game);
      expect(score).toBe(10000); // White wins
    });

    test('should evaluate stalemate as draw', () => {
      game.gameStatus = 'stalemate';
      game.winner = null;

      const score = ai.evaluatePosition(game);
      expect(score).toBe(0);
    });
  });

  describe('Difficulty Levels', () => {
    test('easy AI should make some random moves', () => {
      const easyAI = new ChessAI('easy');
      const moves = [];
      
      // Generate multiple moves to check for randomness
      for (let i = 0; i < 10; i++) {
        const move = easyAI.getBestMove(game);
        moves.push(`${move.from.row},${move.from.col}-${move.to.row},${move.to.col}`);
      }
      
      // Easy AI should have some variation in moves due to randomness
      const uniqueMoves = new Set(moves);
      expect(uniqueMoves.size).toBeGreaterThan(1);
    });

    test('different difficulty levels should have different max depths', () => {
      const easyAI = new ChessAI('easy');
      const mediumAI = new ChessAI('medium');
      const hardAI = new ChessAI('hard');

      expect(easyAI.maxDepth).toBeLessThan(mediumAI.maxDepth);
      expect(mediumAI.maxDepth).toBeLessThan(hardAI.maxDepth);
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty board gracefully', () => {
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      const moves = ai.getAllValidMoves(game, 'white');
      expect(moves).toEqual([]);
    });

    test('should handle game with only kings', () => {
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[0][0] = { type: 'king', color: 'black' };
      game.board[7][7] = { type: 'king', color: 'white' };

      const moves = ai.getAllValidMoves(game, 'white');
      expect(moves.length).toBeGreaterThan(0);
      
      const bestMove = ai.getBestMove(game);
      expect(bestMove).toBeTruthy();
    });

    test('should return null when no moves available', () => {
      // Create a position where current player has no legal moves
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[0][0] = { type: 'king', color: 'white' };
      
      // Surround white king with black pieces to block all moves
      game.board[0][1] = { type: 'rook', color: 'black' };
      game.board[1][0] = { type: 'rook', color: 'black' };
      game.board[1][1] = { type: 'rook', color: 'black' };
      
      game.currentTurn = 'white';
      
      const bestMove = ai.getBestMove(game);
      expect(bestMove).toBeNull();
    });
  });

  describe('Game Integration', () => {
    test('AI moves should be legal according to chess rules', () => {
      for (let i = 0; i < 10; i++) {
        const aiMove = ai.getBestMove(game);
        expect(aiMove).toBeTruthy();
        
        const result = game.makeMove(aiMove);
        expect(result.success).toBe(true);
        
        if (game.gameStatus !== 'active') break;
      }
    });

    test('should handle a complete game scenario', () => {
      let moveCount = 0;
      const maxMoves = 100; // Prevent infinite games
      
      while (game.gameStatus === 'active' && moveCount < maxMoves) {
        const aiMove = ai.getBestMove(game);
        if (!aiMove) break;
        
        const result = game.makeMove(aiMove);
        expect(result.success).toBe(true);
        moveCount++;
      }
      
      expect(moveCount).toBeGreaterThan(0);
    });
  });
});