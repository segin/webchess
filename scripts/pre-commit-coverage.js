#!/usr/bin/env node

/**
 * Pre-commit Coverage Validation Hook
 * Ensures coverage thresholds are maintained before commits
 */

const { execSync } = require('child_process');
const CoverageValidator = require('./coverage-validation');

async function validateCoverageForCommit() {
  console.log('🔍 Running pre-commit coverage validation...\n');

  try {
    // Run tests with coverage
    console.log('📋 Running tests with coverage...');
    execSync('npm run test:coverage', { 
      stdio: 'pipe',
      encoding: 'utf8'
    });

    // Validate coverage
    const validator = new CoverageValidator();
    await validator.validateCoverage();

    console.log('✅ Pre-commit coverage validation passed!\n');
    process.exit(0);

  } catch (error) {
    console.error('❌ Pre-commit coverage validation failed!');
    console.error('   Coverage thresholds not met. Please add tests before committing.\n');
    
    console.log('💡 To fix this:');
    console.log('   1. Run: npm run test:coverage:validate');
    console.log('   2. Follow the recommendations to add missing tests');
    console.log('   3. Ensure all coverage thresholds are met');
    console.log('   4. Try committing again\n');
    
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  validateCoverageForCommit();
}

module.exports = validateCoverageForCommit;