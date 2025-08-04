#!/usr/bin/env node

/**
 * Coverage Validation Script
 * Provides actionable feedback on test coverage and identifies untested code paths
 */

const fs = require('fs');
const path = require('path');

class CoverageValidator {
  constructor() {
    this.coverageDir = path.join(process.cwd(), 'coverage');
    this.coverageSummaryPath = path.join(this.coverageDir, 'coverage-summary.json');
    this.coverageFinalPath = path.join(this.coverageDir, 'coverage-final.json');
    this.thresholds = {
      statements: 95,
      branches: 95,
      functions: 95,
      lines: 95
    };
  }

  async validateCoverage() {
    console.log('🔍 Validating Test Coverage...\n');

    if (!this.coverageExists()) {
      console.error('❌ Coverage reports not found. Run tests with coverage first:');
      console.error('   npm test -- --coverage\n');
      process.exit(1);
    }

    const summary = this.loadCoverageSummary();
    const detailed = this.loadDetailedCoverage();

    const validation = this.analyzeCoverage(summary, detailed);
    this.reportResults(validation);

    if (!validation.passed) {
      process.exit(1);
    }
  }

  coverageExists() {
    return fs.existsSync(this.coverageSummaryPath) && fs.existsSync(this.coverageFinalPath);
  }

  loadCoverageSummary() {
    try {
      const data = fs.readFileSync(this.coverageSummaryPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('❌ Failed to load coverage summary:', error.message);
      process.exit(1);
    }
  }

  loadDetailedCoverage() {
    try {
      const data = fs.readFileSync(this.coverageFinalPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('❌ Failed to load detailed coverage:', error.message);
      process.exit(1);
    }
  }

  analyzeCoverage(summary, detailed) {
    const validation = {
      passed: true,
      global: this.analyzeGlobalCoverage(summary.total),
      files: this.analyzeFileCoverage(detailed),
      recommendations: []
    };

    // Check if global thresholds are met
    if (!validation.global.passed) {
      validation.passed = false;
    }

    // Check critical files
    const criticalFiles = [
      'src/shared/chessGame.js',
      'src/shared/gameState.js',
      'src/shared/errorHandler.js'
    ];

    for (const file of criticalFiles) {
      const fileData = validation.files.find(f => f.path === file);
      if (fileData && !fileData.passed) {
        validation.passed = false;
      }
    }

    // Generate recommendations
    validation.recommendations = this.generateRecommendations(validation);

    return validation;
  }

  analyzeGlobalCoverage(total) {
    const result = {
      passed: true,
      metrics: {},
      failures: []
    };

    for (const [metric, data] of Object.entries(total)) {
      const percentage = data.pct;
      const threshold = this.thresholds[metric];
      
      result.metrics[metric] = {
        percentage,
        threshold,
        passed: percentage >= threshold,
        covered: data.covered,
        total: data.total,
        uncovered: data.total - data.covered
      };

      if (percentage < threshold) {
        result.passed = false;
        result.failures.push({
          metric,
          percentage,
          threshold,
          gap: threshold - percentage
        });
      }
    }

    return result;
  }

  analyzeFileCoverage(detailed) {
    const files = [];

    for (const [filePath, data] of Object.entries(detailed)) {
      if (filePath === 'total') continue;

      const fileAnalysis = {
        path: filePath,
        passed: true,
        metrics: {},
        uncoveredLines: [],
        uncoveredBranches: [],
        uncoveredFunctions: []
      };

      // Analyze metrics
      for (const [metric, metricData] of Object.entries(data)) {
        if (typeof metricData === 'object' && metricData.pct !== undefined) {
          const percentage = metricData.pct;
          const threshold = this.thresholds[metric];
          
          fileAnalysis.metrics[metric] = {
            percentage,
            threshold,
            passed: percentage >= threshold,
            covered: metricData.covered,
            total: metricData.total
          };

          if (percentage < threshold) {
            fileAnalysis.passed = false;
          }
        }
      }

      // Identify uncovered lines
      if (data.statementMap && data.s) {
        for (const [stmtId, count] of Object.entries(data.s)) {
          if (count === 0) {
            const stmt = data.statementMap[stmtId];
            fileAnalysis.uncoveredLines.push({
              line: stmt.start.line,
              column: stmt.start.column
            });
          }
        }
      }

      // Identify uncovered branches
      if (data.branchMap && data.b) {
        for (const [branchId, counts] of Object.entries(data.b)) {
          counts.forEach((count, index) => {
            if (count === 0) {
              const branch = data.branchMap[branchId];
              fileAnalysis.uncoveredBranches.push({
                line: branch.line,
                type: branch.type,
                index
              });
            }
          });
        }
      }

      // Identify uncovered functions
      if (data.fnMap && data.f) {
        for (const [fnId, count] of Object.entries(data.f)) {
          if (count === 0) {
            const fn = data.fnMap[fnId];
            fileAnalysis.uncoveredFunctions.push({
              name: fn.name,
              line: fn.line
            });
          }
        }
      }

      files.push(fileAnalysis);
    }

    return files;
  }

  generateRecommendations(validation) {
    const recommendations = [];

    // Global coverage recommendations
    if (!validation.global.passed) {
      for (const failure of validation.global.failures) {
        recommendations.push({
          type: 'global',
          priority: 'high',
          metric: failure.metric,
          message: `Global ${failure.metric} coverage is ${failure.percentage}%, needs ${failure.gap.toFixed(1)}% more to reach ${failure.threshold}%`,
          action: `Add tests to cover ${validation.global.metrics[failure.metric].uncovered} uncovered ${failure.metric}`
        });
      }
    }

    // File-specific recommendations
    const criticalFiles = validation.files.filter(f => 
      f.path.includes('chessGame.js') || 
      f.path.includes('gameState.js') || 
      f.path.includes('errorHandler.js')
    );

    for (const file of criticalFiles) {
      if (!file.passed) {
        for (const [metric, data] of Object.entries(file.metrics)) {
          if (!data.passed) {
            recommendations.push({
              type: 'file',
              priority: 'high',
              file: file.path,
              metric,
              message: `${file.path} ${metric} coverage is ${data.percentage}%, needs ${(data.threshold - data.percentage).toFixed(1)}% more`,
              action: this.getSpecificAction(file, metric)
            });
          }
        }
      }
    }

    // Specific uncovered code recommendations
    for (const file of validation.files) {
      if (file.uncoveredFunctions.length > 0) {
        recommendations.push({
          type: 'functions',
          priority: 'medium',
          file: file.path,
          message: `${file.uncoveredFunctions.length} uncovered functions in ${file.path}`,
          action: `Add tests for functions: ${file.uncoveredFunctions.map(f => f.name).join(', ')}`,
          details: file.uncoveredFunctions
        });
      }

      if (file.uncoveredLines.length > 5) {
        recommendations.push({
          type: 'lines',
          priority: 'medium',
          file: file.path,
          message: `${file.uncoveredLines.length} uncovered lines in ${file.path}`,
          action: `Add tests to cover lines: ${file.uncoveredLines.slice(0, 5).map(l => l.line).join(', ')}${file.uncoveredLines.length > 5 ? '...' : ''}`,
          details: file.uncoveredLines.slice(0, 10)
        });
      }
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  getSpecificAction(file, metric) {
    const actions = {
      statements: 'Add tests that execute uncovered code statements',
      branches: 'Add tests for conditional logic branches (if/else, switch cases)',
      functions: 'Add tests that call uncovered functions',
      lines: 'Add tests that execute uncovered lines of code'
    };

    return actions[metric] || 'Add appropriate tests';
  }

  reportResults(validation) {
    console.log('📊 Coverage Validation Results\n');

    // Global coverage report
    console.log('🌍 Global Coverage:');
    for (const [metric, data] of Object.entries(validation.global.metrics)) {
      const status = data.passed ? '✅' : '❌';
      const color = data.passed ? '\x1b[32m' : '\x1b[31m';
      const reset = '\x1b[0m';
      
      console.log(`  ${status} ${metric.padEnd(12)}: ${color}${data.percentage.toFixed(1)}%${reset} (${data.covered}/${data.total}) - Threshold: ${data.threshold}%`);
    }

    console.log('');

    // Critical files report
    const criticalFiles = validation.files.filter(f => 
      f.path.includes('chessGame.js') || 
      f.path.includes('gameState.js') || 
      f.path.includes('errorHandler.js')
    );

    if (criticalFiles.length > 0) {
      console.log('🎯 Critical Files Coverage:');
      for (const file of criticalFiles) {
        const status = file.passed ? '✅' : '❌';
        console.log(`  ${status} ${path.basename(file.path)}`);
        
        for (const [metric, data] of Object.entries(file.metrics)) {
          const metricStatus = data.passed ? '✅' : '❌';
          const color = data.passed ? '\x1b[32m' : '\x1b[31m';
          const reset = '\x1b[0m';
          
          console.log(`    ${metricStatus} ${metric.padEnd(10)}: ${color}${data.percentage.toFixed(1)}%${reset}`);
        }
      }
      console.log('');
    }

    // Recommendations
    if (validation.recommendations.length > 0) {
      console.log('💡 Recommendations to Improve Coverage:\n');
      
      validation.recommendations.slice(0, 10).forEach((rec, index) => {
        const priority = rec.priority === 'high' ? '🔴' : rec.priority === 'medium' ? '🟡' : '🟢';
        console.log(`${index + 1}. ${priority} ${rec.message}`);
        console.log(`   Action: ${rec.action}\n`);
      });

      if (validation.recommendations.length > 10) {
        console.log(`   ... and ${validation.recommendations.length - 10} more recommendations\n`);
      }
    }

    // Final result
    if (validation.passed) {
      console.log('🎉 Coverage validation PASSED! All thresholds met.\n');
    } else {
      console.log('❌ Coverage validation FAILED. Address the recommendations above.\n');
      console.log('💡 To improve coverage:');
      console.log('   1. Run: npm test -- --coverage --verbose');
      console.log('   2. Open: coverage/index.html in your browser');
      console.log('   3. Focus on red/yellow highlighted code sections');
      console.log('   4. Add tests for uncovered code paths\n');
    }
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new CoverageValidator();
  validator.validateCoverage().catch(error => {
    console.error('❌ Coverage validation failed:', error.message);
    process.exit(1);
  });
}

module.exports = CoverageValidator;