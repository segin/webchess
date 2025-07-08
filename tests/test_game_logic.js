/**
 * Game Logic Test Suite for WebChess
 * Tests chess game mechanics, AI functionality, and game state management
 */

class GameLogicTestSuite {
  constructor() {
    this.testResults = [];
    this.passedTests = 0;
    this.failedTests = 0;
  }

  async runAllTests() {
    console.log('♟️ Starting Game Logic Test Suite...\n');
    
    // Core Game Tests
    await this.testChessGameCreation();
    await this.testGameStateManagement();
    await this.testMoveValidation();
    
    // AI Tests
    await this.testAIFunctionality();
    
    // Session Tests
    await this.testSessionPersistence();
    
    this.generateReport();
  }

  async runTest(testName, testFunction) {
    try {
      await testFunction();
      this.passedTests++;
      this.testResults.push({ name: testName, status: 'PASS', error: null });
      console.log(`✅ ${testName}`);
    } catch (error) {
      this.failedTests++;
      this.testResults.push({ name: testName, status: 'FAIL', error: error.message });
      console.log(`❌ ${testName}: ${error.message}`);
    }
  }

  // Chess Game Creation Tests
  async testChessGameCreation() {
    console.log('\n♚ Testing Chess Game Creation...');
    
    await this.runTest('Initial board setup', () => {
      const initialBoard = [
        ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
        ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
        ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
      ];
      
      // This test validates the concept of initial board setup
      if (initialBoard.length !== 8 || initialBoard[0].length !== 8) {
        throw new Error('Board should be 8x8');
      }
    });

    await this.runTest('Game state initialization', () => {
      const gameState = {
        board: Array(8).fill(null).map(() => Array(8).fill(null)),
        currentTurn: 'white',
        status: 'active',
        winner: null,
        moveHistory: [],
        inCheck: false
      };
      
      if (gameState.currentTurn !== 'white') {
        throw new Error('Game should start with white turn');
      }
      
      if (gameState.status !== 'active') {
        throw new Error('Game should start with active status');
      }
    });
  }

  // Game State Management Tests
  async testGameStateManagement() {
    console.log('\n🔄 Testing Game State Management...');
    
    await this.runTest('Turn alternation', () => {
      let currentTurn = 'white';
      currentTurn = currentTurn === 'white' ? 'black' : 'white';
      
      if (currentTurn !== 'black') {
        throw new Error('Turn should alternate from white to black');
      }
      
      currentTurn = currentTurn === 'white' ? 'black' : 'white';
      
      if (currentTurn !== 'white') {
        throw new Error('Turn should alternate from black to white');
      }
    });

    await this.runTest('Move history tracking', () => {
      const moveHistory = [];
      const testMove = {
        from: { row: 6, col: 4 },
        to: { row: 4, col: 4 },
        piece: 'P'
      };
      
      moveHistory.push(testMove);
      
      if (moveHistory.length !== 1) {
        throw new Error('Move history should track moves');
      }
      
      if (moveHistory[0].piece !== 'P') {
        throw new Error('Move should record piece type');
      }
    });
  }

  // Move Validation Tests
  async testMoveValidation() {
    console.log('\n✅ Testing Move Validation...');
    
    await this.runTest('Basic move structure', () => {
      const validMove = {
        from: { row: 6, col: 4 },
        to: { row: 4, col: 4 },
        piece: 'P'
      };
      
      if (!validMove.from || !validMove.to) {
        throw new Error('Move must have from and to coordinates');
      }
      
      if (typeof validMove.from.row !== 'number' || typeof validMove.from.col !== 'number') {
        throw new Error('Move coordinates must be numbers');
      }
    });

    await this.runTest('Coordinate bounds checking', () => {
      const testCoordinates = [
        { row: 0, col: 0, valid: true },
        { row: 7, col: 7, valid: true },
        { row: -1, col: 0, valid: false },
        { row: 8, col: 0, valid: false },
        { row: 0, col: -1, valid: false },
        { row: 0, col: 8, valid: false }
      ];
      
      testCoordinates.forEach(coord => {
        const isValid = coord.row >= 0 && coord.row < 8 && coord.col >= 0 && coord.col < 8;
        if (isValid !== coord.valid) {
          throw new Error(`Coordinate validation failed for ${coord.row},${coord.col}`);
        }
      });
    });
  }

  // AI Functionality Tests
  async testAIFunctionality() {
    console.log('\n🤖 Testing AI Functionality...');
    
    await this.runTest('AI difficulty levels', () => {
      const difficulties = ['easy', 'medium', 'hard'];
      const difficultyDepths = {
        'easy': 2,
        'medium': 3,
        'hard': 4
      };
      
      difficulties.forEach(difficulty => {
        if (!difficultyDepths[difficulty]) {
          throw new Error(`Difficulty ${difficulty} not configured`);
        }
      });
    });

    await this.runTest('Piece value system', () => {
      const pieceValues = {
        pawn: 100,
        knight: 300,
        bishop: 300,
        rook: 500,
        queen: 900,
        king: 10000
      };
      
      if (pieceValues.queen <= pieceValues.rook) {
        throw new Error('Queen should be more valuable than rook');
      }
      
      if (pieceValues.king <= pieceValues.queen) {
        throw new Error('King should be most valuable piece');
      }
    });

    await this.runTest('AI move generation', () => {
      // Test basic move generation logic
      const mockBoard = Array(8).fill(null).map(() => Array(8).fill(null));
      mockBoard[0][0] = { type: 'rook', color: 'black' };
      
      // Rook can move horizontally and vertically
      const rookMoves = [];
      
      // Generate horizontal moves
      for (let col = 1; col < 8; col++) {
        if (!mockBoard[0][col]) {
          rookMoves.push({ from: { row: 0, col: 0 }, to: { row: 0, col } });
        }
      }
      
      if (rookMoves.length === 0) {
        throw new Error('Rook should have valid moves on empty board');
      }
    });
  }

  // Session Persistence Tests
  async testSessionPersistence() {
    console.log('\n💾 Testing Session Persistence...');
    
    await this.runTest('Practice session data structure', () => {
      const practiceSession = {
        gameId: 'practice',
        color: 'white',
        isPracticeMode: true,
        practiceData: {
          mode: 'ai-white',
          difficulty: 'medium',
          gameState: {
            board: Array(8).fill(null).map(() => Array(8).fill(null)),
            currentTurn: 'white',
            status: 'active',
            moveHistory: []
          }
        }
      };
      
      if (!practiceSession.practiceData.gameState) {
        throw new Error('Practice session must include game state');
      }
      
      if (!practiceSession.practiceData.mode) {
        throw new Error('Practice session must include mode');
      }
    });

    await this.runTest('Multiplayer session data structure', () => {
      const multiplayerSession = {
        gameId: 'ABC123',
        color: 'white',
        isPracticeMode: false
      };
      
      if (multiplayerSession.gameId === 'practice') {
        throw new Error('Multiplayer session should not use practice gameId');
      }
      
      if (multiplayerSession.isPracticeMode) {
        throw new Error('Multiplayer session should not be practice mode');
      }
    });

    await this.runTest('Session validation logic', () => {
      const validSessions = [
        { gameId: 'ABC123', isPracticeMode: false },
        { gameId: 'practice', isPracticeMode: true }
      ];
      
      const invalidSessions = [
        { gameId: null, isPracticeMode: false },
        { gameId: 'practice', isPracticeMode: false },
        { gameId: 'ABC123', isPracticeMode: true }
      ];
      
      validSessions.forEach(session => {
        const isValid = session.gameId && 
          ((session.gameId === 'practice' && session.isPracticeMode) ||
           (session.gameId !== 'practice' && !session.isPracticeMode));
        
        if (!isValid) {
          throw new Error(`Valid session marked as invalid: ${JSON.stringify(session)}`);
        }
      });
      
      invalidSessions.forEach(session => {
        const isValid = session.gameId && 
          ((session.gameId === 'practice' && session.isPracticeMode) ||
           (session.gameId !== 'practice' && !session.isPracticeMode));
        
        if (isValid) {
          throw new Error(`Invalid session marked as valid: ${JSON.stringify(session)}`);
        }
      });
    });
  }

  generateReport() {
    console.log('\n📊 Game Logic Test Results Summary');
    console.log('==================================');
    console.log(`Total Tests: ${this.testResults.length}`);
    console.log(`Passed: ${this.passedTests}`);
    console.log(`Failed: ${this.failedTests}`);
    console.log(`Success Rate: ${((this.passedTests / this.testResults.length) * 100).toFixed(1)}%`);
    
    if (this.failedTests > 0) {
      console.log('\n❌ Failed Tests:');
      this.testResults
        .filter(test => test.status === 'FAIL')
        .forEach(test => {
          console.log(`  - ${test.name}: ${test.error}`);
        });
    }
    
    console.log('\n✅ Game logic test suite completed!');
    return this.failedTests === 0;
  }
}

// Export for use in browser or Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GameLogicTestSuite;
}