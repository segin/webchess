#!/usr/bin/env node

/**
 * CI Validation Script
 * Validates CI performance optimizations and test reliability
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class CIValidator {
  constructor() {
    this.results = {
      performance: {},
      reliability: {},
      resourceUsage: {},
      errors: []
    };
  }

  /**
   * Run validation tests
   */
  async validate() {
    console.log('🔍 Starting CI Validation...\n');

    try {
      await this.validatePerformance();
      await this.validateReliability();
      await this.validateResourceUsage();
      await this.validateConfiguration();
      
      this.generateReport();
    } catch (error) {
      console.error('❌ Validation failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Validate CI performance optimizations
   */
  async validatePerformance() {
    console.log('📊 Validating Performance Optimizations...');

    // Test standard configuration
    const standardStart = Date.now();
    try {
      execSync('npm test -- --testPathPatterns="basicFunctionality" --silent', {
        stdio: 'pipe',
        timeout: 60000
      });
    } catch (error) {
      // Ignore coverage threshold failures for performance test
    }
    const standardTime = Date.now() - standardStart;

    // Test CI-optimized configuration
    const ciStart = Date.now();
    try {
      execSync('npm run test:ci:fast -- --testPathPatterns="basicFunctionality"', {
        stdio: 'pipe',
        timeout: 60000
      });
    } catch (error) {
      // Ignore coverage threshold failures for performance test
    }
    const ciTime = Date.now() - ciStart;

    this.results.performance = {
      standardTime,
      ciTime,
      improvement: ((standardTime - ciTime) / standardTime * 100).toFixed(1)
    };

    console.log(`   Standard config: ${standardTime}ms`);
    console.log(`   CI config: ${ciTime}ms`);
    console.log(`   Improvement: ${this.results.performance.improvement}%\n`);
  }

  /**
   * Validate test reliability and isolation
   */
  async validateReliability() {
    console.log('🔒 Validating Test Reliability...');

    const testRuns = 3;
    const results = [];

    for (let i = 0; i < testRuns; i++) {
      console.log(`   Run ${i + 1}/${testRuns}...`);
      
      const start = Date.now();
      try {
        const output = execSync('npm run test:ci:fast -- --testPathPatterns="basicFunctionality"', {
          stdio: 'pipe',
          timeout: 60000,
          encoding: 'utf8'
        });
        
        results.push({
          success: true,
          time: Date.now() - start,
          output: output.toString()
        });
      } catch (error) {
        results.push({
          success: false,
          time: Date.now() - start,
          error: error.message
        });
      }
    }

    const successRate = (results.filter(r => r.success).length / testRuns * 100).toFixed(1);
    const avgTime = results.reduce((sum, r) => sum + r.time, 0) / testRuns;

    this.results.reliability = {
      successRate,
      avgTime,
      consistency: this.calculateConsistency(results.map(r => r.time))
    };

    console.log(`   Success rate: ${successRate}%`);
    console.log(`   Average time: ${avgTime.toFixed(0)}ms`);
    console.log(`   Time consistency: ${this.results.reliability.consistency}%\n`);
  }

  /**
   * Validate resource usage optimization
   */
  async validateResourceUsage() {
    console.log('💾 Validating Resource Usage...');

    const memoryBefore = process.memoryUsage();
    
    try {
      const output = execSync('npm run test:ci -- --testPathPatterns="basicFunctionality" --detectOpenHandles', {
        stdio: 'pipe',
        timeout: 60000,
        encoding: 'utf8'
      });

      // Check for open handles warning
      const hasOpenHandles = output.includes('Jest did not exit one second after the test run has completed');
      
      this.results.resourceUsage = {
        memoryBefore: Math.round(memoryBefore.heapUsed / 1024 / 1024),
        memoryAfter: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        hasOpenHandles,
        cleanExit: !hasOpenHandles
      };

      console.log(`   Memory before: ${this.results.resourceUsage.memoryBefore}MB`);
      console.log(`   Memory after: ${this.results.resourceUsage.memoryAfter}MB`);
      console.log(`   Clean exit: ${this.results.resourceUsage.cleanExit ? '✅' : '❌'}\n`);
    } catch (error) {
      this.results.errors.push(`Resource usage validation failed: ${error.message}`);
    }
  }

  /**
   * Validate CI configuration files
   */
  async validateConfiguration() {
    console.log('⚙️  Validating Configuration...');

    const configs = [
      'jest.config.js',
      'jest.ci.config.js',
      'tests/utils/ci-setup.js',
      'tests/utils/testIsolation.js',
      'tests/utils/performanceMonitor.js'
    ];

    const configResults = {};

    for (const config of configs) {
      const exists = fs.existsSync(config);
      configResults[config] = {
        exists,
        size: exists ? fs.statSync(config).size : 0
      };

      console.log(`   ${config}: ${exists ? '✅' : '❌'}`);
    }

    this.results.configuration = configResults;
    console.log();
  }

  /**
   * Calculate time consistency percentage
   */
  calculateConsistency(times) {
    if (times.length < 2) return 100;

    const avg = times.reduce((sum, time) => sum + time, 0) / times.length;
    const variance = times.reduce((sum, time) => sum + Math.pow(time - avg, 2), 0) / times.length;
    const stdDev = Math.sqrt(variance);
    const coefficient = stdDev / avg;

    return Math.max(0, (1 - coefficient) * 100).toFixed(1);
  }

  /**
   * Generate validation report
   */
  generateReport() {
    console.log('📋 Validation Report');
    console.log('='.repeat(50));

    // Performance Summary
    console.log('\n📊 Performance:');
    console.log(`   CI optimization improvement: ${this.results.performance.improvement}%`);
    console.log(`   CI execution time: ${this.results.performance.ciTime}ms`);

    // Reliability Summary
    console.log('\n🔒 Reliability:');
    console.log(`   Test success rate: ${this.results.reliability.successRate}%`);
    console.log(`   Time consistency: ${this.results.reliability.consistency}%`);

    // Resource Usage Summary
    console.log('\n💾 Resource Usage:');
    console.log(`   Clean process exit: ${this.results.resourceUsage.cleanExit ? '✅' : '❌'}`);
    console.log(`   Memory usage stable: ${this.results.resourceUsage.memoryAfter <= this.results.resourceUsage.memoryBefore + 50 ? '✅' : '❌'}`);

    // Overall Assessment
    const performanceGood = parseFloat(this.results.performance.improvement) >= 0;
    const reliabilityGood = parseFloat(this.results.reliability.successRate) >= 90;
    const resourcesGood = this.results.resourceUsage.cleanExit;

    console.log('\n🎯 Overall Assessment:');
    console.log(`   Performance optimization: ${performanceGood ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Test reliability: ${reliabilityGood ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Resource management: ${resourcesGood ? '✅ PASS' : '❌ FAIL'}`);

    if (this.results.errors.length > 0) {
      console.log('\n❌ Errors:');
      this.results.errors.forEach(error => console.log(`   ${error}`));
    }

    const allPassed = performanceGood && reliabilityGood && resourcesGood && this.results.errors.length === 0;
    
    console.log(`\n${allPassed ? '✅ All validations PASSED' : '❌ Some validations FAILED'}`);
    
    if (!allPassed) {
      process.exit(1);
    }
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new CIValidator();
  validator.validate().catch(error => {
    console.error('Validation error:', error);
    process.exit(1);
  });
}

module.exports = CIValidator;