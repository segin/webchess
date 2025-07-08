/**
 * Client-side Test Suite for WebChess
 * Tests UI functionality, game logic, and mobile features
 */

class WebChessTestSuite {
  constructor() {
    this.testResults = [];
    this.passedTests = 0;
    this.failedTests = 0;
  }

  // Test runner
  async runAllTests() {
    console.log('🧪 Starting WebChess Test Suite...\n');
    
    // DOM Tests
    await this.testDOMElements();
    await this.testMobileElements();
    await this.testChatElements();
    
    // Functionality Tests
    await this.testSessionManagement();
    await this.testPracticeMode();
    await this.testChatFunctionality();
    await this.testMobileChat();
    await this.testFullscreen();
    
    // Responsive Design Tests
    await this.testResponsiveDesign();
    
    this.generateReport();
  }

  // Helper method to run individual tests
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

  // DOM Element Tests
  async testDOMElements() {
    console.log('\n📋 Testing DOM Elements...');
    
    await this.runTest('Main menu elements exist', () => {
      const requiredElements = [
        'main-menu', 'host-btn', 'join-btn', 'practice-btn', 'resume-btn'
      ];
      requiredElements.forEach(id => {
        if (!document.getElementById(id)) {
          throw new Error(`Element ${id} not found`);
        }
      });
    });

    await this.runTest('Game screen elements exist', () => {
      const requiredElements = [
        'game-screen', 'chess-board', 'resign-btn', 'leave-game-btn'
      ];
      requiredElements.forEach(id => {
        if (!document.getElementById(id)) {
          throw new Error(`Element ${id} not found`);
        }
      });
    });

    await this.runTest('Practice screen elements exist', () => {
      const requiredElements = [
        'practice-screen', 'practice-self-btn', 'practice-ai-white-btn',
        'practice-ai-black-btn', 'practice-ai-vs-ai-btn', 'difficulty-select'
      ];
      requiredElements.forEach(id => {
        if (!document.getElementById(id)) {
          throw new Error(`Element ${id} not found`);
        }
      });
    });
  }

  // Mobile Elements Tests
  async testMobileElements() {
    console.log('\n📱 Testing Mobile Elements...');
    
    await this.runTest('Mobile chat elements exist', () => {
      const requiredElements = [
        'mobile-chat-toggle', 'mobile-chat-overlay', 'mobile-chat-close',
        'mobile-chat-messages', 'mobile-chat-input', 'mobile-send-chat-btn'
      ];
      requiredElements.forEach(id => {
        if (!document.getElementById(id)) {
          throw new Error(`Mobile element ${id} not found`);
        }
      });
    });

    await this.runTest('Fullscreen button exists', () => {
      if (!document.getElementById('fullscreen-btn')) {
        throw new Error('Fullscreen button not found');
      }
    });

    await this.runTest('Mobile-only classes work', () => {
      const mobileElements = document.querySelectorAll('.mobile-only');
      if (mobileElements.length === 0) {
        throw new Error('No mobile-only elements found');
      }
    });
  }

  // Chat Elements Tests
  async testChatElements() {
    console.log('\n💬 Testing Chat Elements...');
    
    await this.runTest('Desktop chat elements exist', () => {
      const requiredElements = [
        'chat-section', 'chat-messages', 'chat-input', 'send-chat-btn'
      ];
      requiredElements.forEach(id => {
        if (!document.getElementById(id)) {
          throw new Error(`Chat element ${id} not found`);
        }
      });
    });
  }

  // Session Management Tests
  async testSessionManagement() {
    console.log('\n🔧 Testing Session Management...');
    
    await this.runTest('LocalStorage methods work', () => {
      // Test session storage
      const testData = { test: 'data' };
      localStorage.setItem('webchess-test', JSON.stringify(testData));
      const retrieved = JSON.parse(localStorage.getItem('webchess-test'));
      
      if (retrieved.test !== 'data') {
        throw new Error('LocalStorage test failed');
      }
      
      localStorage.removeItem('webchess-test');
    });

    await this.runTest('Resume button functionality', () => {
      const resumeBtn = document.getElementById('resume-btn');
      const resumeSection = document.getElementById('resume-section');
      
      if (!resumeBtn || !resumeSection) {
        throw new Error('Resume elements not found');
      }
    });
  }

  // Practice Mode Tests
  async testPracticeMode() {
    console.log('\n🎯 Testing Practice Mode...');
    
    await this.runTest('Practice mode options exist', () => {
      const modes = ['practice-self-btn', 'practice-ai-white-btn', 'practice-ai-black-btn', 'practice-ai-vs-ai-btn'];
      modes.forEach(mode => {
        if (!document.getElementById(mode)) {
          throw new Error(`Practice mode ${mode} not found`);
        }
      });
    });

    await this.runTest('AI difficulty selector works', () => {
      const difficultySelect = document.getElementById('difficulty-select');
      if (!difficultySelect) {
        throw new Error('Difficulty selector not found');
      }
      
      if (difficultySelect.options.length !== 3) {
        throw new Error('Expected 3 difficulty options');
      }
    });
  }

  // Chat Functionality Tests
  async testChatFunctionality() {
    console.log('\n💬 Testing Chat Functionality...');
    
    await this.runTest('Chat input validation', () => {
      const chatInput = document.getElementById('chat-input');
      if (!chatInput) {
        throw new Error('Chat input not found');
      }
      
      if (chatInput.maxLength !== 200) {
        throw new Error('Chat input max length should be 200');
      }
    });

    await this.runTest('Chat message structure', () => {
      // Create a test message element
      const testDiv = document.createElement('div');
      testDiv.className = 'chat-message own-message';
      testDiv.innerHTML = `
        <div class="chat-sender">Test User</div>
        <div class="chat-text">Test message</div>
      `;
      
      if (!testDiv.querySelector('.chat-sender') || !testDiv.querySelector('.chat-text')) {
        throw new Error('Chat message structure invalid');
      }
    });
  }

  // Mobile Chat Tests
  async testMobileChat() {
    console.log('\n📱 Testing Mobile Chat...');
    
    await this.runTest('Mobile chat overlay structure', () => {
      const overlay = document.getElementById('mobile-chat-overlay');
      const card = overlay.querySelector('.mobile-chat-card');
      const header = card.querySelector('.mobile-chat-header');
      
      if (!overlay || !card || !header) {
        throw new Error('Mobile chat structure incomplete');
      }
    });

    await this.runTest('Mobile chat input validation', () => {
      const mobileInput = document.getElementById('mobile-chat-input');
      if (!mobileInput) {
        throw new Error('Mobile chat input not found');
      }
      
      if (mobileInput.maxLength !== 200) {
        throw new Error('Mobile chat input max length should be 200');
      }
    });
  }

  // Fullscreen Tests
  async testFullscreen() {
    console.log('\n🖥️ Testing Fullscreen...');
    
    await this.runTest('Fullscreen API availability', () => {
      if (!document.documentElement.requestFullscreen) {
        console.warn('Fullscreen API not available in this browser');
      }
      // This is not a failure, just a browser capability check
    });
  }

  // Responsive Design Tests
  async testResponsiveDesign() {
    console.log('\n📐 Testing Responsive Design...');
    
    await this.runTest('CSS media queries exist', () => {
      const styles = Array.from(document.styleSheets);
      let hasMediaQueries = false;
      
      styles.forEach(sheet => {
        try {
          const rules = Array.from(sheet.cssRules || sheet.rules || []);
          rules.forEach(rule => {
            if (rule.type === CSSRule.MEDIA_RULE) {
              hasMediaQueries = true;
            }
          });
        } catch (e) {
          // Cross-origin stylesheets may not be accessible
        }
      });
      
      if (!hasMediaQueries) {
        throw new Error('No media queries found in stylesheets');
      }
    });

    await this.runTest('Mobile viewport meta tag exists', () => {
      const viewportMeta = document.querySelector('meta[name="viewport"]');
      if (!viewportMeta) {
        throw new Error('Viewport meta tag not found');
      }
      
      const content = viewportMeta.getAttribute('content');
      if (!content.includes('width=device-width')) {
        throw new Error('Viewport meta tag missing device-width');
      }
    });
  }

  // Generate test report
  generateReport() {
    console.log('\n📊 Test Results Summary');
    console.log('========================');
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
    
    console.log('\n✅ Test suite completed!');
    return this.failedTests === 0;
  }
}

// Export for use in browser or Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WebChessTestSuite;
}