/**
 * Performance Monitoring for CI Tests
 * Tracks test execution performance and resource usage
 */

/**
 * Performance monitor for tracking test execution metrics
 */
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      testSuites: new Map(),
      globalStart: Date.now(),
      globalMemoryStart: process.memoryUsage(),
      slowTests: [],
      memoryLeaks: [],
      resourceUsage: []
    };
    
    this.thresholds = {
      slowTestWarning: 5000, // 5 seconds
      memoryLeakWarning: 50 * 1024 * 1024, // 50MB
      maxMemoryUsage: 512 * 1024 * 1024 // 512MB
    };
  }

  /**
   * Start monitoring a test suite
   * @param {string} suiteName - Name of the test suite
   */
  startSuite(suiteName) {
    this.metrics.testSuites.set(suiteName, {
      startTime: Date.now(),
      startMemory: process.memoryUsage(),
      tests: [],
      endTime: null,
      endMemory: null
    });
  }

  /**
   * End monitoring a test suite
   * @param {string} suiteName - Name of the test suite
   */
  endSuite(suiteName) {
    const suite = this.metrics.testSuites.get(suiteName);
    if (suite) {
      suite.endTime = Date.now();
      suite.endMemory = process.memoryUsage();
      
      // Check for performance issues
      this.analyzeSuitePerformance(suiteName, suite);
    }
  }

  /**
   * Start monitoring a test
   * @param {string} suiteName - Name of the test suite
   * @param {string} testName - Name of the test
   */
  startTest(suiteName, testName) {
    const suite = this.metrics.testSuites.get(suiteName);
    if (suite) {
      suite.tests.push({
        name: testName,
        startTime: Date.now(),
        startMemory: process.memoryUsage(),
        endTime: null,
        endMemory: null
      });
    }
  }

  /**
   * End monitoring a test
   * @param {string} suiteName - Name of the test suite
   * @param {string} testName - Name of the test
   */
  endTest(suiteName, testName) {
    const suite = this.metrics.testSuites.get(suiteName);
    if (suite) {
      const test = suite.tests.find(t => t.name === testName);
      if (test) {
        test.endTime = Date.now();
        test.endMemory = process.memoryUsage();
        
        // Check for slow tests
        const duration = test.endTime - test.startTime;
        if (duration > this.thresholds.slowTestWarning) {
          this.metrics.slowTests.push({
            suite: suiteName,
            test: testName,
            duration
          });
        }
        
        // Check for memory leaks
        const memoryDiff = test.endMemory.heapUsed - test.startMemory.heapUsed;
        if (memoryDiff > this.thresholds.memoryLeakWarning) {
          this.metrics.memoryLeaks.push({
            suite: suiteName,
            test: testName,
            memoryDiff
          });
        }
      }
    }
  }

  /**
   * Record resource usage snapshot
   */
  recordResourceUsage() {
    const usage = {
      timestamp: Date.now(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      uptime: process.uptime()
    };
    
    this.metrics.resourceUsage.push(usage);
    
    // Check memory threshold
    if (usage.memory.heapUsed > this.thresholds.maxMemoryUsage) {
      console.warn(`High memory usage: ${Math.round(usage.memory.heapUsed / 1024 / 1024)}MB`);
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
    }
  }

  /**
   * Analyze suite performance for issues
   * @param {string} suiteName - Name of the test suite
   * @param {Object} suite - Suite metrics
   */
  analyzeSuitePerformance(suiteName, suite) {
    const duration = suite.endTime - suite.startTime;
    const memoryDiff = suite.endMemory.heapUsed - suite.startMemory.heapUsed;
    
    // Log performance summary for CI
    if (process.env.CI === 'true') {
      console.log(`Suite ${suiteName}: ${duration}ms, Memory: ${Math.round(memoryDiff / 1024)}KB`);
    }
  }

  /**
   * Generate performance report
   * @returns {Object} Performance report
   */
  generateReport() {
    const totalDuration = Date.now() - this.metrics.globalStart;
    const totalMemoryDiff = process.memoryUsage().heapUsed - this.metrics.globalMemoryStart.heapUsed;
    
    const report = {
      summary: {
        totalDuration,
        totalMemoryDiff: Math.round(totalMemoryDiff / 1024 / 1024), // MB
        suiteCount: this.metrics.testSuites.size,
        slowTestCount: this.metrics.slowTests.length,
        memoryLeakCount: this.metrics.memoryLeaks.length
      },
      slowTests: this.metrics.slowTests.slice(0, 10), // Top 10 slowest
      memoryLeaks: this.metrics.memoryLeaks.slice(0, 10), // Top 10 memory leaks
      suites: Array.from(this.metrics.testSuites.entries()).map(([name, suite]) => ({
        name,
        duration: suite.endTime ? suite.endTime - suite.startTime : null,
        memoryDiff: suite.endMemory ? 
          Math.round((suite.endMemory.heapUsed - suite.startMemory.heapUsed) / 1024) : null,
        testCount: suite.tests.length
      }))
    };
    
    return report;
  }

  /**
   * Log performance report to console
   */
  logReport() {
    const report = this.generateReport();
    
    console.log('\n📊 Performance Report:');
    console.log(`   Total Duration: ${report.summary.totalDuration}ms`);
    console.log(`   Memory Usage: ${report.summary.totalMemoryDiff}MB`);
    console.log(`   Test Suites: ${report.summary.suiteCount}`);
    
    if (report.summary.slowTestCount > 0) {
      console.log(`\n⚠️  Slow Tests (${report.summary.slowTestCount}):`);
      report.slowTests.forEach(test => {
        console.log(`   ${test.suite} > ${test.test}: ${test.duration}ms`);
      });
    }
    
    if (report.summary.memoryLeakCount > 0) {
      console.log(`\n🔍 Memory Leaks (${report.summary.memoryLeakCount}):`);
      report.memoryLeaks.forEach(leak => {
        console.log(`   ${leak.suite} > ${leak.test}: ${Math.round(leak.memoryDiff / 1024)}KB`);
      });
    }
  }

  /**
   * Create a Jest reporter for performance monitoring
   * @returns {Object} Jest reporter
   */
  createJestReporter() {
    const monitor = this;
    
    return {
      onRunStart() {
        monitor.recordResourceUsage();
      },
      
      onTestSuiteStart(suite) {
        monitor.startSuite(suite.testPath);
      },
      
      onTestStart(test) {
        monitor.startTest(test.parent.testPath, test.name);
      },
      
      onTestComplete(test) {
        monitor.endTest(test.parent.testPath, test.name);
        monitor.recordResourceUsage();
      },
      
      onTestSuiteComplete(suite) {
        monitor.endSuite(suite.testPath);
      },
      
      onRunComplete() {
        if (process.env.CI === 'true') {
          monitor.logReport();
        }
      }
    };
  }

  /**
   * Apply performance monitoring to a test suite
   * @param {string} suiteName - Name of the test suite
   */
  static applyToSuite(suiteName) {
    const monitor = new PerformanceMonitor();
    
    beforeAll(() => {
      monitor.startSuite(suiteName);
    });
    
    beforeEach(function() {
      monitor.startTest(suiteName, this.currentTest?.title || 'unknown');
    });
    
    afterEach(function() {
      monitor.endTest(suiteName, this.currentTest?.title || 'unknown');
    });
    
    afterAll(() => {
      monitor.endSuite(suiteName);
      
      if (process.env.CI === 'true') {
        monitor.logReport();
      }
    });
  }
}

// Global performance monitor instance
const globalMonitor = new PerformanceMonitor();

// Start monitoring resource usage periodically in CI
if (process.env.CI === 'true') {
  setInterval(() => {
    globalMonitor.recordResourceUsage();
  }, 10000); // Every 10 seconds
}

module.exports = PerformanceMonitor;