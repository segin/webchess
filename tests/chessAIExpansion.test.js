const ChessAI = require('../src/shared/chessAI');
const ChessGame = require('../src/shared/chessGame');

describe('Chess AI - Under-Tested Functions Coverage', () => {
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
        ai.setDifficulty(difficulty);
        const move = ai.getBestMove(game, 'black');
        
        expect(move).toHaveProperty('from');
        expect(move).toHaveProperty('to');
        expect(move.from).toHaveProperty('row');
        expect(move.from).toHaveProperty('col');
        expect(move.to).toHaveProperty('row');
        expect(move.to).toHaveProperty('col');
      });
    });

    test('should test evaluatePosition function', () => {
      const evaluation = ai.evaluatePosition(game.board, 'black');
      expect(typeof evaluation).toBe('number');
    });

    test('should test minimax function', () => {
      const depth = 2;
      const result = ai.minimax(game, depth, true, 'black');
      
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('move');
      expect(typeof result.score).toBe('number');
    });

    test('should test alphabeta function', () => {
      const depth = 2;
      const alpha = -Infinity;
      const beta = Infinity;
      
      const result = ai.alphabeta(game, depth, alpha, beta, true, 'black');
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('move');
    });
  });

  describe('Position Evaluation Functions', () => {
    test('should test calculateMaterialValue function', () => {
      const materialValue = ai.calculateMaterialValue(game.board, 'white');
      expect(typeof materialValue).toBe('number');
      expect(materialValue).toBeGreaterThan(0);
    });

    test('should test evaluatePiecePositions function', () => {
      const positionValue = ai.evaluatePiecePositions(game.board, 'white');
      expect(typeof positionValue).toBe('number');
    });

    test('should test evaluateKingSafety function', () => {
      const kingSafety = ai.evaluateKingSafety(game, 'white');
      expect(typeof kingSafety).toBe('number');
    });

    test('should test evaluatePawnStructure function', () => {
      const pawnStructure = ai.evaluatePawnStructure(game.board, 'white');
      expect(typeof pawnStructure).toBe('number');
    });

    test('should test evaluateMobility function', () => {
      const mobility = ai.evaluateMobility(game, 'white');
      expect(typeof mobility).toBe('number');
    });

    test('should test evaluateControlOfCenter function', () => {
      const centerControl = ai.evaluateControlOfCenter(game, 'white');
      expect(typeof centerControl).toBe('number');
    });
  });

  describe('Move Generation and Filtering', () => {
    test('should test getAllPossibleMoves function', () => {
      const moves = ai.getAllPossibleMoves(game, 'white');
      expect(Array.isArray(moves)).toBe(true);
      expect(moves.length).toBeGreaterThan(0);
    });

    test('should test filterLegalMoves function', () => {
      const allMoves = ai.getAllPossibleMoves(game, 'white');
      const legalMoves = ai.filterLegalMoves(game, allMoves, 'white');
      
      expect(Array.isArray(legalMoves)).toBe(true);
      expect(legalMoves.length).toBeLessThanOrEqual(allMoves.length);
    });

    test('should test orderMoves function', () => {
      const moves = ai.getAllPossibleMoves(game, 'white');
      const orderedMoves = ai.orderMoves(game, moves, 'white');
      
      expect(Array.isArray(orderedMoves)).toBe(true);
      expect(orderedMoves.length).toBe(moves.length);
    });

    test('should test isCapture function', () => {
      // Set up a capture scenario
      game.board[4][4] = { type: 'pawn', color: 'black' };
      
      const captureMove = { from: { row: 5, col: 3 }, to: { row: 4, col: 4 } };
      const nonCaptureMove = { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } };
      
      expect(ai.isCapture(game, captureMove)).toBe(true);
      expect(ai.isCapture(game, nonCaptureMove)).toBe(false);
    });

    test('should test isCheck function', () => {
      // Set up a check scenario
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[7][4] = { type: 'king', color: 'white' };
      game.board[0][4] = { type: 'rook', color: 'black' };
      
      const checkMove = { from: { row: 1, col: 4 }, to: { row: 0, col: 4 } };
      expect(ai.isCheck(game, checkMove, 'black')).toBe(true);
    });
  });

  describe('Tactical Pattern Recognition', () => {
    test('should test findTacticalMoves function', () => {
      const tacticalMoves = ai.findTacticalMoves(game, 'white');
      expect(Array.isArray(tacticalMoves)).toBe(true);
    });

    test('should test findForks function', () => {
      // Set up a potential fork scenario
      game.board[4][4] = { type: 'knight', color: 'white' };
      game.board[2][3] = { type: 'rook', color: 'black' };
      game.board[2][5] = { type: 'bishop', color: 'black' };
      
      const forks = ai.findForks(game, 'white');
      expect(Array.isArray(forks)).toBe(true);
    });

    test('should test findPins function', () => {
      // Set up a pin scenario
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[7][4] = { type: 'king', color: 'black' };
      game.board[5][4] = { type: 'bishop', color: 'black' };
      game.board[0][4] = { type: 'rook', color: 'white' };
      
      const pins = ai.findPins(game, 'white');
      expect(Array.isArray(pins)).toBe(true);
    });

    test('should test findSkewers function', () => {
      // Set up a skewer scenario
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[0][0] = { type: 'king', color: 'black' };
      game.board[0][1] = { type: 'queen', color: 'black' };
      game.board[0][7] = { type: 'rook', color: 'white' };
      
      const skewers = ai.findSkewers(game, 'white');
      expect(Array.isArray(skewers)).toBe(true);
    });

    test('should test findDiscoveredAttacks function', () => {
      const discoveredAttacks = ai.findDiscoveredAttacks(game, 'white');
      expect(Array.isArray(discoveredAttacks)).toBe(true);
    });
  });

  describe('Opening and Endgame Knowledge', () => {
    test('should test getOpeningMove function', () => {
      const openingMove = ai.getOpeningMove(game, 'white');
      
      if (openingMove) {
        expect(openingMove).toHaveProperty('from');
        expect(openingMove).toHaveProperty('to');
      }
    });

    test('should test isOpeningPhase function', () => {
      const isOpening = ai.isOpeningPhase(game);
      expect(typeof isOpening).toBe('boolean');
    });

    test('should test isEndgamePhase function', () => {
      // Set up an endgame position
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[7][4] = { type: 'king', color: 'white' };
      game.board[0][4] = { type: 'king', color: 'black' };
      game.board[6][4] = { type: 'pawn', color: 'white' };
      
      const isEndgame = ai.isEndgamePhase(game);
      expect(typeof isEndgame).toBe('boolean');
    });

    test('should test evaluateEndgamePosition function', () => {
      // Set up an endgame position
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[7][4] = { type: 'king', color: 'white' };
      game.board[0][4] = { type: 'king', color: 'black' };
      game.board[6][4] = { type: 'pawn', color: 'white' };
      
      const evaluation = ai.evaluateEndgamePosition(game, 'white');
      expect(typeof evaluation).toBe('number');
    });
  });

  describe('AI Personality and Difficulty', () => {
    test('should test setDifficulty function', () => {
      const difficulties = ['easy', 'medium', 'hard'];
      
      difficulties.forEach(difficulty => {
        ai.setDifficulty(difficulty);
        expect(ai.difficulty).toBe(difficulty);
      });
    });

    test('should test getSearchDepth function', () => {
      ai.setDifficulty('easy');
      expect(ai.getSearchDepth()).toBeLessThan(4);
      
      ai.setDifficulty('hard');
      expect(ai.getSearchDepth()).toBeGreaterThan(2);
    });

    test('should test shouldMakeRandomMove function', () => {
      ai.setDifficulty('easy');
      const shouldRandom = ai.shouldMakeRandomMove();
      expect(typeof shouldRandom).toBe('boolean');
    });

    test('should test addRandomness function', () => {
      const baseScore = 100;
      const randomizedScore = ai.addRandomness(baseScore);
      expect(typeof randomizedScore).toBe('number');
    });
  });

  describe('Performance and Optimization', () => {
    test('should test transpositionTable operations', () => {
      const position = 'test_position';
      const entry = { score: 100, depth: 3, move: { from: { row: 0, col: 0 }, to: { row: 0, col: 1 } } };
      
      ai.storeInTranspositionTable(position, entry);
      const retrieved = ai.getFromTranspositionTable(position);
      
      expect(retrieved).toEqual(entry);
    });

    test('should test clearTranspositionTable function', () => {
      ai.storeInTranspositionTable('test', { score: 100 });
      ai.clearTranspositionTable();
      
      const retrieved = ai.getFromTranspositionTable('test');
      expect(retrieved).toBeNull();
    });

    test('should test getThinkingTime function', () => {
      const thinkingTime = ai.getThinkingTime();
      expect(typeof thinkingTime).toBe('number');
      expect(thinkingTime).toBeGreaterThan(0);
    });

    test('should test shouldStopSearch function', () => {
      const startTime = Date.now();
      const shouldStop = ai.shouldStopSearch(startTime);
      expect(typeof shouldStop).toBe('boolean');
    });
  });

  describe('Move Quality Assessment', () => {
    test('should test evaluateMoveQuality function', () => {
      const move = { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } };
      const quality = ai.evaluateMoveQuality(game, move, 'white');
      
      expect(quality).toHaveProperty('score');
      expect(quality).toHaveProperty('category');
      expect(typeof quality.score).toBe('number');
      expect(typeof quality.category).toBe('string');
    });

    test('should test isBrilliantMove function', () => {
      const move = { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } };
      const isBrilliant = ai.isBrilliantMove(game, move, 'white');
      expect(typeof isBrilliant).toBe('boolean');
    });

    test('should test isBlunder function', () => {
      const move = { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } };
      const isBlunder = ai.isBlunder(game, move, 'white');
      expect(typeof isBlunder).toBe('boolean');
    });

    test('should test getMoveAnnotation function', () => {
      const move = { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } };
      const annotation = ai.getMoveAnnotation(game, move, 'white');
      expect(typeof annotation).toBe('string');
    });
  });

  describe('Game Analysis Functions', () => {
    test('should test analyzeGame function', () => {
      const moves = [
        { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } },
        { from: { row: 1, col: 4 }, to: { row: 3, col: 4 } }
      ];
      
      const analysis = ai.analyzeGame(moves);
      expect(analysis).toHaveProperty('accuracy');
      expect(analysis).toHaveProperty('blunders');
      expect(analysis).toHaveProperty('brilliantMoves');
    });

    test('should test getPositionAdvice function', () => {
      const advice = ai.getPositionAdvice(game, 'white');
      expect(advice).toHaveProperty('suggestions');
      expect(advice).toHaveProperty('warnings');
      expect(Array.isArray(advice.suggestions)).toBe(true);
    });

    test('should test identifyWeaknesses function', () => {
      const weaknesses = ai.identifyWeaknesses(game, 'white');
      expect(Array.isArray(weaknesses)).toBe(true);
    });

    test('should test suggestImprovements function', () => {
      const improvements = ai.suggestImprovements(game, 'white');
      expect(Array.isArray(improvements)).toBe(true);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle invalid game state', () => {
      const invalidGame = null;
      const move = ai.getBestMove(invalidGame, 'white');
      expect(move).toBeNull();
    });

    test('should handle invalid color', () => {
      const move = ai.getBestMove(game, 'invalid_color');
      expect(move).toBeNull();
    });

    test('should handle empty board', () => {
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      const evaluation = ai.evaluatePosition(game.board, 'white');
      expect(typeof evaluation).toBe('number');
    });

    test('should handle no legal moves', () => {
      // Set up a position with no legal moves
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[0][0] = { type: 'king', color: 'white' };
      game.board[1][1] = { type: 'king', color: 'black' };
      game.board[0][1] = { type: 'rook', color: 'black' };
      game.board[1][0] = { type: 'rook', color: 'black' };
      
      const moves = ai.getAllPossibleMoves(game, 'white');
      const legalMoves = ai.filterLegalMoves(game, moves, 'white');
      expect(legalMoves.length).toBe(0);
    });
  });

  describe('AI Configuration and Settings', () => {
    test('should test setPersonality function', () => {
      const personalities = ['aggressive', 'defensive', 'positional', 'tactical'];
      
      personalities.forEach(personality => {
        ai.setPersonality(personality);
        expect(ai.personality).toBe(personality);
      });
    });

    test('should test getAISettings function', () => {
      const settings = ai.getAISettings();
      expect(settings).toHaveProperty('difficulty');
      expect(settings).toHaveProperty('personality');
      expect(settings).toHaveProperty('searchDepth');
    });

    test('should test updateAISettings function', () => {
      const newSettings = {
        difficulty: 'hard',
        personality: 'aggressive',
        thinkingTime: 5000
      };
      
      ai.updateAISettings(newSettings);
      expect(ai.difficulty).toBe('hard');
      expect(ai.personality).toBe('aggressive');
    });

    test('should test resetAI function', () => {
      ai.setDifficulty('hard');
      ai.setPersonality('aggressive');
      
      ai.resetAI();
      
      expect(ai.difficulty).toBe('medium');
      expect(ai.personality).toBe('balanced');
    });
  });
});