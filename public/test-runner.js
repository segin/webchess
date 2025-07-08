/**
 * Dynamic Test Runner for WebChess
 * Creates a test UI overlay without modifying the main HTML
 */

class DynamicTestRunner {
  constructor() {
    this.testOverlay = null;
    this.testResults = [];
    this.passedTests = 0;
    this.failedTests = 0;
    this.isRunning = false;
    
    // Initialize test suites
    this.clientSuite = new WebChessTestSuite();
    this.logicSuite = new GameLogicTestSuite();
    this.unitSuite = new ComprehensiveUnitTests();
    this.integrationSuite = typeof IntegrationTests === 'function' ? new IntegrationTests() : null;
  }

  // Create the test UI overlay
  createTestUI() {
    if (this.testOverlay) {
      this.testOverlay.remove();
    }

    this.testOverlay = document.createElement('div');
    this.testOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.9);
      z-index: 10000;
      display: flex;
      flex-direction: column;
      font-family: 'Courier New', monospace;
      color: #00ff00;
      overflow: hidden;
    `;

    this.testOverlay.innerHTML = `
      <div style="display: flex; height: 100%; flex-direction: column;">
        <!-- Header -->
        <div style="background: #1a1a1a; padding: 20px; border-bottom: 2px solid #00ccff; flex-shrink: 0;">
          <h1 style="margin: 0; color: #00ccff; text-align: center; font-size: 1.5rem;">
            🧪 WebChess Test Suite
          </h1>
          <div style="text-align: center; margin-top: 10px;">
            <button id="close-tests" style="background: #aa0000; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-right: 10px;">
              ✕ Close
            </button>
            <button id="run-all-tests" style="background: #00aa00; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-right: 10px;" ${this.isRunning ? 'disabled' : ''}>
              🚀 Run All Tests
            </button>
            <button id="clear-results" style="background: #666; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
              🗑️ Clear
            </button>
          </div>
        </div>

        <!-- Test Controls -->
        <div style="background: #2a2a2a; padding: 15px; border-bottom: 1px solid #444; flex-shrink: 0;">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px;">
            <button id="run-client-tests" class="test-btn" ${this.isRunning ? 'disabled' : ''}>📱 Client Tests</button>
            <button id="run-logic-tests" class="test-btn" ${this.isRunning ? 'disabled' : ''}>♟️ Game Logic</button>
            <button id="run-unit-tests" class="test-btn" ${this.isRunning ? 'disabled' : ''}>🧪 Unit Tests (100+)</button>
            <button id="run-integration-tests" class="test-btn" ${this.isRunning ? 'disabled' : ''}>🔄 Integration</button>
          </div>
        </div>

        <!-- Results Area -->
        <div style="flex: 1; display: flex; overflow: hidden;">
          <!-- Test Results (Left Side) -->
          <div style="flex: 2; display: flex; flex-direction: column; border-right: 2px solid #444;">
            <!-- Status Bar -->
            <div id="test-status" style="background: #333; padding: 10px; color: #fff; font-weight: bold; flex-shrink: 0;">
              Ready to run tests
            </div>
            
            <!-- Results Container -->
            <div id="test-results" style="flex: 1; padding: 20px; overflow-y: auto; background: #1a1a1a; white-space: pre-wrap; font-size: 14px; line-height: 1.4;">
              Welcome to the WebChess Test Suite!
            
Click "Run All Tests" to execute the complete test suite, or run individual test categories.

Available Test Suites:
• Client Tests - DOM validation, UI components, mobile functionality
• Game Logic - Chess rules, AI engine, move validation  
• Unit Tests (100+) - Comprehensive component testing
• Integration Tests - Class instantiation and compatibility

Total Coverage: 130+ tests validating all aspects of WebChess.
            </div>
          </div>
          
          <!-- Technical Details Panel (Right Side) -->
          <div style="flex: 1; display: flex; flex-direction: column; background: #0a0a0a;">
            <div style="background: #2a2a2a; padding: 15px; border-bottom: 1px solid #444; display: flex; justify-content: space-between; align-items: center;">
              <h3 style="margin: 0; color: #00ccff; font-size: 1.1rem;">📋 Technical Details</h3>
              <button id="copy-tech-details" style="background: #667eea; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer; font-size: 12px;">
                📋 Copy
              </button>
            </div>
            <div id="tech-details" style="flex: 1; padding: 15px; overflow-y: auto; font-size: 12px; line-height: 1.3; color: #ccc;">
              Loading technical details...
            </div>
          </div>
        </div>
      </div>
    `;

    // Add CSS for test buttons
    const style = document.createElement('style');
    style.textContent = `
      .test-btn {
        background: #667eea;
        color: white;
        border: none;
        padding: 10px 15px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.2s ease;
      }
      .test-btn:hover:not(:disabled) {
        background: #5a6fd8;
        transform: translateY(-1px);
      }
      .test-btn:disabled {
        background: #666;
        cursor: not-allowed;
      }
    `;
    document.head.appendChild(style);

    document.body.appendChild(this.testOverlay);
    this.setupEventListeners();
    this.generateTechnicalDetails();
  }

  setupEventListeners() {
    const closeBtn = this.testOverlay.querySelector('#close-tests');
    const runAllBtn = this.testOverlay.querySelector('#run-all-tests');
    const clearBtn = this.testOverlay.querySelector('#clear-results');
    const copyBtn = this.testOverlay.querySelector('#copy-tech-details');

    closeBtn.addEventListener('click', () => this.closeTestUI());
    runAllBtn.addEventListener('click', () => this.runAllTests());
    clearBtn.addEventListener('click', () => this.clearResults());
    copyBtn.addEventListener('click', () => this.copyTechnicalDetails());

    // Individual test suite buttons
    this.testOverlay.querySelector('#run-client-tests').addEventListener('click', () => this.runClientTests());
    this.testOverlay.querySelector('#run-logic-tests').addEventListener('click', () => this.runLogicTests());
    this.testOverlay.querySelector('#run-unit-tests').addEventListener('click', () => this.runUnitTests());
    this.testOverlay.querySelector('#run-integration-tests').addEventListener('click', () => this.runIntegrationTests());

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.testOverlay) {
        this.closeTestUI();
      }
    });
  }

  closeTestUI() {
    if (this.testOverlay) {
      this.testOverlay.remove();
      this.testOverlay = null;
    }
  }

  clearResults() {
    const resultsDiv = this.testOverlay.querySelector('#test-results');
    resultsDiv.textContent = 'Results cleared. Ready to run tests.';
    this.updateStatus('Ready to run tests');
  }

  updateStatus(message, type = 'info') {
    const statusDiv = this.testOverlay.querySelector('#test-status');
    statusDiv.textContent = message;
    
    const colors = {
      info: '#333',
      running: '#ffaa00',
      success: '#00aa00',
      error: '#aa0000'
    };
    
    statusDiv.style.background = colors[type] || colors.info;
  }

  appendResults(text) {
    const resultsDiv = this.testOverlay.querySelector('#test-results');
    resultsDiv.textContent += text + '\n';
    resultsDiv.scrollTop = resultsDiv.scrollHeight;
  }

  setRunning(isRunning) {
    this.isRunning = isRunning;
    const buttons = this.testOverlay.querySelectorAll('button:not(#close-tests):not(#clear-results)');
    buttons.forEach(btn => btn.disabled = isRunning);
  }

  async runTestSuite(suiteName, testFunction) {
    this.updateStatus(`Running ${suiteName}...`, 'running');
    this.appendResults(`\n🚀 Starting ${suiteName}...`);
    
    // Capture console output
    const originalLog = console.log;
    const logs = [];
    
    console.log = (...args) => {
      const message = args.join(' ');
      logs.push(message);
      this.appendResults(message);
    };

    try {
      const success = await testFunction();
      
      // Parse the console output to check for actual failures
      const hasFailures = logs.some(log => 
        log.includes('❌') || 
        log.includes('Error:') ||
        /\d+\s+failed/i.test(log) && !/failed:\s*0/i.test(log) ||
        /failed:\s*[1-9]/i.test(log) ||
        log.includes('SOME FAILED') ||
        log.includes('TEST FAILED')
      );
      
      // Look for success indicators
      const hasSuccessIndicators = logs.some(log =>
        log.includes('✅') ||
        (log.includes('ALL') && log.includes('PASSED')) ||
        log.includes('100.0%') ||
        /passed:\s*\d+.*failed:\s*0/i.test(log) ||
        /success rate:\s*100/i.test(log) ||
        /failed:\s*0/i.test(log) ||
        log.includes('test suite completed!') ||
        log.includes('ALL TESTS PASSED')
      );
      
      // If the function returned success, no failures in logs, and has success indicators, it passed
      const actualSuccess = success !== false && !hasFailures && (hasSuccessIndicators || logs.length === 0);
      
      this.updateStatus(`${suiteName} completed: ${actualSuccess ? 'PASSED' : 'FAILED'}`, actualSuccess ? 'success' : 'error');
      this.appendResults(`\n✅ ${suiteName} completed: ${actualSuccess ? 'ALL PASSED' : 'SOME FAILED'}`);
      return actualSuccess;
    } catch (error) {
      this.updateStatus(`${suiteName} error: ${error.message}`, 'error');
      this.appendResults(`\n❌ ${suiteName} error: ${error.message}`);
      return false;
    } finally {
      console.log = originalLog;
    }
  }

  async runClientTests() {
    if (this.isRunning) return;
    this.setRunning(true);
    
    try {
      await this.runTestSuite('Client Tests', () => this.clientSuite.runAllTests());
    } finally {
      this.setRunning(false);
    }
  }

  async runLogicTests() {
    if (this.isRunning) return;
    this.setRunning(true);
    
    try {
      await this.runTestSuite('Game Logic Tests', () => this.logicSuite.runAllTests());
    } finally {
      this.setRunning(false);
    }
  }

  async runUnitTests() {
    if (this.isRunning) return;
    this.setRunning(true);
    
    try {
      await this.runTestSuite('Comprehensive Unit Tests', () => this.unitSuite.runAllTests());
    } finally {
      this.setRunning(false);
    }
  }

  async runIntegrationTests() {
    if (this.isRunning) return;
    this.setRunning(true);
    
    try {
      await this.runTestSuite('Integration Tests', () => this.runDOMIntegrationTests());
    } finally {
      this.setRunning(false);
    }
  }

  async runBasicIntegrationTests() {
    this.appendResults('\n🔄 Integration Tests:');
    
    const tests = [
      {
        name: 'WebChessClient class instantiation',
        test: () => {
          if (typeof WebChessClient !== 'function') {
            throw new Error('WebChessClient class not found');
          }
          return true;
        }
      },
      {
        name: 'ChessAI class instantiation',
        test: () => {
          if (typeof ChessAI !== 'function') {
            throw new Error('ChessAI class not found');
          }
          const ai = new ChessAI('medium');
          return ai instanceof ChessAI && ai.difficulty === 'medium';
        }
      },
      {
        name: 'DOM manipulation functions',
        test: () => {
          return typeof document.getElementById === 'function' &&
                 typeof document.createElement === 'function';
        }
      },
      {
        name: 'Socket.IO availability',
        test: () => {
          return typeof io === 'function';
        }
      },
      {
        name: 'LocalStorage functionality',
        test: () => {
          const testKey = 'webchess-integration-test';
          const testValue = 'test-data';
          localStorage.setItem(testKey, testValue);
          const retrieved = localStorage.getItem(testKey);
          localStorage.removeItem(testKey);
          return retrieved === testValue;
        }
      }
    ];

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
      try {
        const result = test.test();
        if (result) {
          this.appendResults(`✅ ${test.name}`);
          passed++;
        } else {
          this.appendResults(`❌ ${test.name}: Test returned false`);
          failed++;
        }
      } catch (error) {
        this.appendResults(`❌ ${test.name}: ${error.message}`);
        failed++;
      }
    }

    this.appendResults(`\nIntegration Tests: ${passed} passed, ${failed} failed`);
    return failed === 0;
  }

  async runDOMIntegrationTests() {
    this.appendResults('\n🔄 DOM Integration Tests:');
    
    if (typeof IntegrationTests !== 'function') {
      this.appendResults('❌ IntegrationTests class not found');
      return false;
    }
    
    // Create integration test suite
    const integrationSuite = new IntegrationTests();
    
    // Override console.log to capture output
    const originalLog = console.log;
    const logBuffer = [];
    console.log = (...args) => {
      logBuffer.push(args.join(' '));
      originalLog(...args);
    };
    
    try {
      // Run the integration tests
      await integrationSuite.runAllTests();
      
      // Display captured output
      logBuffer.forEach(line => {
        this.appendResults(line);
      });
      
      // Return success based on test results
      return integrationSuite.failedTests === 0;
    } catch (error) {
      this.appendResults(`❌ Integration test execution failed: ${error.message}`);
      return false;
    } finally {
      // Restore console.log
      console.log = originalLog;
    }
  }

  async runAllTests() {
    if (this.isRunning) return;
    this.setRunning(true);
    
    this.clearResults();
    this.updateStatus('Running comprehensive test suite...', 'running');
    this.appendResults('🧪 WebChess Comprehensive Test Suite');
    this.appendResults('=====================================\n');

    const startTime = Date.now();
    const results = {};

    try {
      // Run all test suites
      results.client = await this.runTestSuite('Client Tests', () => this.clientSuite.runAllTests());
      results.logic = await this.runTestSuite('Game Logic Tests', () => this.logicSuite.runAllTests());
      results.unit = await this.runTestSuite('Comprehensive Unit Tests', () => this.unitSuite.runAllTests());
      results.integration = await this.runTestSuite('Integration Tests', () => this.runBasicIntegrationTests());

      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);

      // Generate final report
      this.appendResults('\n' + '='.repeat(50));
      this.appendResults('📊 FINAL TEST RESULTS');
      this.appendResults('='.repeat(50));
      this.appendResults(`Client Tests: ${results.client ? 'PASSED' : 'FAILED'}`);
      this.appendResults(`Logic Tests: ${results.logic ? 'PASSED' : 'FAILED'}`);
      this.appendResults(`Unit Tests: ${results.unit ? 'PASSED' : 'FAILED'}`);
      this.appendResults(`Integration Tests: ${results.integration ? 'PASSED' : 'FAILED'}`);
      this.appendResults(`\nTotal Duration: ${duration} seconds`);

      const allPassed = Object.values(results).every(result => result);
      
      if (allPassed) {
        this.appendResults('\n🎉 ALL TESTS PASSED! 🎉');
        this.appendResults('WebChess is ready for deployment.');
        this.updateStatus('All tests passed!', 'success');
      } else {
        this.appendResults('\n⚠️ SOME TESTS FAILED ⚠️');
        this.appendResults('Please review failed tests above.');
        this.updateStatus('Some tests failed', 'error');
      }

    } catch (error) {
      this.appendResults(`\n💥 Test suite error: ${error.message}`);
      this.updateStatus('Test suite error', 'error');
    } finally {
      this.setRunning(false);
    }
  }

  generateTechnicalDetails() {
    const techDetails = this.testOverlay.querySelector('#tech-details');
    
    const details = this.collectSystemInfo();
    
    techDetails.innerHTML = `
      <div style="font-family: monospace; white-space: pre-wrap; color: #00ff00;">
${details}
      </div>
    `;
  }

  collectSystemInfo() {
    const currentTime = new Date().toISOString();
    const userAgent = navigator.userAgent;
    const platform = navigator.platform;
    const language = navigator.language;
    const cookiesEnabled = navigator.cookieEnabled;
    const onlineStatus = navigator.onLine;
    
    // Screen and viewport info
    const screenInfo = {
      resolution: `${screen.width}x${screen.height}`,
      availableResolution: `${screen.availWidth}x${screen.availHeight}`,
      colorDepth: screen.colorDepth,
      pixelRatio: window.devicePixelRatio || 1
    };
    
    const viewportInfo = {
      width: window.innerWidth,
      height: window.innerHeight,
      documentWidth: document.documentElement.clientWidth,
      documentHeight: document.documentElement.clientHeight
    };

    // Browser capabilities
    const browserFeatures = {
      localStorage: !!window.localStorage,
      sessionStorage: !!window.sessionStorage,
      webSockets: !!window.WebSocket,
      webGL: !!window.WebGLRenderingContext,
      fullscreenAPI: !!(document.documentElement.requestFullscreen || 
                       document.documentElement.webkitRequestFullscreen ||
                       document.documentElement.mozRequestFullScreen),
      notifications: !!window.Notification,
      geolocation: !!navigator.geolocation,
      serviceWorkers: !!navigator.serviceWorker
    };

    // WebChess specific info
    const webChessInfo = {
      socketIOAvailable: typeof io !== 'undefined',
      webChessClientAvailable: typeof WebChessClient !== 'undefined',
      chessAIAvailable: typeof ChessAI !== 'undefined',
      testSuitesLoaded: {
        clientSuite: typeof WebChessTestSuite !== 'undefined',
        logicSuite: typeof GameLogicTestSuite !== 'undefined',
        unitSuite: typeof ComprehensiveUnitTests !== 'undefined'
      }
    };

    // Performance info
    const performanceInfo = {
      memoryUsage: navigator.deviceMemory ? `${navigator.deviceMemory}GB` : 'Unknown',
      connectionType: navigator.connection ? navigator.connection.effectiveType : 'Unknown',
      loadTime: performance.timing ? `${performance.timing.loadEventEnd - performance.timing.navigationStart}ms` : 'Unknown'
    };

    return `# WebChess Technical Report
Generated: ${currentTime}

## System Information
- User Agent: ${userAgent}
- Platform: ${platform}
- Language: ${language}
- Cookies Enabled: ${cookiesEnabled}
- Online Status: ${onlineStatus}

## Display Information
- Screen Resolution: ${screenInfo.resolution}
- Available Resolution: ${screenInfo.availableResolution}
- Color Depth: ${screenInfo.colorDepth}
- Pixel Ratio: ${screenInfo.pixelRatio}
- Viewport: ${viewportInfo.width}x${viewportInfo.height}
- Document Size: ${viewportInfo.documentWidth}x${viewportInfo.documentHeight}

## Browser Capabilities
- Local Storage: ${browserFeatures.localStorage}
- Session Storage: ${browserFeatures.sessionStorage}
- WebSockets: ${browserFeatures.webSockets}
- WebGL: ${browserFeatures.webGL}
- Fullscreen API: ${browserFeatures.fullscreenAPI}
- Notifications: ${browserFeatures.notifications}
- Geolocation: ${browserFeatures.geolocation}
- Service Workers: ${browserFeatures.serviceWorkers}

## WebChess Application Status
- Socket.IO Available: ${webChessInfo.socketIOAvailable}
- WebChessClient Available: ${webChessInfo.webChessClientAvailable}
- ChessAI Available: ${webChessInfo.chessAIAvailable}
- Client Test Suite: ${webChessInfo.testSuitesLoaded.clientSuite}
- Logic Test Suite: ${webChessInfo.testSuitesLoaded.logicSuite}
- Unit Test Suite: ${webChessInfo.testSuitesLoaded.unitSuite}

## Performance Metrics
- Device Memory: ${performanceInfo.memoryUsage}
- Connection Type: ${performanceInfo.connectionType}
- Page Load Time: ${performanceInfo.loadTime}

## Test Suite Coverage
- Total Test Categories: 12
- Estimated Total Tests: 130+
- Test Types: UI Components, Game Logic, AI Engine, Mobile Functionality, Session Management, Socket Communication, Error Handling, Data Validation

## Notable Features Tested
- Chess game mechanics and rule validation
- AI engine with multiple difficulty levels
- Mobile responsive design and touch interfaces
- Real-time multiplayer communication via Socket.IO
- Practice mode with AI opponents
- Session persistence and resume functionality
- Chat system with ephemeral server-side storage
- Comprehensive error handling and validation

## Browser Compatibility Notes
- Requires ES6+ support for classes and modern JavaScript
- WebSocket support required for multiplayer functionality
- Local Storage required for session persistence
- Touch events support for optimal mobile experience
- Fullscreen API support for mobile fullscreen feature

---
This technical report can be copied and pasted into development chats for debugging and analysis purposes.`;
  }

  copyTechnicalDetails() {
    const techDetails = this.collectSystemInfo();
    
    navigator.clipboard.writeText(techDetails).then(() => {
      const copyBtn = this.testOverlay.querySelector('#copy-tech-details');
      const originalText = copyBtn.textContent;
      
      copyBtn.textContent = '✅ Copied!';
      copyBtn.style.background = '#00aa00';
      
      setTimeout(() => {
        copyBtn.textContent = originalText;
        copyBtn.style.background = '#667eea';
      }, 2000);
    }).catch(err => {
      console.error('Failed to copy: ', err);
      
      // Fallback: select text
      const techDetailsElement = this.testOverlay.querySelector('#tech-details');
      const range = document.createRange();
      range.selectNodeContents(techDetailsElement);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      
      alert('Copy failed. Text has been selected - please copy manually.');
    });
  }
}

// Global test runner instance
let globalTestRunner = null;

// Initialize test runner when the page loads
document.addEventListener('DOMContentLoaded', () => {
  // Only show test button on main menu
  const updateTestButtonVisibility = () => {
    const testBtn = document.getElementById('run-tests-btn');
    const mainMenu = document.getElementById('main-menu');
    
    if (testBtn && mainMenu) {
      // Show test button only when main menu is visible
      const isMainMenuVisible = !mainMenu.classList.contains('hidden');
      testBtn.style.display = isMainMenuVisible ? 'block' : 'none';
    }
  };

  // Set up test button click handler
  const testBtn = document.getElementById('run-tests-btn');
  if (testBtn) {
    testBtn.addEventListener('click', () => {
      if (!globalTestRunner) {
        globalTestRunner = new DynamicTestRunner();
      }
      globalTestRunner.createTestUI();
    });
  }

  // Monitor screen changes to show/hide test button
  const observer = new MutationObserver(() => {
    updateTestButtonVisibility();
  });

  const mainElement = document.querySelector('main');
  if (mainElement) {
    observer.observe(mainElement, { 
      childList: true, 
      subtree: true, 
      attributes: true, 
      attributeFilter: ['class'] 
    });
  }

  // Initial visibility update
  updateTestButtonVisibility();
});