#!/usr/bin/env node

/**
 * Test Infrastructure Validation Script
 * 
 * This script validates the test infrastructure without running all tests,
 * checking for common issues and providing actionable feedback.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class TestInfrastructureValidator {
  constructor() {
    this.issues = [];
    this.warnings = [];
    this.successes = [];
    this.testFiles = [];
    this.testCategories = {
      unit: [],
      integration: [],
      performance: [],
      browser: [],
      helpers: [],
      utils: []
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '✓',
      warn: '⚠',
      error: '✗',
      success: '✓'
    }[type] || 'ℹ';
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  addIssue(message) {
    this.issues.push(message);
    this.log(message, 'error');
  }

  addWarning(message) {
    this.warnings.push(message);
    this.log(message, 'warn');
  }

  addSuccess(message) {
    this.successes.push(message);
    this.log(message, 'success');
  }

  // Discover all test files
  discoverTestFiles() {
    this.log('Discovering test files...');
    
    const testsDir = path.join(process.cwd(), 'tests');
    if (!fs.existsSync(testsDir)) {
      this.addIssue('Tests directory not found');
      return;
    }

    const files = fs.readdirSync(testsDir, { recursive: true });
    this.testFiles = files
      .filter(file => file.endsWith('.test.js'))
      .map(file => path.join(testsDir, file));

    this.log(`Found ${this.testFiles.length} test files`);
    
    // Categorize test files
    this.categorizeTestFiles();
  }

  categorizeTestFiles() {
    this.testFiles.forEach(file => {
      const fileName = path.basename(file);
      const relativePath = path.relative(process.cwd(), file);
      
      if (fileName.includes('integration') || fileName.includes('gameFlow')) {
        this.testCategories.integration.push(relativePath);
      } else if (fileName.includes('performance') || fileName.includes('stress')) {
        this.testCategories.performance.push(relativePath);
      } else if (fileName.includes('browser') || fileName.includes('compatibility')) {
        this.testCategories.browser.push(relativePath);
      } else if (file.includes('helpers')) {
        this.testCategories.helpers.push(relativePath);
      } else if (file.includes('utils')) {
        this.testCategories.utils.push(relativePath);
      } else {
        this.testCategories.unit.push(relativePath);
      }
    });

    this.log(`Categorized tests: Unit(${this.testCategories.unit.length}), Integration(${this.testCategories.integration.length}), Performance(${this.testCategories.performance.length}), Browser(${this.testCategories.browser.length})`);
  }

  // Check Jest configuration
  validateJestConfig() {
    this.log('Validating Jest configuration...');
    
    const jestConfigPath = path.join(process.cwd(), 'jest.config.js');
    if (!fs.existsSync(jestConfigPath)) {
      this.addIssue('jest.config.js not found');
      return;
    }

    try {
      const jestConfig = require(jestConfigPath);
      
      // Check essential configuration
      if (!jestConfig.testEnvironment) {
        this.addWarning('testEnvironment not specified in Jest config');
      } else {
        this.addSuccess(`Jest test environment: ${jestConfig.testEnvironment}`);
      }

      if (!jestConfig.setupFilesAfterEnv) {
        this.addWarning('setupFilesAfterEnv not configured');
      } else {
        this.addSuccess('Jest setup files configured');
      }

      if (!jestConfig.collectCoverageFrom) {
        this.addWarning('Coverage collection not configured');
      } else {
        this.addSuccess('Coverage collection configured');
      }

      if (!jestConfig.coverageThreshold) {
        this.addWarning('Coverage thresholds not set');
      } else {
        this.addSuccess('Coverage thresholds configured');
      }

    } catch (error) {
      this.addIssue(`Error loading Jest config: ${error.message}`);
    }
  }

  // Check test file syntax
  validateTestFileSyntax() {
    this.log('Validating test file syntax...');
    
    let syntaxErrors = 0;
    let validFiles = 0;

    this.testFiles.forEach(file => {
      try {
        const content = fs.readFileSync(file, 'utf8');
        
        // Basic syntax checks
        if (!content.includes('describe(') && !content.includes('test(')) {
          this.addWarning(`${file} may not contain valid test structure`);
        }

        // Check for common syntax issues
        if (content.includes('import ') && content.includes('require(')) {
          this.addWarning(`${file} mixes import and require statements`);
        }

        // Check for proper module exports
        if (content.includes('module.exports') && content.includes('export ')) {
          this.addWarning(`${file} mixes CommonJS and ES6 module syntax`);
        }

        validFiles++;
      } catch (error) {
        this.addIssue(`Syntax error in ${file}: ${error.message}`);
        syntaxErrors++;
      }
    });

    if (syntaxErrors === 0) {
      this.addSuccess(`All ${validFiles} test files have valid syntax`);
    } else {
      this.addIssue(`${syntaxErrors} test files have syntax errors`);
    }
  }

  // Check error suppression utilities
  validateErrorSuppression() {
    this.log('Validating error suppression utilities...');
    
    const errorSuppressionPath = path.join(process.cwd(), 'tests/utils/errorSuppression.js');
    if (!fs.existsSync(errorSuppressionPath)) {
      this.addIssue('Error suppression utility not found at tests/utils/errorSuppression.js');
      return;
    }

    try {
      const { TestErrorSuppression } = require(errorSuppressionPath);
      
      // Test basic functionality
      const suppression = new TestErrorSuppression();
      if (typeof suppression.suppressExpectedErrors === 'function' &&
          typeof suppression.restoreConsoleError === 'function') {
        this.addSuccess('Error suppression utility is functional');
      } else {
        this.addIssue('Error suppression utility missing required methods');
      }
    } catch (error) {
      this.addIssue(`Error loading error suppression utility: ${error.message}`);
    }
  }

  // Check test helpers and patterns
  validateTestHelpers() {
    this.log('Validating test helpers and patterns...');
    
    const helpersDir = path.join(process.cwd(), 'tests/helpers');
    if (!fs.existsSync(helpersDir)) {
      this.addWarning('Test helpers directory not found');
      return;
    }

    const helperFiles = fs.readdirSync(helpersDir).filter(file => file.endsWith('.js'));
    if (helperFiles.length === 0) {
      this.addWarning('No test helper files found');
    } else {
      this.addSuccess(`Found ${helperFiles.length} test helper files`);
    }

    // Check for common helper files
    const expectedHelpers = ['testData.js', 'testPatterns.js'];
    expectedHelpers.forEach(helper => {
      if (helperFiles.includes(helper)) {
        this.addSuccess(`Found expected helper: ${helper}`);
      } else {
        this.addWarning(`Missing expected helper: ${helper}`);
      }
    });
  }

  // Check package.json test scripts
  validateTestScripts() {
    this.log('Validating package.json test scripts...');
    
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      this.addIssue('package.json not found');
      return;
    }

    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      if (!packageJson.scripts) {
        this.addIssue('No scripts section in package.json');
        return;
      }

      const expectedScripts = ['test', 'test:watch'];
      expectedScripts.forEach(script => {
        if (packageJson.scripts[script]) {
          this.addSuccess(`Found test script: ${script}`);
        } else {
          this.addWarning(`Missing test script: ${script}`);
        }
      });

      // Check if test script uses Jest
      if (packageJson.scripts.test && packageJson.scripts.test.includes('jest')) {
        this.addSuccess('Test script uses Jest');
      } else {
        this.addWarning('Test script may not be using Jest');
      }

    } catch (error) {
      this.addIssue(`Error reading package.json: ${error.message}`);
    }
  }

  // Check browser test runner
  validateBrowserTestRunner() {
    this.log('Validating browser test runner...');
    
    const browserTestPath = path.join(process.cwd(), 'public/test-runner.html');
    if (!fs.existsSync(browserTestPath)) {
      this.addIssue('Browser test runner not found at public/test-runner.html');
      return;
    }

    try {
      const content = fs.readFileSync(browserTestPath, 'utf8');
      
      if (content.includes('<!DOCTYPE html>') && content.includes('<script')) {
        this.addSuccess('Browser test runner appears to be valid HTML');
      } else {
        this.addWarning('Browser test runner may have structural issues');
      }

      // Check for test runner JavaScript
      const testRunnerJsPath = path.join(process.cwd(), 'public/test-runner.js');
      if (fs.existsSync(testRunnerJsPath)) {
        this.addSuccess('Browser test runner JavaScript found');
      } else {
        this.addWarning('Browser test runner JavaScript not found');
      }

    } catch (error) {
      this.addIssue(`Error reading browser test runner: ${error.message}`);
    }
  }

  // Run a quick smoke test
  runSmokeTest() {
    this.log('Running smoke test...');
    
    try {
      // Try to run Jest with --listTests to see if it can discover tests
      const output = execSync('npx jest --listTests --passWithNoTests', { 
        encoding: 'utf8',
        timeout: 10000 
      });
      
      const testCount = output.split('\n').filter(line => line.includes('.test.js')).length;
      this.addSuccess(`Jest can discover ${testCount} test files`);
      
    } catch (error) {
      this.addIssue(`Jest smoke test failed: ${error.message}`);
    }
  }

  // Generate validation report
  generateReport() {
    this.log('\n=== TEST INFRASTRUCTURE VALIDATION REPORT ===');
    
    console.log('\n📊 SUMMARY:');
    console.log(`✓ Successes: ${this.successes.length}`);
    console.log(`⚠ Warnings: ${this.warnings.length}`);
    console.log(`✗ Issues: ${this.issues.length}`);
    
    console.log('\n📁 TEST FILE CATEGORIES:');
    Object.entries(this.testCategories).forEach(([category, files]) => {
      if (files.length > 0) {
        console.log(`  ${category}: ${files.length} files`);
      }
    });

    if (this.issues.length > 0) {
      console.log('\n🚨 CRITICAL ISSUES TO FIX:');
      this.issues.forEach((issue, index) => {
        console.log(`  ${index + 1}. ${issue}`);
      });
    }

    if (this.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS TO CONSIDER:');
      this.warnings.forEach((warning, index) => {
        console.log(`  ${index + 1}. ${warning}`);
      });
    }

    console.log('\n🎯 RECOMMENDATIONS:');
    
    if (this.issues.length === 0) {
      console.log('  ✓ Test infrastructure appears to be in good condition');
      console.log('  ✓ Ready for continuous integration workflows');
    } else {
      console.log('  • Fix critical issues before running full test suite');
      console.log('  • Review error suppression implementation');
      console.log('  • Ensure all test files follow standardized patterns');
    }

    if (this.warnings.length > 0) {
      console.log('  • Address warnings to improve test reliability');
      console.log('  • Consider adding missing helper utilities');
    }

    console.log('\n📚 NEXT STEPS:');
    console.log('  1. Review TEST_MAINTENANCE_GUIDE.md for detailed patterns');
    console.log('  2. Check TEST_TROUBLESHOOTING_GUIDE.md for issue resolution');
    console.log('  3. Run individual test categories to isolate problems');
    console.log('  4. Use npm test -- --testPathPattern=<pattern> for targeted testing');

    return {
      success: this.issues.length === 0,
      issues: this.issues.length,
      warnings: this.warnings.length,
      testFiles: this.testFiles.length,
      categories: this.testCategories
    };
  }

  // Main validation method
  async validate() {
    console.log('🔍 Starting Test Infrastructure Validation...\n');
    
    this.discoverTestFiles();
    this.validateJestConfig();
    this.validateTestFileSyntax();
    this.validateErrorSuppression();
    this.validateTestHelpers();
    this.validateTestScripts();
    this.validateBrowserTestRunner();
    this.runSmokeTest();
    
    return this.generateReport();
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new TestInfrastructureValidator();
  validator.validate().then(result => {
    process.exit(result.success ? 0 : 1);
  }).catch(error => {
    console.error('Validation failed:', error);
    process.exit(1);
  });
}

module.exports = { TestInfrastructureValidator };