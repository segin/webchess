#!/usr/bin/env node

/**
 * Coverage Monitoring Script
 * Monitors coverage trends and prevents regression
 */

const fs = require('fs');
const path = require('path');
const coverageConfig = require('../coverage.config.js');

class CoverageMonitor {
  constructor() {
    this.coverageDir = path.join(process.cwd(), 'coverage');
    this.historyFile = path.join(this.coverageDir, 'coverage-history.json');
    this.summaryFile = path.join(this.coverageDir, 'coverage-summary.json');
  }

  async monitorCoverage() {
    console.log('📈 Monitoring Coverage Trends...\n');

    if (!fs.existsSync(this.summaryFile)) {
      console.error('❌ Coverage summary not found. Run tests with coverage first.');
      process.exit(1);
    }

    const currentCoverage = this.loadCurrentCoverage();
    const history = this.loadCoverageHistory();
    
    const analysis = this.analyzeTrends(currentCoverage, history);
    this.updateHistory(currentCoverage, history);
    this.reportTrends(analysis);

    if (analysis.hasRegression && coverageConfig.validation.enforceGlobalThresholds) {
      console.error('❌ Coverage regression detected! Build should fail.');
      process.exit(1);
    }
  }

  loadCurrentCoverage() {
    try {
      const data = fs.readFileSync(this.summaryFile, 'utf8');
      const summary = JSON.parse(data);
      return {
        timestamp: new Date().toISOString(),
        global: summary.total,
        files: Object.fromEntries(
          Object.entries(summary).filter(([key]) => key !== 'total')
        )
      };
    } catch (error) {
      console.error('❌ Failed to load current coverage:', error.message);
      process.exit(1);
    }
  }

  loadCoverageHistory() {
    if (!fs.existsSync(this.historyFile)) {
      return [];
    }

    try {
      const data = fs.readFileSync(this.historyFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.warn('⚠️  Failed to load coverage history, starting fresh');
      return [];
    }
  }

  analyzeTrends(current, history) {
    const analysis = {
      hasRegression: false,
      improvements: [],
      regressions: [],
      trends: {}
    };

    if (history.length === 0) {
      console.log('📊 First coverage measurement recorded.');
      return analysis;
    }

    const previous = history[history.length - 1];
    const maxRegression = coverageConfig.validation.maxCoverageRegression;

    // Analyze global trends
    for (const [metric, currentData] of Object.entries(current.global)) {
      const previousData = previous.global[metric];
      if (previousData) {
        const change = currentData.pct - previousData.pct;
        
        analysis.trends[metric] = {
          current: currentData.pct,
          previous: previousData.pct,
          change: change,
          direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable'
        };

        if (change < -maxRegression) {
          analysis.hasRegression = true;
          analysis.regressions.push({
            type: 'global',
            metric,
            change,
            current: currentData.pct,
            previous: previousData.pct
          });
        } else if (change > 1) {
          analysis.improvements.push({
            type: 'global',
            metric,
            change,
            current: currentData.pct,
            previous: previousData.pct
          });
        }
      }
    }

    // Analyze critical file trends
    for (const criticalFile of coverageConfig.validation.criticalFiles) {
      const currentFileData = current.files[criticalFile];
      const previousFileData = previous.files && previous.files[criticalFile];

      if (currentFileData && previousFileData) {
        for (const [metric, currentMetricData] of Object.entries(currentFileData)) {
          const previousMetricData = previousFileData[metric];
          if (previousMetricData && typeof currentMetricData === 'object' && currentMetricData.pct !== undefined) {
            const change = currentMetricData.pct - previousMetricData.pct;

            if (change < -maxRegression) {
              analysis.hasRegression = true;
              analysis.regressions.push({
                type: 'file',
                file: criticalFile,
                metric,
                change,
                current: currentMetricData.pct,
                previous: previousMetricData.pct
              });
            }
          }
        }
      }
    }

    return analysis;
  }

  updateHistory(current, history) {
    // Keep last 50 measurements
    const maxHistory = 50;
    const updatedHistory = [...history, current].slice(-maxHistory);

    try {
      fs.writeFileSync(this.historyFile, JSON.stringify(updatedHistory, null, 2));
    } catch (error) {
      console.warn('⚠️  Failed to update coverage history:', error.message);
    }
  }

  reportTrends(analysis) {
    console.log('📊 Coverage Trend Analysis\n');

    // Global trends
    if (Object.keys(analysis.trends).length > 0) {
      console.log('🌍 Global Coverage Trends:');
      for (const [metric, trend] of Object.entries(analysis.trends)) {
        const arrow = trend.direction === 'up' ? '📈' : trend.direction === 'down' ? '📉' : '➡️';
        const color = trend.direction === 'up' ? '\x1b[32m' : trend.direction === 'down' ? '\x1b[31m' : '\x1b[33m';
        const reset = '\x1b[0m';
        
        console.log(`  ${arrow} ${metric.padEnd(12)}: ${color}${trend.current.toFixed(1)}%${reset} (${trend.change >= 0 ? '+' : ''}${trend.change.toFixed(1)}%)`);
      }
      console.log('');
    }

    // Improvements
    if (analysis.improvements.length > 0) {
      console.log('🎉 Coverage Improvements:');
      for (const improvement of analysis.improvements) {
        console.log(`  ✅ ${improvement.type === 'global' ? 'Global' : improvement.file} ${improvement.metric}: +${improvement.change.toFixed(1)}%`);
      }
      console.log('');
    }

    // Regressions
    if (analysis.regressions.length > 0) {
      console.log('⚠️  Coverage Regressions:');
      for (const regression of analysis.regressions) {
        const location = regression.type === 'global' ? 'Global' : path.basename(regression.file);
        console.log(`  ❌ ${location} ${regression.metric}: ${regression.change.toFixed(1)}% (${regression.current.toFixed(1)}% → ${regression.previous.toFixed(1)}%)`);
      }
      console.log('');
    }

    // Overall status
    if (analysis.hasRegression) {
      console.log('❌ Coverage regression detected! Please add tests to restore coverage levels.\n');
    } else if (analysis.improvements.length > 0) {
      console.log('🎉 Coverage improved! Great work on adding tests.\n');
    } else {
      console.log('✅ Coverage levels maintained.\n');
    }
  }

  generateCoverageBadge() {
    // Simple badge generation (could be enhanced with actual badge creation)
    const current = this.loadCurrentCoverage();
    const globalCoverage = Math.round(
      (current.global.statements.pct + 
       current.global.branches.pct + 
       current.global.functions.pct + 
       current.global.lines.pct) / 4
    );

    const badgeColor = globalCoverage >= 95 ? 'brightgreen' : 
                      globalCoverage >= 90 ? 'green' : 
                      globalCoverage >= 80 ? 'yellow' : 
                      globalCoverage >= 70 ? 'orange' : 'red';

    const badgeUrl = `https://img.shields.io/badge/coverage-${globalCoverage}%25-${badgeColor}`;
    
    console.log(`📛 Coverage Badge: ${badgeUrl}`);
    
    // Save badge info
    const badgeInfo = {
      coverage: globalCoverage,
      color: badgeColor,
      url: badgeUrl,
      timestamp: new Date().toISOString()
    };

    try {
      fs.writeFileSync(
        path.join(this.coverageDir, 'badge.json'), 
        JSON.stringify(badgeInfo, null, 2)
      );
    } catch (error) {
      console.warn('⚠️  Failed to save badge info:', error.message);
    }
  }
}

// Run if called directly
if (require.main === module) {
  const monitor = new CoverageMonitor();
  monitor.monitorCoverage().then(() => {
    monitor.generateCoverageBadge();
  }).catch(error => {
    console.error('❌ Coverage monitoring failed:', error.message);
    process.exit(1);
  });
}

module.exports = CoverageMonitor;