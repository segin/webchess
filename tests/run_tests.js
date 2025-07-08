#!/usr/bin/env node

/**
 * Node.js Test Runner for WebChess
 * Runs basic validation tests that can be executed in Node.js environment
 */

const fs = require('fs');
const path = require('path');

class NodeTestRunner {
  constructor() {
    this.testResults = [];
    this.passedTests = 0;
    this.failedTests = 0;
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

  async runAllTests() {
    console.log('🧪 WebChess Node.js Test Suite\n');
    
    await this.testFileStructure();
    await this.testConfigurationFiles();
    await this.testServerFiles();
    await this.testClientFiles();
    await this.testAssets();
    
    this.generateReport();
    
    // Exit with appropriate code
    process.exit(this.failedTests > 0 ? 1 : 0);
  }

  async testFileStructure() {
    console.log('📁 Testing File Structure...');
    
    await this.runTest('Project root structure', () => {
      const requiredFiles = [
        'package.json',
        'src/server/index.js',
        'src/server/gameManager.js',
        'public/index.html',
        'public/script.js',
        'public/styles.css'
      ];
      
      requiredFiles.forEach(file => {
        const filePath = path.join(__dirname, '..', file);
        if (!fs.existsSync(filePath)) {
          throw new Error(`Required file missing: ${file}`);
        }
      });
    });

    await this.runTest('Test directory structure', () => {
      const testFiles = [
        'tests/test_client.js',
        'tests/test_game_logic.js',
        'tests/run_tests.html',
        'tests/run_tests.js'
      ];
      
      testFiles.forEach(file => {
        const filePath = path.join(__dirname, '..', file);
        if (!fs.existsSync(filePath)) {
          throw new Error(`Test file missing: ${file}`);
        }
      });
    });

    await this.runTest('Deployment directory exists', () => {
      const deploymentDir = path.join(__dirname, '..', 'deployment');
      if (!fs.existsSync(deploymentDir)) {
        throw new Error('Deployment directory missing');
      }
    });
  }

  async testConfigurationFiles() {
    console.log('\n⚙️ Testing Configuration Files...');
    
    await this.runTest('package.json validation', () => {
      const packagePath = path.join(__dirname, '..', 'package.json');
      const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      
      if (!packageData.name) {
        throw new Error('package.json missing name field');
      }
      
      if (!packageData.main) {
        throw new Error('package.json missing main field');
      }
      
      if (!packageData.dependencies) {
        throw new Error('package.json missing dependencies');
      }
      
      const requiredDeps = ['express', 'socket.io'];
      requiredDeps.forEach(dep => {
        if (!packageData.dependencies[dep]) {
          throw new Error(`Missing required dependency: ${dep}`);
        }
      });
    });

    await this.runTest('.gitignore validation', () => {
      const gitignorePath = path.join(__dirname, '..', '.gitignore');
      if (fs.existsSync(gitignorePath)) {
        const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
        
        if (!gitignoreContent.includes('node_modules')) {
          throw new Error('.gitignore should include node_modules');
        }
      } else {
        throw new Error('.gitignore file missing');
      }
    });
  }

  async testServerFiles() {
    console.log('\n🖥️ Testing Server Files...');
    
    await this.runTest('Server index.js syntax', () => {
      const serverPath = path.join(__dirname, '..', 'src/server/index.js');
      const serverContent = fs.readFileSync(serverPath, 'utf8');
      
      // Basic syntax checks
      if (!serverContent.includes('express')) {
        throw new Error('Server should use Express');
      }
      
      if (!serverContent.includes('socket.io')) {
        throw new Error('Server should use Socket.IO');
      }
      
      if (!serverContent.includes('server.listen')) {
        throw new Error('Server should have listen call');
      }
    });

    await this.runTest('GameManager.js exists and has basic structure', () => {
      const gameManagerPath = path.join(__dirname, '..', 'src/server/gameManager.js');
      const gameManagerContent = fs.readFileSync(gameManagerPath, 'utf8');
      
      if (!gameManagerContent.includes('class GameManager')) {
        throw new Error('GameManager should be a class');
      }
      
      if (!gameManagerContent.includes('createGame')) {
        throw new Error('GameManager should have createGame method');
      }
    });

    await this.runTest('Shared modules exist', () => {
      const sharedFiles = [
        'src/shared/chessGame.js',
        'src/shared/chessAI.js'
      ];
      
      sharedFiles.forEach(file => {
        const filePath = path.join(__dirname, '..', file);
        if (!fs.existsSync(filePath)) {
          throw new Error(`Shared module missing: ${file}`);
        }
      });
    });
  }

  async testClientFiles() {
    console.log('\n🌐 Testing Client Files...');
    
    await this.runTest('HTML structure validation', () => {
      const htmlPath = path.join(__dirname, '..', 'public/index.html');
      const htmlContent = fs.readFileSync(htmlPath, 'utf8');
      
      const requiredElements = [
        'main-menu',
        'game-screen',
        'chess-board',
        'chat-section',
        'mobile-chat-overlay'
      ];
      
      requiredElements.forEach(elementId => {
        if (!htmlContent.includes(`id="${elementId}"`)) {
          throw new Error(`HTML missing required element: ${elementId}`);
        }
      });
      
      // Check for mobile meta tags
      if (!htmlContent.includes('viewport')) {
        throw new Error('HTML missing viewport meta tag');
      }
    });

    await this.runTest('JavaScript structure validation', () => {
      const jsPath = path.join(__dirname, '..', 'public/script.js');
      const jsContent = fs.readFileSync(jsPath, 'utf8');
      
      if (!jsContent.includes('class WebChessClient')) {
        throw new Error('JavaScript should have WebChessClient class');
      }
      
      if (!jsContent.includes('class ChessAI')) {
        throw new Error('JavaScript should have ChessAI class');
      }
      
      // Check for mobile functionality
      if (!jsContent.includes('toggleMobileChat')) {
        throw new Error('JavaScript should have mobile chat functionality');
      }
      
      if (!jsContent.includes('toggleFullscreen')) {
        throw new Error('JavaScript should have fullscreen functionality');
      }
    });

    await this.runTest('CSS structure validation', () => {
      const cssPath = path.join(__dirname, '..', 'public/styles.css');
      const cssContent = fs.readFileSync(cssPath, 'utf8');
      
      // Check for responsive design
      if (!cssContent.includes('@media')) {
        throw new Error('CSS should include media queries for responsive design');
      }
      
      // Check for mobile classes
      if (!cssContent.includes('mobile-only')) {
        throw new Error('CSS should include mobile-only utility class');
      }
      
      if (!cssContent.includes('mobile-chat-overlay')) {
        throw new Error('CSS should include mobile chat overlay styles');
      }
      
      // Check for chess board styles
      if (!cssContent.includes('chess-board')) {
        throw new Error('CSS should include chess board styles');
      }
    });
  }

  async testAssets() {
    console.log('\n📄 Testing Assets and Documentation...');
    
    await this.runTest('CLAUDE.md exists', () => {
      const claudePath = path.join(__dirname, '..', 'CLAUDE.md');
      if (fs.existsSync(claudePath)) {
        const claudeContent = fs.readFileSync(claudePath, 'utf8');
        if (claudeContent.length < 100) {
          throw new Error('CLAUDE.md appears to be empty or too short');
        }
      } else {
        console.warn('⚠️ CLAUDE.md not found (optional)');
      }
    });

    await this.runTest('Test files are valid JavaScript', () => {
      const testFiles = [
        'tests/test_client.js',
        'tests/test_game_logic.js'
      ];
      
      testFiles.forEach(file => {
        const filePath = path.join(__dirname, '..', file);
        const fileContent = fs.readFileSync(filePath, 'utf8');
        
        // Basic JavaScript syntax check
        if (!fileContent.includes('class ') || !fileContent.includes('constructor')) {
          throw new Error(`Test file ${file} appears to have invalid JavaScript structure`);
        }
      });
    });
  }

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
    
    console.log('\n✅ Node.js test suite completed!');
    
    if (this.failedTests === 0) {
      console.log('\n🎉 All tests passed! Ready for browser testing.');
      console.log('💡 Run "npm run test:browser" for comprehensive client-side tests.');
    }
    
    return this.failedTests === 0;
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const runner = new NodeTestRunner();
  runner.runAllTests();
}

module.exports = NodeTestRunner;