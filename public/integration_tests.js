/**
 * Integration Test Suite for WebChess DOM API
 * Tests actual game functionality through DOM interactions
 */

class IntegrationTests {
  constructor() {
    this.testResults = [];
    this.passedTests = 0;
    this.failedTests = 0;
    this.webChessClient = null;
    this.originalAiMoveDelay = 1000;
  }

  async runAllTests() {
    console.log('🧪 Integration Test Suite - DOM API Testing\n');
    
    // Wait for WebChess to be available
    await this.waitForWebChess();
    
    // Test practice mode functionality
    await this.testPracticeModes();
    
    // Test valid move highlighting
    await this.testValidMoveHighlighting();
    
    // Test AI vs AI extended play
    await this.testAIvsAIExtended();
    
    this.generateReport();
  }

  async waitForWebChess() {
    let attempts = 0;
    while (attempts < 50) {
      if (typeof WebChessClient === 'function') {
        // Find existing WebChess client instance
        this.webChessClient = window.webChessClient;
        if (!this.webChessClient) {
          // Create new instance if needed
          this.webChessClient = new WebChessClient();
        }
        console.log('✅ WebChess client found');
        return;
      }
      await this.delay(100);
      attempts++;
    }
    throw new Error('WebChess client not available after 5 seconds');
  }

  async testPracticeModes() {
    console.log('\n🎯 Testing Practice Modes...');
    
    await this.runTest('Practice Mode: Play Both Sides', async () => {
      await this.startPracticeModeAndVerify('self');
      await this.simulatePlayerMove();
    });

    await this.runTest('Practice Mode: Play as White vs AI', async () => {
      await this.startPracticeModeAndVerify('ai-white');
      await this.simulatePlayerMove();
      await this.verifyAIMove('black');
    });

    await this.runTest('Practice Mode: Play as Black vs AI', async () => {
      await this.startPracticeModeAndVerify('ai-black');
      await this.verifyAIMove('white');
      await this.simulatePlayerMove();
    });
  }

  async startPracticeModeAndVerify(mode) {
    // Click practice button
    const practiceBtn = document.getElementById('practice-btn');
    practiceBtn.click();
    
    await this.delay(100);
    
    // Verify practice screen is shown
    const practiceScreen = document.getElementById('practice-screen');
    if (practiceScreen.classList.contains('hidden')) {
      throw new Error('Practice screen not shown');
    }
    
    // Click appropriate mode button
    const modeBtn = document.getElementById(`practice-${mode}-btn`);
    modeBtn.click();
    
    await this.delay(100);
    
    // Verify game screen is shown
    const gameScreen = document.getElementById('game-screen');
    if (gameScreen.classList.contains('hidden')) {
      throw new Error('Game screen not shown');
    }
    
    // Verify practice mode is set correctly
    if (this.webChessClient.practiceMode !== mode) {
      throw new Error(`Practice mode not set correctly. Expected: ${mode}, Got: ${this.webChessClient.practiceMode}`);
    }
    
    console.log(`✅ Practice mode ${mode} started successfully`);
  }

  async simulatePlayerMove() {
    // Determine which color the human should play based on practice mode
    const humanColor = this.determineHumanColor();
    const currentTurn = this.webChessClient.gameState.currentTurn;
    
    // Check if it's the human's turn
    if (currentTurn !== humanColor) {
      throw new Error(`Not human's turn. Current turn: ${currentTurn}, Human plays: ${humanColor}`);
    }
    
    let fromSquare, toSquare, expectedRow, expectedCol, expectedColor;
    
    if (humanColor === 'white') {
      // Human plays white - move e2 to e4
      fromSquare = document.querySelector('[data-row="6"][data-col="4"]');
      toSquare = document.querySelector('[data-row="4"][data-col="4"]');
      expectedRow = 4;
      expectedCol = 4;
      expectedColor = 'white';
    } else {
      // Human plays black - move e7 to e5
      fromSquare = document.querySelector('[data-row="1"][data-col="4"]');
      toSquare = document.querySelector('[data-row="3"][data-col="4"]');
      expectedRow = 3;
      expectedCol = 4;
      expectedColor = 'black';
    }
    
    if (!fromSquare || !toSquare) {
      throw new Error(`Could not find squares for ${humanColor} pawn move`);
    }
    
    // Click on from square to select pawn
    fromSquare.click();
    await this.delay(100);
    
    // Verify square is selected
    if (!fromSquare.classList.contains('selected')) {
      throw new Error('Square not selected after click');
    }
    
    // Click on to square to move pawn
    toSquare.click();
    await this.delay(100);
    
    // Verify move was made
    const piece = this.webChessClient.gameState.board[expectedRow][expectedCol];
    if (!piece || piece.type !== 'pawn' || piece.color !== expectedColor) {
      throw new Error(`Move not executed correctly. Expected ${expectedColor} pawn at [${expectedRow}][${expectedCol}]`);
    }
    
    console.log(`✅ Player move simulated successfully: ${humanColor} pawn`);
  }
  
  determineHumanColor() {
    const mode = this.webChessClient.practiceMode;
    switch (mode) {
      case 'ai-white': return 'white'; // Human plays white, AI plays black
      case 'ai-black': return 'black'; // Human plays black, AI plays white
      case 'self': return this.webChessClient.gameState.currentTurn; // Can play both
      default: return 'white';
    }
  }

  async verifyAIMove(expectedColor) {
    const initialMoveCount = this.webChessClient.gameState.moveHistory.length;
    
    // Wait for AI to make a move (with timeout)
    let attempts = 0;
    while (attempts < 50) {
      if (this.webChessClient.gameState.moveHistory.length > initialMoveCount) {
        const lastMove = this.webChessClient.gameState.moveHistory[this.webChessClient.gameState.moveHistory.length - 1];
        if (lastMove.color === expectedColor) {
          console.log(`✅ AI made expected ${expectedColor} move`);
          return;
        } else {
          throw new Error(`AI made wrong color move. Expected: ${expectedColor}, Got: ${lastMove.color}`);
        }
      }
      await this.delay(100);
      attempts++;
    }
    
    throw new Error(`AI did not make a ${expectedColor} move within 5 seconds`);
  }

  async testValidMoveHighlighting() {
    console.log('\n🎯 Testing Valid Move Highlighting...');
    
    await this.runTest('Valid moves highlight for white pawn', async () => {
      await this.startPracticeModeAndVerify('self');
      
      // Click on e2 pawn
      const e2Square = document.querySelector('[data-row="6"][data-col="4"]');
      e2Square.click();
      await this.delay(100);
      
      // Check if valid moves are highlighted
      const e3Square = document.querySelector('[data-row="5"][data-col="4"]');
      const e4Square = document.querySelector('[data-row="4"][data-col="4"]');
      
      if (!e3Square.classList.contains('valid-move')) {
        throw new Error('e3 square not highlighted as valid move');
      }
      if (!e4Square.classList.contains('valid-move')) {
        throw new Error('e4 square not highlighted as valid move');
      }
      
      console.log('✅ Valid moves highlighted correctly');
    });

    await this.runTest('Valid moves highlight for knight', async () => {
      await this.startPracticeModeAndVerify('self');
      
      // Click on b1 knight
      const b1Square = document.querySelector('[data-row="7"][data-col="1"]');
      b1Square.click();
      await this.delay(100);
      
      // Check if knight moves are highlighted
      const a3Square = document.querySelector('[data-row="5"][data-col="0"]');
      const c3Square = document.querySelector('[data-row="5"][data-col="2"]');
      
      if (!a3Square.classList.contains('valid-move')) {
        throw new Error('a3 square not highlighted as valid knight move');
      }
      if (!c3Square.classList.contains('valid-move')) {
        throw new Error('c3 square not highlighted as valid knight move');
      }
      
      console.log('✅ Knight moves highlighted correctly');
    });
  }

  async testAIvsAIExtended() {
    console.log('\n🎯 Testing AI vs AI Extended Play...');
    
    await this.runTest('AI vs AI plays 10 turns', async () => {
      // Disable AI move delay for faster testing
      this.originalAiMoveDelay = this.webChessClient.aiMoveDelay;
      this.webChessClient.aiMoveDelay = 0;
      
      await this.startPracticeModeAndVerify('ai-vs-ai');
      
      const initialMoveCount = this.webChessClient.gameState.moveHistory.length;
      
      // Wait for 10 moves (5 by each AI)
      let attempts = 0;
      while (attempts < 200) { // 20 seconds max
        if (this.webChessClient.gameState.moveHistory.length >= initialMoveCount + 10) {
          console.log('✅ AI vs AI played 10 turns successfully');
          
          // Verify moves alternate colors
          const recentMoves = this.webChessClient.gameState.moveHistory.slice(-10);
          for (let i = 0; i < recentMoves.length; i++) {
            const expectedColor = i % 2 === 0 ? 'white' : 'black';
            if (recentMoves[i].color !== expectedColor) {
              throw new Error(`Move ${i + 1} has wrong color. Expected: ${expectedColor}, Got: ${recentMoves[i].color}`);
            }
          }
          
          // Restore original delay
          this.webChessClient.aiMoveDelay = this.originalAiMoveDelay;
          return;
        }
        
        // Check if game ended prematurely
        if (this.webChessClient.gameState.status !== 'active') {
          throw new Error(`Game ended prematurely with status: ${this.webChessClient.gameState.status}`);
        }
        
        await this.delay(100);
        attempts++;
      }
      
      // Restore original delay
      this.webChessClient.aiMoveDelay = this.originalAiMoveDelay;
      throw new Error('AI vs AI did not complete 10 turns within 20 seconds');
    });
  }

  async runTest(testName, testFunction) {
    try {
      console.log(`\n🧪 Running: ${testName}`);
      await testFunction();
      this.passedTests++;
      this.testResults.push({ name: testName, status: 'PASS', error: null });
      console.log(`✅ ${testName} - PASSED`);
    } catch (error) {
      this.failedTests++;
      this.testResults.push({ name: testName, status: 'FAIL', error: error.message });
      console.log(`❌ ${testName} - FAILED: ${error.message}`);
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  generateReport() {
    console.log('\n📊 Integration Test Results:');
    console.log(`Total Tests: ${this.passedTests + this.failedTests}`);
    console.log(`Passed: ${this.passedTests}`);
    console.log(`Failed: ${this.failedTests}`);
    console.log(`Success Rate: ${Math.round((this.passedTests / (this.passedTests + this.failedTests)) * 100)}%`);
    
    if (this.failedTests > 0) {
      console.log('\n❌ Failed Tests:');
      this.testResults.filter(r => r.status === 'FAIL').forEach(result => {
        console.log(`  - ${result.name}: ${result.error}`);
      });
    }
  }
}

// Make it available globally
window.IntegrationTests = IntegrationTests;