#!/usr/bin/env node

/**
 * Test Infrastructure Validation Script
 * Validates the health and configuration of the WebChess test infrastructure
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class TestInfrastructureValidator {
  constructor() {
    this.results = {
      passed: [],
      failed: [],
      warnings: []
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : '✅';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  addResult(test, passed, message) {
    const result = { test, message, timestamp: new Date().toISOString() };
    if (passed) {
      this.results.passed.push(result);
      this.log(`${test}: ${message}`, 'info');
    } else {
      this.results.failed.push(result);
      this.log(`${test}: ${message}`, 'error');
    }
  }

  addWarning(test, message) {
    const result = { test, message, timestamp: new Date().toISOString() };
    this.results.warnings.push(result);
    this.log(`${test}: ${message}`, 'warning');
  }

  validateFileExists(filePath, description) {
    const exists = fs.existsSync(filePath);
    this.addResult(
      `File Existence: ${description}`,
      exists,
      exists ? `Found: ${filePath}` : `Missing: ${filePath}`
    );
    return exists;
  }

  validateDirectoryStructure() {
    this.log('Validating directory structure...', 'info');
    
    const requiredDirs = [
      'tests',
      'tests/utils',
      'tests/helpers',
      'src/shared',
      'scripts'
    ];

    requiredDirs.forEach(dir => {
      const exists = fs.existsSync(dir);
      this.addResult(
        'Directory Structure',
        exists,
        exists ? `Directory exists: ${dir}` : `Missing directory: ${dir}`
      );
    });
  }

  validateCoreFiles() {
    this.log('Validating core test files...', 'info');
    
    const coreFiles = [
      { path: 'tests/utils/errorSuppression.js', desc: 'Error Suppression Utilities' },
      { path: 'tests/setup.js', desc: 'Test Setup Configuration' },
      { path: 'jest.config.js', desc: 'Jest Configuration' },
      { path: 'package.json', desc: 'Package Configuration' },
      { path: 'src/shared/chessGame.js', desc: 'Chess Game Logic' },
      { path: 'src/shared/gameState.js', desc: 'Game State Manager' },
      { path: 'public/test-runner.html', desc: 'Browser Test Runner' }
    ];

    coreFiles.forEach(file => {
      this.validateFileExists(file.path, file.desc);
    });
  }

  validateTestFiles() {
    this.log('Validating test file organization...', 'info');
    
    try {
      const testFiles = fs.readdirSync('tests')
        .filter(file => file.endsWith('.test.js'))
        .sort();

      this.addResult(
        'Test File Count',
        testFiles.length > 0,
        `Found ${testFiles.length} test files`
      );

      // Check for key test categories
      const expectedCategories = [
        'chessGame.test.js',
        'gameState.test.js',
        'errorHandling.test.js',
        'performanceTests.test.js',
        'integrationTests.test.js',
        'browserCompatible.test.js'
      ];

      expectedCategories.forEach(category => {
        const exists = testFiles.includes(category);
        this.addResult(
          'Test Category Coverage',
          exists,
          exists ? `Found: ${category}` : `Missing: ${category}`
        );
      });

      // Check for comprehensive test files
      const comprehensiveFiles = testFiles.filter(file => 
        file.includes('Comprehensive') || file.includes('Expansion')
      );
      
      this.addResult(
        'Comprehensive Test Coverage',
        comprehensiveFiles.length > 0,
        `Found ${comprehensiveFiles.length} comprehensive test files`
      );

    } catch (error) {
      this.addResult(
        'Test File Validation',
        false,
        `Error reading test directory: ${error.message}`
      );
    }
  }

  validateJestConfiguration() {
    this.log('Validating Jest configuration...', 'info');
    
    try {
      const jestConfig = require(path.resolve('jest.config.js'));
      
      // Check essential configuration
      const requiredConfig = {
        testEnvironment: 'node',
        testMatch: Array.isArray(jestConfig.testMatch) && jestConfig.testMatch.length > 0,
        collectCoverageFrom: Array.isArray(jestConfig.collectCoverageFrom),
        coverageThreshold: typeof jestConfig.coverageThreshold === 'object'
      };

      Object.entries(requiredConfig).forEach(([key, expected]) => {
        const actual = jestConfig[key];
        const isValid = typeof expected === 'boolean' ? expected : actual === expected;
        
        this.addResult(
          'Jest Configuration',
          isValid,
          isValid ? `${key} properly configured` : `${key} configuration issue`
        );
      });

    } catch (error) {
      this.addResult(
        'Jest Configuration',
        false,
        `Error loading Jest config: ${error.message}`
      );
    }
  }

  validatePackageJson() {
    this.log('Validating package.json test scripts...', 'info');
    
    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      
      const requiredScripts = [
        'test',
        'test:watch'
      ];

      requiredScripts.forEach(script => {
        const exists = packageJson.scripts && packageJson.scripts[script];
        this.addResult(
          'Package Scripts',
          exists,
          exists ? `Script exists: ${script}` : `Missing script: ${script}`
        );
      });

      // Check for Jest dependency
      const hasJest = (packageJson.devDependencies && packageJson.devDependencies.jest) ||
                     (packageJson.dependencies && packageJson.dependencies.jest);
      
      this.addResult(
        'Jest Dependency',
        hasJest,
        hasJest ? 'Jest dependency found' : 'Jest dependency missing'
      );

    } catch (error) {
      this.addResult(
        'Package.json Validation',
        false,
        `Error reading package.json: ${error.message}`
      );
    }
  }

  validateErrorSuppressionUtility() {
    this.log('Validating error suppression utility...', 'info');
    
    try {
      const errorSuppressionPath = 'tests/utils/errorSuppression.js';
      if (fs.existsSync(errorSuppressionPath)) {
        const { testUtils, TestErrorSuppression } = require(path.resolve(errorSuppressionPath));
        
        // Check for required methods
        const requiredMethods = [
          'suppressErrorLogs',
          'restoreErrorLogs',
          'validateErrorResponse',
          'validateSuccessResponse',
          'createFreshGame'
        ];

        requiredMethods.forEach(method => {
          const exists = typeof testUtils[method] === 'function';
          this.addResult(
            'Error Suppression Utility',
            exists,
            exists ? `Method exists: ${method}` : `Missing method: ${method}`
          );
        });

        // Check TestErrorSuppression class
        const hasClass = typeof TestErrorSuppression === 'function';
        this.addResult(
          'Error Suppression Class',
          hasClass,
          hasClass ? 'TestErrorSuppression class available' : 'TestErrorSuppression class missing'
        );

      } else {
        this.addResult(
          'Error Suppression Utility',
          false,
          'Error suppression utility file not found'
        );
      }
    } catch (error) {
      this.addResult(
        'Error Suppression Utility',
        false,
        `Error loading error suppression utility: ${error.message}`
      );
    }
  }

  validateChessGameLogic() {
    this.log('Validating chess game logic...', 'info');
    
    try {
      const ChessGame = require(path.resolve('src/shared/chessGame.js'));
      const game = new ChessGame();
      
      // Test basic functionality
      const initialState = game.getGameState();
      this.addResult(
        'Chess Game Logic',
        initialState && typeof initialState === 'object',
        'Chess game initializes correctly'
      );

      // Test move validation
      const moveResult = game.makeMove({
        from: { row: 6, col: 4 },
        to: { row: 4, col: 4 }
      });
      
      this.addResult(
        'Move Validation',
        moveResult && typeof moveResult.success === 'boolean',
        'Move validation returns structured response'
      );

    } catch (error) {
      this.addResult(
        'Chess Game Logic',
        false,
        `Error testing chess game logic: ${error.message}`
      );
    }
  }

  async validateTestExecution() {
    this.log('Validating test execution (quick check)...', 'info');
    
    try {
      // Run a quick test to check if Jest can execute
      const result = execSync('npm test -- --testNamePattern="should initialize" --passWithNoTests', {
        encoding: 'utf8',
        timeout: 30000,
        stdio: 'pipe'
      });
      
      this.addResult(
        'Test Execution',
        true,
        'Jest can execute tests successfully'
      );
      
    } catch (error) {
      this.addResult(
        'Test Execution',
        false,
        `Test execution failed: ${error.message}`
      );
    }
  }

  validateCoverageConfiguration() {
    this.log('Validating coverage configuration...', 'info');
    
    try {
      const jestConfig = require(path.resolve('jest.config.js'));
      
      // Check coverage configuration
      const hasCoverageConfig = jestConfig.collectCoverageFrom && 
                               Array.isArray(jestConfig.collectCoverageFrom);
      
      this.addResult(
        'Coverage Configuration',
        hasCoverageConfig,
        hasCoverageConfig ? 'Coverage collection configured' : 'Coverage configuration missing'
      );

      const hasThresholds = jestConfig.coverageThreshold && 
                           jestConfig.coverageThreshold.global;
      
      this.addResult(
        'Coverage Thresholds',
        hasThresholds,
        hasThresholds ? 'Coverage thresholds configured' : 'Coverage thresholds missing'
      );

    } catch (error) {
      this.addResult(
        'Coverage Configuration',
        false,
        `Error validating coverage config: ${error.message}`
      );
    }
  }

  generateReport() {
    this.log('\n=== TEST INFRASTRUCTURE VALIDATION REPORT ===', 'info');
    
    const totalTests = this.results.passed.length + this.results.failed.length;
    const passRate = totalTests > 0 ? (this.results.passed.length / totalTests * 100).toFixed(1) : 0;
    
    console.log(`\n📊 Summary:`);
    console.log(`   Total Validations: ${totalTests}`);
    console.log(`   Passed: ${this.results.passed.length}`);
    console.log(`   Failed: ${this.results.failed.length}`);
    console.log(`   Warnings: ${this.results.warnings.length}`);
    console.log(`   Pass Rate: ${passRate}%`);

    if (this.results.failed.length > 0) {
      console.log(`\n❌ Failed Validations:`);
      this.results.failed.forEach(result => {
        console.log(`   - ${result.test}: ${result.message}`);
      });
    }

    if (this.results.warnings.length > 0) {
      console.log(`\n⚠️  Warnings:`);
      this.results.warnings.forEach(result => {
        console.log(`   - ${result.test}: ${result.message}`);
      });
    }

    if (this.results.passed.length > 0) {
      console.log(`\n✅ Passed Validations:`);
      this.results.passed.forEach(result => {
        console.log(`   - ${result.test}: ${result.message}`);
      });
    }

    // Overall health assessment
    const isHealthy = this.results.failed.length === 0;
    const healthStatus = isHealthy ? '🟢 HEALTHY' : '🔴 NEEDS ATTENTION';
    
    console.log(`\n🏥 Infrastructure Health: ${healthStatus}`);
    
    if (!isHealthy) {
      console.log(`\n📋 Recommended Actions:`);
      console.log(`   1. Review failed validations above`);
      console.log(`   2. Consult TEST_TROUBLESHOOTING_GUIDE.md`);
      console.log(`   3. Fix critical issues before running tests`);
      console.log(`   4. Re-run this validation script after fixes`);
    }

    return isHealthy;
  }

  async runAllValidations() {
    this.log('Starting test infrastructure validation...', 'info');
    
    this.validateDirectoryStructure();
    this.validateCoreFiles();
    this.validateTestFiles();
    this.validateJestConfiguration();
    this.validatePackageJson();
    this.validateErrorSuppressionUtility();
    this.validateChessGameLogic();
    this.validateCoverageConfiguration();
    
    // Test execution validation (optional, can be slow)
    if (process.argv.includes('--include-execution-test')) {
      await this.validateTestExecution();
    } else {
      this.addWarning(
        'Test Execution',
        'Skipped (use --include-execution-test to enable)'
      );
    }
    
    return this.generateReport();
  }
}

// Main execution
if (require.main === module) {
  const validator = new TestInfrastructureValidator();
  
  validator.runAllValidations()
    .then(isHealthy => {
      process.exit(isHealthy ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Validation script failed:', error.message);
      process.exit(1);
    });
}

module.exports = TestInfrastructureValidator;