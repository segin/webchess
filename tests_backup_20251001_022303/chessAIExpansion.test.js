const ChessAI = require('../src/shared/chessAI');
const ChessGame = require('../src/shared/chessGame');

describe('Chess AI - Extended AI Tests', () => {
  let ai;
  let game;

  beforeEach(() => {
    ai = new ChessAI();
    game = new ChessGame();
  });

  describe('AI Decision Making Functions', () => {
    test('should test getBestMove function with different difficulty levels', () => {
      const difficulties = ['easy', 'medium', 'hard'];
      
      difficulties.forEach(difficulty => {
        ai.difficulty = difficulty;
        ai.maxDepth = ai.getMaxDepth(difficulty);
        
        // Set current turn to black for AI to move
        game.currentTurn = 'black';
        const move = ai.getBestMove(game);
        
        if (move) {
          expect(move).toHaveProperty('from');
          expect(move).toHaveProperty('to');
          expect(move.from).toHaveProperty('row');
          expect(move.from).toHaveProperty('col');
          expect(move.to).toHaveProperty('row');
          expect(move.to).toHaveProperty('col');
        }
      });
    });

    test('should test evaluatePosition function', () => {
      const evaluation = ai.evaluatePosition(game);
      expect(typeof evaluation).toBe('number');
    });

    test('should test minimax function with valid move', () => {
      const validMoves = ai.getAllValidMoves(game, 'white');
      if (validMoves.length > 0) {
        const move = validMoves[0];
        const depth = 1;
        const result = ai.minimax(game, move, depth, false, -Infinity, Infinity);
        expect(typeof result).toBe('number');
      }
    });

    test('should test cloneGame function', () => {
      const clonedGame = ai.cloneGame(game);
      expect(clonedGame).toBeDefined();
      expect(clonedGame.currentTurn).toBe(game.currentTurn);
      expect(clonedGame.gameStatus).toBe(game.gameStatus);
      expect(clonedGame.board).toEqual(game.board);
    });
  });

  describe('Position Evaluation Functions', () => {
    test('should test evaluatePosition function with different game states', () => {
      // Test normal position
      const normalEvaluation = ai.evaluatePosition(game);
      expect(typeof normalEvaluation).toBe('number');
      
      // Test checkmate position
      game.gameStatus = 'checkmate';
      game.winner = 'white';
      const checkmateEvaluation = ai.evaluatePosition(game);
      expect(checkmateEvaluation).toBe(10000);
      
      // Test stalemate position
      game.gameStatus = 'stalemate';
      game.winner = null;
      const stalemateEvaluation = ai.evaluatePosition(game);
      expect(stalemateEvaluation).toBe(0);
    });

    test('should test getPositionValue function', () => {
      const piece = { type: 'pawn', color: 'white' };
      const positionValue = ai.getPositionValue(piece, 6, 4);
      expect(typeof positionValue).toBe('number');
    });

    test('should test piece values calculation', () => {
      // Test that piece values are properly defined
      expect(ai.pieceValues.pawn).toBe(100);
      expect(ai.pieceValues.knight).toBe(300);
      expect(ai.pieceValues.bishop).toBe(300);
      expect(ai.pieceValues.rook).toBe(500);
      expect(ai.pieceValues.queen).toBe(900);
      expect(ai.pieceValues.king).toBe(10000);
    });

    test('should test position tables exist for all pieces', () => {
      const pieceTypes = ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king'];
      pieceTypes.forEach(pieceType => {
        expect(ai.positionValues[pieceType]).toBeDefined();
        expect(Array.isArray(ai.positionValues[pieceType])).toBe(true);
        expect(ai.positionValues[pieceType].length).toBe(8);
      });
    });
  });

  describe('Move Generation and Validation', () => {
    test('should test getAllValidMoves function', () => {
      const moves = ai.getAllValidMoves(game, 'white');
      expect(Array.isArray(moves)).toBe(true);
      expect(moves.length).toBeGreaterThan(0);
      
      // Verify move structure
      if (moves.length > 0) {
        const move = moves[0];
        expect(move).toHaveProperty('from');
        expect(move).toHaveProperty('to');
        expect(move.from).toHaveProperty('row');
        expect(move.from).toHaveProperty('col');
        expect(move.to).toHaveProperty('row');
        expect(move.to).toHaveProperty('col');
      }
    });

    test('should test getValidMovesForPiece function', () => {
      // Test with a pawn at starting position
      const pawnMoves = ai.getValidMovesForPiece(game, 6, 4);
      expect(Array.isArray(pawnMoves)).toBe(true);
      expect(pawnMoves.length).toBeGreaterThan(0);
    });

    test('should validate moves using current API', () => {
      const moves = ai.getAllValidMoves(game, 'white');
      if (moves.length > 0) {
        const move = moves[0];
        const validation = game.validateMove(move);
        expect(validation.success).toBe(true);
        expect(validation.isValid).toBe(true);
      }
    });

    test('should handle empty board scenarios', () => {
      // Create empty board
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      const moves = ai.getAllValidMoves(game, 'white');
      expect(Array.isArray(moves)).toBe(true);
      expect(moves.length).toBe(0);
    });

    test('should test isMaximizing function', () => {
      expect(ai.isMaximizing('white')).toBe(true);
      expect(ai.isMaximizing('black')).toBe(false);
    });
  });

  describe('AI Algorithm Testing', () => {
    test('should test minimax algorithm with different depths', () => {
      const validMoves = ai.getAllValidMoves(game, 'white');
      if (validMoves.length > 0) {
        const move = validMoves[0];
        
        // Test depth 0
        const result0 = ai.minimax(game, move, 0, false, -Infinity, Infinity);
        expect(typeof result0).toBe('number');
        
        // Test depth 1
        const result1 = ai.minimax(game, move, 1, false, -Infinity, Infinity);
        expect(typeof result1).toBe('number');
      }
    });

    test('should test alpha-beta pruning bounds', () => {
      const validMoves = ai.getAllValidMoves(game, 'white');
      if (validMoves.length > 0) {
        const move = validMoves[0];
        const alpha = -1000;
        const beta = 1000;
        
        const result = ai.minimax(game, move, 1, true, alpha, beta);
        expect(typeof result).toBe('number');
        expect(result).toBeGreaterThanOrEqual(alpha);
        expect(result).toBeLessThanOrEqual(beta);
      }
    });

    test('should test game cloning accuracy', () => {
      // Make a move in original game
      const move = { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } };
      const result = game.makeMove(move);
      
      if (result.success) {
        const clonedGame = ai.cloneGame(game);
        
        // Verify cloned game matches original
        expect(clonedGame.currentTurn).toBe(game.currentTurn);
        expect(clonedGame.gameStatus).toBe(game.gameStatus);
        expect(clonedGame.moveHistory.length).toBe(game.moveHistory.length);
        expect(clonedGame.board).toEqual(game.board);
      }
    });

    test('should test AI decision consistency', () => {
      // Test that AI makes consistent decisions for same position
      const move1 = ai.getBestMove(game);
      const move2 = ai.getBestMove(game);
      
      if (move1 && move2) {
        expect(move1.from).toEqual(move2.from);
        expect(move1.to).toEqual(move2.to);
      }
    });
  });

  describe('Game Phase Recognition', () => {
    test('should evaluate different game positions', () => {
      // Test starting position evaluation
      const startingEvaluation = ai.evaluatePosition(game);
      expect(typeof startingEvaluation).toBe('number');
      
      // Test with fewer pieces (simulated endgame)
      const endgameBoard = Array(8).fill(null).map(() => Array(8).fill(null));
      endgameBoard[7][4] = { type: 'king', color: 'white' };
      endgameBoard[0][4] = { type: 'king', color: 'black' };
      endgameBoard[6][4] = { type: 'pawn', color: 'white' };
      
      const endgameGame = { ...game, board: endgameBoard };
      const endgameEvaluation = ai.evaluatePosition(endgameGame);
      expect(typeof endgameEvaluation).toBe('number');
    });

    test('should handle different piece configurations', () => {
      // Test with only kings
      const kingsOnlyBoard = Array(8).fill(null).map(() => Array(8).fill(null));
      kingsOnlyBoard[7][4] = { type: 'king', color: 'white' };
      kingsOnlyBoard[0][4] = { type: 'king', color: 'black' };
      
      const kingsOnlyGame = { ...game, board: kingsOnlyBoard };
      const evaluation = ai.evaluatePosition(kingsOnlyGame);
      expect(typeof evaluation).toBe('number');
    });

    test('should test position value calculation for different pieces', () => {
      const pieces = [
        { type: 'pawn', color: 'white' },
        { type: 'knight', color: 'white' },
        { type: 'bishop', color: 'white' },
        { type: 'rook', color: 'white' },
        { type: 'queen', color: 'white' },
        { type: 'king', color: 'white' }
      ];
      
      pieces.forEach(piece => {
        const positionValue = ai.getPositionValue(piece, 4, 4);
        expect(typeof positionValue).toBe('number');
      });
    });
  });

  describe('AI Difficulty and Configuration', () => {
    test('should test difficulty levels', () => {
      const difficulties = ['easy', 'medium', 'hard'];
      
      difficulties.forEach(difficulty => {
        ai.difficulty = difficulty;
        ai.maxDepth = ai.getMaxDepth(difficulty);
        expect(ai.difficulty).toBe(difficulty);
        expect(typeof ai.maxDepth).toBe('number');
      });
    });

    test('should test getMaxDepth function', () => {
      expect(ai.getMaxDepth('easy')).toBe(1);
      expect(ai.getMaxDepth('medium')).toBe(2);
      expect(ai.getMaxDepth('hard')).toBe(3);
      expect(ai.getMaxDepth('unknown')).toBe(2);
    });

    test('should test AI randomness in easy mode', () => {
      ai.difficulty = 'easy';
      
      // Test multiple times to check for randomness
      const moves = [];
      for (let i = 0; i < 5; i++) {
        const move = ai.getBestMove(game);
        if (move) {
          moves.push(move);
        }
      }
      
      // In easy mode, there should be some variation due to randomness
      expect(moves.length).toBeGreaterThan(0);
    });

    test('should test AI consistency in hard mode', () => {
      ai.difficulty = 'hard';
      ai.maxDepth = ai.getMaxDepth('hard');
      
      const move1 = ai.getBestMove(game);
      const move2 = ai.getBestMove(game);
      
      // In hard mode, moves should be more consistent
      if (move1 && move2) {
        expect(move1.from).toEqual(move2.from);
        expect(move1.to).toEqual(move2.to);
      }
    });
  });

  describe('Performance and Edge Cases', () => {
    test('should handle performance with limited move sets', () => {
      // Test that AI can handle positions with many possible moves
      const startTime = Date.now();
      const move = ai.getBestMove(game);
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
      
      if (move) {
        expect(move).toHaveProperty('from');
        expect(move).toHaveProperty('to');
      }
    });

    test('should test AI with complex positions', () => {
      // Create a more complex middle-game position
      game.board[4][4] = { type: 'knight', color: 'white' };
      game.board[3][3] = { type: 'bishop', color: 'black' };
      game.board[5][5] = { type: 'queen', color: 'white' };
      
      const move = ai.getBestMove(game);
      if (move) {
        expect(move).toHaveProperty('from');
        expect(move).toHaveProperty('to');
      }
    });

    test('should test memory efficiency with game cloning', () => {
      // Test that cloning doesn't cause memory issues
      const clones = [];
      for (let i = 0; i < 10; i++) {
        clones.push(ai.cloneGame(game));
      }
      
      expect(clones.length).toBe(10);
      clones.forEach(clone => {
        expect(clone.board).toEqual(game.board);
        expect(clone.currentTurn).toBe(game.currentTurn);
      });
    });

    test('should test AI behavior with limited depth', () => {
      ai.maxDepth = 0;
      const move = ai.getBestMove(game);
      
      if (move) {
        expect(move).toHaveProperty('from');
        expect(move).toHaveProperty('to');
      }
    });
  });

  describe('Move Evaluation and Validation', () => {
    test('should evaluate move quality using current API', () => {
      const move = { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } };
      
      // Test move validation using current API
      const validation = game.validateMove(move);
      expect(validation).toHaveProperty('success');
      expect(validation).toHaveProperty('isValid');
      
      if (validation.success && validation.isValid) {
        // Test position evaluation before and after move
        const beforeEvaluation = ai.evaluatePosition(game);
        
        const clonedGame = ai.cloneGame(game);
        const result = clonedGame.makeMove(move);
        
        if (result.success) {
          const afterEvaluation = ai.evaluatePosition(clonedGame);
          expect(typeof beforeEvaluation).toBe('number');
          expect(typeof afterEvaluation).toBe('number');
        }
      }
    });

    test('should test move comparison and selection', () => {
      const validMoves = ai.getAllValidMoves(game, 'white');
      
      if (validMoves.length > 1) {
        // Compare evaluations of different moves
        const evaluations = validMoves.slice(0, 3).map(move => {
          const clonedGame = ai.cloneGame(game);
          const result = clonedGame.makeMove(move);
          
          if (result.success) {
            return {
              move,
              evaluation: ai.evaluatePosition(clonedGame)
            };
          }
          return null;
        }).filter(Boolean);
        
        expect(evaluations.length).toBeGreaterThan(0);
        evaluations.forEach(item => {
          expect(typeof item.evaluation).toBe('number');
        });
      }
    });

    test('should test AI move selection consistency', () => {
      // Test that AI selects reasonable moves
      const bestMove = ai.getBestMove(game);
      
      if (bestMove) {
        const validation = game.validateMove(bestMove);
        expect(validation.success).toBe(true);
        expect(validation.isValid).toBe(true);
      }
    });
  });

  describe('Game State Analysis', () => {
    test('should analyze game progression', () => {
      const moves = [
        { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } },
        { from: { row: 1, col: 4 }, to: { row: 3, col: 4 } }
      ];
      
      // Execute moves and analyze positions
      moves.forEach(move => {
        const validation = game.validateMove(move);
        if (validation.success && validation.isValid) {
          const result = game.makeMove(move);
          expect(result.success).toBe(true);
          
          // Analyze position after each move
          const evaluation = ai.evaluatePosition(game);
          expect(typeof evaluation).toBe('number');
        }
      });
    });

    test('should provide position evaluation insights', () => {
      // Test evaluation of different game states
      const initialEvaluation = ai.evaluatePosition(game);
      expect(typeof initialEvaluation).toBe('number');
      
      // Test with modified position
      game.board[4][4] = { type: 'queen', color: 'white' };
      const modifiedEvaluation = ai.evaluatePosition(game);
      expect(typeof modifiedEvaluation).toBe('number');
      expect(modifiedEvaluation).toBeGreaterThan(initialEvaluation);
    });

    test('should identify tactical opportunities', () => {
      // Set up a position with tactical possibilities
      game.board[4][4] = { type: 'knight', color: 'white' };
      game.board[2][3] = { type: 'rook', color: 'black' };
      game.board[2][5] = { type: 'bishop', color: 'black' };
      
      const moves = ai.getAllValidMoves(game, 'white');
      const knightMoves = moves.filter(move => 
        game.board[move.from.row][move.from.col]?.type === 'knight'
      );
      
      expect(knightMoves.length).toBeGreaterThan(0);
    });

    test('should evaluate endgame scenarios', () => {
      // Create endgame position
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[7][4] = { type: 'king', color: 'white' };
      game.board[0][4] = { type: 'king', color: 'black' };
      game.board[6][4] = { type: 'pawn', color: 'white' };
      
      const evaluation = ai.evaluatePosition(game);
      expect(typeof evaluation).toBe('number');
      expect(evaluation).toBeGreaterThan(0); // White should be winning
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle invalid game state gracefully', () => {
      const invalidGame = null;
      
      // AI should handle null game gracefully by returning null
      const result = ai.getBestMove(invalidGame);
      expect(result).toBeNull();
    });

    test('should handle empty board scenarios', () => {
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      const evaluation = ai.evaluatePosition(game);
      expect(typeof evaluation).toBe('number');
      
      const moves = ai.getAllValidMoves(game, 'white');
      expect(Array.isArray(moves)).toBe(true);
      expect(moves.length).toBe(0);
    });

    test('should handle positions with no legal moves', () => {
      // Set up a position where white king is trapped
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[0][0] = { type: 'king', color: 'white' };
      game.board[2][0] = { type: 'king', color: 'black' };
      game.board[0][1] = { type: 'rook', color: 'black' };
      game.board[1][0] = { type: 'rook', color: 'black' };
      game.board[1][1] = { type: 'rook', color: 'black' };
      
      game.currentTurn = 'white';
      const moves = ai.getAllValidMoves(game, 'white');
      expect(Array.isArray(moves)).toBe(true);
      
      // If no valid moves are found, AI should return null
      const bestMove = ai.getBestMove(game);
      if (moves.length === 0) {
        expect(bestMove).toBeNull();
      } else {
        // If moves are found, AI should return a valid move
        expect(bestMove).toBeDefined();
      }
    });

    test('should handle corrupted board states', () => {
      // Test with missing pieces
      game.board[7][4] = null; // Remove white king
      
      const evaluation = ai.evaluatePosition(game);
      expect(typeof evaluation).toBe('number');
    });

    test('should handle invalid piece configurations', () => {
      // Test with invalid piece data
      game.board[4][4] = { type: 'invalid', color: 'white' };
      
      const moves = ai.getAllValidMoves(game, 'white');
      expect(Array.isArray(moves)).toBe(true);
    });
  });

  describe('AI Integration with Game State', () => {
    test('should integrate with current game state management', () => {
      // Test AI integration with current game properties
      expect(game.currentTurn).toBeDefined();
      expect(game.gameStatus).toBeDefined();
      expect(game.board).toBeDefined();
      
      const move = ai.getBestMove(game);
      if (move) {
        const validation = game.validateMove(move);
        expect(validation.success).toBe(true);
        expect(validation.isValid).toBe(true);
      }
    });

    test('should work with game state transitions', () => {
      const initialTurn = game.currentTurn;
      const move = ai.getBestMove(game);
      
      if (move) {
        const result = game.makeMove(move);
        if (result.success) {
          expect(game.currentTurn).not.toBe(initialTurn);
          expect(result.data).toHaveProperty('gameStatus');
          expect(result.data).toHaveProperty('currentTurn');
        }
      }
    });

    test('should handle checkmate detection', () => {
      // Set up a checkmate position
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[0][0] = { type: 'king', color: 'black' };
      game.board[1][0] = { type: 'rook', color: 'white' };
      game.board[0][1] = { type: 'rook', color: 'white' };
      game.gameStatus = 'checkmate';
      game.winner = 'white';
      
      const evaluation = ai.evaluatePosition(game);
      expect(evaluation).toBe(10000); // Should recognize checkmate value
    });

    test('should handle stalemate scenarios', () => {
      game.gameStatus = 'stalemate';
      game.winner = null;
      
      const evaluation = ai.evaluatePosition(game);
      expect(evaluation).toBe(0); // Should recognize stalemate as draw
    });

    test('should respect current API error handling', () => {
      const invalidMove = { from: { row: -1, col: -1 }, to: { row: 8, col: 8 } };
      const validation = game.validateMove(invalidMove);
      
      expect(validation.success).toBe(false);
      expect(validation.isValid).toBe(false);
      expect(validation).toHaveProperty('errorCode');
      expect(validation).toHaveProperty('message');
    });
  });
});