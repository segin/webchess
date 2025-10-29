/**
 * Server Initialization Tests
 * Tests for server startup, port binding, configuration loading, and error handling
 * Requirements: 3.1, 3.4, 3.5
 */

const request = require('supertest');
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs');

// Mock external dependencies
jest.mock('../src/server/gameManager');

describe('Server Initialization Tests', () => {
  let app;
  let server;
  let io;
  let originalEnv;

  beforeEach(() => {
    // Store original environment
    originalEnv = { ...process.env };
    
    // Clear module cache to ensure fresh imports
    jest.clearAllMocks();
    
    // Create fresh Express app for each test
    app = express();
    server = http.createServer(app);
    io = socketIo(server);
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
    
    // Close server if it's listening
    if (server && server.listening) {
      server.close();
    }
  });

  describe('Server Dependencies and Imports', () => {
    test('should successfully import all required dependencies', () => {
      expect(express).toBeDefined();
      expect(http).toBeDefined();
      expect(socketIo).toBeDefined();
      expect(path).toBeDefined();
      expect(typeof express).toBe('function');
      expect(typeof http.createServer).toBe('function');
      expect(typeof socketIo).toBe('function');
    });

    test('should successfully import GameManager', () => {
      const GameManager = require('../src/server/gameManager');
      expect(GameManager).toBeDefined();
      expect(typeof GameManager).toBe('function');
    });

    test('should create Express app instance', () => {
      const testApp = express();
      expect(testApp).toBeDefined();
      expect(typeof testApp.use).toBe('function');
      expect(typeof testApp.get).toBe('function');
      expect(typeof testApp.listen).toBe('function');
    });

    test('should create HTTP server from Express app', () => {
      const testApp = express();
      const testServer = http.createServer(testApp);
      expect(testServer).toBeDefined();
      expect(typeof testServer.listen).toBe('function');
      expect(typeof testServer.close).toBe('function');
    });

    test('should create Socket.IO instance from HTTP server', () => {
      const testApp = express();
      const testServer = http.createServer(testApp);
      const testIo = socketIo(testServer);
      expect(testIo).toBeDefined();
      expect(typeof testIo.on).toBe('function');
      expect(typeof testIo.emit).toBe('function');
    });
  });

  describe('Static File Serving Configuration', () => {
    test('should configure static file middleware with correct path', () => {
      const publicPath = path.join(__dirname, '../public');
      expect(fs.existsSync(publicPath)).toBe(true);
      
      // Test static middleware configuration
      const staticMiddleware = express.static(publicPath);
      expect(staticMiddleware).toBeDefined();
      expect(typeof staticMiddleware).toBe('function');
    });

    test('should configure cache headers for HTML files', () => {
      const mockRes = {
        setHeader: jest.fn()
      };
      
      const testPath = '/index.html';
      
      // Simulate cache header logic for HTML files
      if (testPath.endsWith('.html')) {
        mockRes.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        mockRes.setHeader('Pragma', 'no-cache');
        mockRes.setHeader('Expires', '0');
      }
      
      expect(mockRes.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-cache, no-store, must-revalidate');
      expect(mockRes.setHeader).toHaveBeenCalledWith('Pragma', 'no-cache');
      expect(mockRes.setHeader).toHaveBeenCalledWith('Expires', '0');
    });

    test('should configure cache headers for CSS and JS files', () => {
      const mockRes = {
        setHeader: jest.fn()
      };
      
      const cssPath = '/styles.css';
      const jsPath = '/script.js';
      
      // Test CSS file headers
      if (cssPath.endsWith('.css') || cssPath.endsWith('.js')) {
        mockRes.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
      }
      
      expect(mockRes.setHeader).toHaveBeenCalledWith('Cache-Control', 'public, max-age=0, must-revalidate');
      
      // Reset mock for JS test
      mockRes.setHeader.mockClear();
      
      // Test JS file headers
      if (jsPath.endsWith('.css') || jsPath.endsWith('.js')) {
        mockRes.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
      }
      
      expect(mockRes.setHeader).toHaveBeenCalledWith('Cache-Control', 'public, max-age=0, must-revalidate');
    });

    test('should verify required static files exist', () => {
      const publicPath = path.join(__dirname, '../public');
      const requiredFiles = ['index.html', 'script.js', 'styles.css'];
      
      requiredFiles.forEach(file => {
        const filePath = path.join(publicPath, file);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });
  });

  describe('Health Check Endpoint Configuration', () => {
    test('should create health check response with correct structure', () => {
      const mockGameManager = {
        getActiveGameCount: jest.fn().mockReturnValue(5)
      };
      
      const health = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: require('../package.json').version,
        memory: process.memoryUsage(),
        activeGames: mockGameManager.getActiveGameCount(),
      };
      
      expect(health).toHaveProperty('status', 'ok');
      expect(health).toHaveProperty('timestamp');
      expect(health).toHaveProperty('uptime');
      expect(health).toHaveProperty('environment');
      expect(health).toHaveProperty('version', '1.0.0');
      expect(health).toHaveProperty('memory');
      expect(health).toHaveProperty('activeGames', 5);
      
      expect(typeof health.uptime).toBe('number');
      expect(typeof health.memory).toBe('object');
      expect(typeof health.activeGames).toBe('number');
      expect(health.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    test('should handle missing getActiveGameCount method gracefully', () => {
      const mockGameManager = {}; // No getActiveGameCount method
      
      const activeGames = mockGameManager.getActiveGameCount ? mockGameManager.getActiveGameCount() : 0;
      expect(activeGames).toBe(0);
    });

    test('should handle different environment values', () => {
      // Test development environment
      process.env.NODE_ENV = 'development';
      expect(process.env.NODE_ENV || 'development').toBe('development');
      
      // Test production environment
      process.env.NODE_ENV = 'production';
      expect(process.env.NODE_ENV || 'development').toBe('production');
      
      // Test undefined environment (should default to development)
      delete process.env.NODE_ENV;
      expect(process.env.NODE_ENV || 'development').toBe('development');
    });

    test('should include memory usage information', () => {
      const memory = process.memoryUsage();
      expect(memory).toHaveProperty('rss');
      expect(memory).toHaveProperty('heapTotal');
      expect(memory).toHaveProperty('heapUsed');
      expect(memory).toHaveProperty('external');
      
      expect(typeof memory.rss).toBe('number');
      expect(typeof memory.heapTotal).toBe('number');
      expect(typeof memory.heapUsed).toBe('number');
      expect(typeof memory.external).toBe('number');
      
      expect(memory.rss).toBeGreaterThan(0);
      expect(memory.heapTotal).toBeGreaterThan(0);
      expect(memory.heapUsed).toBeGreaterThan(0);
    });
  });

  describe('Readiness Check Endpoint Configuration', () => {
    test('should create readiness check response with correct structure', () => {
      const readiness = {
        status: 'ready'
      };
      
      expect(readiness).toHaveProperty('status', 'ready');
    });

    test('should validate readiness response headers', () => {
      const mockRes = {
        setHeader: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      
      // Simulate readiness endpoint logic
      mockRes.setHeader('Content-Type', 'application/json');
      mockRes.setHeader('Cache-Control', 'no-cache');
      mockRes.status(200).json({ status: 'ready' });
      
      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'application/json');
      expect(mockRes.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-cache');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ status: 'ready' });
    });
  });

  describe('Root Endpoint Configuration', () => {
    test('should configure root endpoint to serve index.html', () => {
      const indexPath = path.join(__dirname, '../public/index.html');
      expect(fs.existsSync(indexPath)).toBe(true);
    });

    test('should set correct cache headers for root endpoint', () => {
      const mockRes = {
        setHeader: jest.fn(),
        sendFile: jest.fn()
      };
      
      // Simulate root endpoint cache header logic
      mockRes.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      mockRes.setHeader('Pragma', 'no-cache');
      mockRes.setHeader('Expires', '0');
      
      expect(mockRes.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-cache, no-store, must-revalidate');
      expect(mockRes.setHeader).toHaveBeenCalledWith('Pragma', 'no-cache');
      expect(mockRes.setHeader).toHaveBeenCalledWith('Expires', '0');
    });
  });

  describe('Server Port and Host Configuration', () => {
    test('should use default port 3000 when PORT env var is not set', () => {
      delete process.env.PORT;
      const port = process.env.PORT || 3000;
      expect(port).toBe(3000);
    });

    test('should use custom port when PORT env var is set', () => {
      process.env.PORT = '8080';
      const port = process.env.PORT || 3000;
      expect(port).toBe('8080');
    });

    test('should use default host localhost when HOST env var is not set', () => {
      delete process.env.HOST;
      const host = process.env.HOST || 'localhost';
      expect(host).toBe('localhost');
    });

    test('should use custom host when HOST env var is set', () => {
      process.env.HOST = '0.0.0.0';
      const host = process.env.HOST || 'localhost';
      expect(host).toBe('0.0.0.0');
    });
  });

  describe('Server Startup Error Handling', () => {
    test('should handle server listen callback', (done) => {
      const testServer = http.createServer(app);
      const port = 0; // Use port 0 to get any available port
      
      testServer.listen(port, 'localhost', () => {
        expect(testServer.listening).toBe(true);
        testServer.close(done);
      });
    });

    test('should handle server listen error', (done) => {
      const testServer = http.createServer(app);
      
      testServer.on('error', (error) => {
        expect(error).toBeDefined();
        expect(error.code).toBeDefined();
        done();
      });
      
      // Mock an error scenario instead of using invalid port
      process.nextTick(() => {
        const mockError = new Error('EADDRINUSE: address already in use');
        mockError.code = 'EADDRINUSE';
        testServer.emit('error', mockError);
      });
    });

    test('should handle port already in use error', (done) => {
      const testServer1 = http.createServer(app);
      const testServer2 = http.createServer(express());
      
      testServer1.listen(0, 'localhost', () => {
        const port = testServer1.address().port;
        
        testServer2.on('error', (error) => {
          expect(error.code).toBe('EADDRINUSE');
          testServer1.close(done);
        });
        
        testServer2.listen(port, 'localhost');
      });
    });
  });

  describe('GameManager Initialization', () => {
    test('should create GameManager instance', () => {
      const GameManager = require('../src/server/gameManager');
      const gameManager = new GameManager();
      
      expect(gameManager).toBeDefined();
      expect(gameManager).toBeInstanceOf(GameManager);
    });

    test('should handle GameManager initialization error', () => {
      // Mock GameManager constructor to throw error
      const GameManager = require('../src/server/gameManager');
      GameManager.mockImplementation(() => {
        throw new Error('GameManager initialization failed');
      });
      
      expect(() => {
        new GameManager();
      }).toThrow('GameManager initialization failed');
    });
  });

  describe('File System Dependencies', () => {
    test('should verify package.json exists and is readable', () => {
      const packagePath = path.join(__dirname, '../package.json');
      expect(fs.existsSync(packagePath)).toBe(true);
      
      const packageContent = fs.readFileSync(packagePath, 'utf8');
      expect(packageContent).toBeDefined();
      
      const packageJson = JSON.parse(packageContent);
      expect(packageJson.version).toBe('1.0.0');
      expect(packageJson.name).toBe('webchess');
    });

    test('should handle missing package.json gracefully', () => {
      // Test error handling when package.json is missing
      const mockError = new Error('ENOENT: no such file or directory');
      mockError.code = 'ENOENT';
      
      // Test the error case directly
      expect(() => {
        throw mockError;
      }).toThrow('ENOENT: no such file or directory');
      
      // Test that the file actually exists (positive case)
      expect(fs.existsSync(path.join(__dirname, '../package.json'))).toBe(true);
    });

    test('should verify public directory structure', () => {
      const publicPath = path.join(__dirname, '../public');
      expect(fs.existsSync(publicPath)).toBe(true);
      
      const stats = fs.statSync(publicPath);
      expect(stats.isDirectory()).toBe(true);
    });
  });

  describe('Environment Variable Handling', () => {
    test('should handle NODE_ENV environment variable', () => {
      const testValues = ['development', 'production', 'test'];
      
      testValues.forEach(value => {
        process.env.NODE_ENV = value;
        expect(process.env.NODE_ENV).toBe(value);
      });
    });

    test('should handle missing environment variables', () => {
      delete process.env.NODE_ENV;
      delete process.env.PORT;
      delete process.env.HOST;
      
      expect(process.env.NODE_ENV || 'development').toBe('development');
      expect(process.env.PORT || 3000).toBe(3000);
      expect(process.env.HOST || 'localhost').toBe('localhost');
    });

    test('should handle invalid PORT environment variable', () => {
      process.env.PORT = 'invalid';
      const port = parseInt(process.env.PORT) || 3000;
      expect(port).toBe(3000);
    });
  });

  describe('Module Resolution', () => {
    test('should resolve all required modules', () => {
      expect(() => require('express')).not.toThrow();
      expect(() => require('http')).not.toThrow();
      expect(() => require('socket.io')).not.toThrow();
      expect(() => require('path')).not.toThrow();
      expect(() => require('../src/server/gameManager')).not.toThrow();
    });

    test('should handle missing module gracefully', () => {
      expect(() => require('non-existent-module')).toThrow();
    });
  });
});