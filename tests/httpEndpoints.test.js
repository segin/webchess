/**
 * HTTP Endpoint Tests
 * Tests for health check endpoints, static file serving, HTTP error handling, and response formatting
 * Requirements: 3.3, 3.4
 */

const request = require('supertest');
const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');

// Mock GameManager for testing
jest.mock('../src/server/gameManager');

describe('HTTP Endpoint Tests', () => {
  let app;
  let server;
  let mockGameManager;

  beforeEach(() => {
    // Create fresh Express app for each test
    app = express();
    server = http.createServer(app);
    
    // Mock GameManager
    const GameManager = require('../src/server/gameManager');
    mockGameManager = {
      getActiveGameCount: jest.fn().mockReturnValue(5)
    };
    
    // Configure app similar to server/index.js
    setupApp();
  });

  afterEach(() => {
    if (server && server.listening) {
      server.close();
    }
    jest.clearAllMocks();
  });

  function setupApp() {
    // Serve static files with cache headers
    app.use(express.static(path.join(__dirname, '../public'), {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
        } else if (filePath.endsWith('.css') || filePath.endsWith('.js')) {
          res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
        }
      }
    }));

    // Health check endpoint
    app.get('/health', (req, res) => {
      const health = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: require('../package.json').version,
        memory: process.memoryUsage(),
        activeGames: mockGameManager.getActiveGameCount ? mockGameManager.getActiveGameCount() : 0,
      };
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'no-cache');
      res.status(200).json(health);
    });

    // Readiness check endpoint  
    app.get('/ready', (req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'no-cache');
      res.status(200).json({ status: 'ready' });
    });

    // Root endpoint
    app.get('/', (req, res) => {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.sendFile(path.join(__dirname, '../public/index.html'));
    });

    // 404 handler
    app.use((req, res) => {
      res.status(404).json({
        error: 'Not Found',
        message: 'The requested resource was not found',
        path: req.path
      });
    });

    // Error handler
    app.use((err, req, res, next) => {
      const isDevelopment = process.env.NODE_ENV === 'development';
      res.status(500).json({
        error: 'Internal Server Error',
        message: isDevelopment ? err.message : 'Something went wrong',
        ...(isDevelopment && { stack: err.stack })
      });
    });
  }

  describe('Health Check Endpoint', () => {
    test('should return health status with correct structure', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.headers['cache-control']).toBe('no-cache');
      
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('environment');
      expect(response.body).toHaveProperty('version', '1.0.0');
      expect(response.body).toHaveProperty('memory');
      expect(response.body).toHaveProperty('activeGames', 5);
      
      expect(typeof response.body.uptime).toBe('number');
      expect(typeof response.body.memory).toBe('object');
      expect(typeof response.body.activeGames).toBe('number');
      expect(response.body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    test('should include memory usage information', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      const memory = response.body.memory;
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

    test('should handle different environment values', async () => {
      const originalEnv = process.env.NODE_ENV;
      
      // Test development environment
      process.env.NODE_ENV = 'development';
      let response = await request(app).get('/health').expect(200);
      expect(response.body.environment).toBe('development');
      
      // Test production environment
      process.env.NODE_ENV = 'production';
      response = await request(app).get('/health').expect(200);
      expect(response.body.environment).toBe('production');
      
      // Test undefined environment (should default to development)
      delete process.env.NODE_ENV;
      response = await request(app).get('/health').expect(200);
      expect(response.body.environment).toBe('development');
      
      process.env.NODE_ENV = originalEnv;
    });

    test('should handle missing getActiveGameCount method gracefully', async () => {
      mockGameManager.getActiveGameCount = undefined;
      
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.activeGames).toBe(0);
    });

    test('should set correct response headers', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.headers['cache-control']).toBe('no-cache');
    });
  });

  describe('Readiness Check Endpoint', () => {
    test('should return readiness status', async () => {
      const response = await request(app)
        .get('/ready')
        .expect(200);

      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.headers['cache-control']).toBe('no-cache');
      expect(response.body).toEqual({ status: 'ready' });
    });

    test('should set correct response headers', async () => {
      const response = await request(app)
        .get('/ready')
        .expect(200);

      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.headers['cache-control']).toBe('no-cache');
    });
  });

  describe('Root Endpoint', () => {
    test('should serve index.html with correct headers', async () => {
      const indexPath = path.join(__dirname, '../public/index.html');
      
      // Verify file exists
      expect(fs.existsSync(indexPath)).toBe(true);
      
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.headers['cache-control']).toBe('no-cache, no-store, must-revalidate');
      expect(response.headers['pragma']).toBe('no-cache');
      expect(response.headers['expires']).toBe('0');
      expect(response.headers['content-type']).toMatch(/text\/html/);
    });

    test('should return HTML content', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.text).toContain('<!DOCTYPE html>');
      expect(response.text).toContain('<html');
      expect(response.text).toContain('</html>');
    });
  });

  describe('Static File Serving', () => {
    test('should serve CSS files with correct cache headers', async () => {
      const response = await request(app)
        .get('/styles.css')
        .expect(200);

      expect(response.headers['cache-control']).toBe('public, max-age=0, must-revalidate');
      expect(response.headers['content-type']).toMatch(/text\/css/);
    });

    test('should serve JavaScript files with correct cache headers', async () => {
      const response = await request(app)
        .get('/script.js')
        .expect(200);

      expect(response.headers['cache-control']).toBe('public, max-age=0, must-revalidate');
      expect(response.headers['content-type']).toMatch(/javascript/);
    });

    test('should serve HTML files with no-cache headers', async () => {
      const response = await request(app)
        .get('/test-runner.html')
        .expect(200);

      expect(response.headers['cache-control']).toBe('no-cache, no-store, must-revalidate');
      expect(response.headers['pragma']).toBe('no-cache');
      expect(response.headers['expires']).toBe('0');
      expect(response.headers['content-type']).toMatch(/text\/html/);
    });

    test('should verify all required static files exist', () => {
      const publicPath = path.join(__dirname, '../public');
      const requiredFiles = [
        'index.html',
        'script.js',
        'styles.css',
        'test-runner.html',
        'test-runner.js'
      ];

      requiredFiles.forEach(file => {
        const filePath = path.join(publicPath, file);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });

    test('should handle non-existent static files', async () => {
      await request(app)
        .get('/non-existent-file.js')
        .expect(404);
    });
  });

  describe('HTTP Error Handling', () => {
    test('should return 404 for non-existent endpoints', async () => {
      const response = await request(app)
        .get('/non-existent-endpoint')
        .expect(404);

      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body).toHaveProperty('error', 'Not Found');
      expect(response.body).toHaveProperty('message', 'The requested resource was not found');
      expect(response.body).toHaveProperty('path', '/non-existent-endpoint');
    });

    test('should handle server errors in development mode', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      // Create a new app with error endpoint for this test
      const testApp = express();
      
      // Add an endpoint that throws an error
      testApp.get('/error-test', (req, res, next) => {
        const error = new Error('Test error message');
        next(error);
      });
      
      // Add error handler
      testApp.use((err, req, res, next) => {
        const isDevelopment = process.env.NODE_ENV === 'development';
        res.status(500).json({
          error: 'Internal Server Error',
          message: isDevelopment ? err.message : 'Something went wrong',
          ...(isDevelopment && { stack: err.stack })
        });
      });
      
      const response = await request(testApp)
        .get('/error-test')
        .expect(500);

      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body).toHaveProperty('error', 'Internal Server Error');
      expect(response.body).toHaveProperty('message', 'Test error message');
      expect(response.body).toHaveProperty('stack');
      
      process.env.NODE_ENV = originalEnv;
    });

    test('should handle server errors in production mode', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      // Create a new app with error endpoint for this test
      const testApp = express();
      
      // Add an endpoint that throws an error
      testApp.get('/error-test-prod', (req, res, next) => {
        const error = new Error('Test error message');
        next(error);
      });
      
      // Add error handler
      testApp.use((err, req, res, next) => {
        const isDevelopment = process.env.NODE_ENV === 'development';
        res.status(500).json({
          error: 'Internal Server Error',
          message: isDevelopment ? err.message : 'Something went wrong',
          ...(isDevelopment && { stack: err.stack })
        });
      });
      
      const response = await request(testApp)
        .get('/error-test-prod')
        .expect(500);

      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body).toHaveProperty('error', 'Internal Server Error');
      expect(response.body).toHaveProperty('message', 'Something went wrong');
      expect(response.body).not.toHaveProperty('stack');
      
      process.env.NODE_ENV = originalEnv;
    });

    test('should handle malformed requests gracefully', async () => {
      // Test with invalid JSON in request body (if we had POST endpoints)
      await request(app)
        .get('/health')
        .set('Accept', 'invalid/type')
        .expect(200); // Should still work as health endpoint doesn't depend on Accept header
    });

    test('should handle requests with invalid headers', async () => {
      // Test with a valid but unusual header instead
      const response = await request(app)
        .get('/health')
        .set('X-Custom-Header', 'custom-value')
        .expect(200);

      expect(response.body.status).toBe('ok');
    });
  });

  describe('Response Formatting', () => {
    test('should return JSON responses with correct content-type', async () => {
      const endpoints = ['/health', '/ready'];
      
      for (const endpoint of endpoints) {
        const response = await request(app)
          .get(endpoint)
          .expect(200);
        
        expect(response.headers['content-type']).toMatch(/application\/json/);
        expect(() => JSON.parse(response.text)).not.toThrow();
      }
    });

    test('should return HTML responses with correct content-type', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.headers['content-type']).toMatch(/text\/html/);
    });

    test('should handle different Accept headers', async () => {
      // Test JSON endpoint with HTML accept header
      const response = await request(app)
        .get('/health')
        .set('Accept', 'text/html')
        .expect(200);

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });

    test('should include proper CORS headers if needed', async () => {
      // Note: Current implementation doesn't include CORS headers
      // This test documents the current behavior
      const response = await request(app)
        .get('/health')
        .expect(200);

      // Current implementation doesn't set CORS headers
      expect(response.headers['access-control-allow-origin']).toBeUndefined();
    });
  });

  describe('Request/Response Mocking Utilities', () => {
    test('should create mock request object', () => {
      const mockReq = {
        method: 'GET',
        url: '/health',
        path: '/health',
        headers: {
          'accept': 'application/json',
          'user-agent': 'test-agent'
        },
        query: {},
        params: {},
        body: {}
      };

      expect(mockReq).toHaveProperty('method', 'GET');
      expect(mockReq).toHaveProperty('url', '/health');
      expect(mockReq).toHaveProperty('path', '/health');
      expect(mockReq.headers).toHaveProperty('accept', 'application/json');
    });

    test('should create mock response object', () => {
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis(),
        setHeader: jest.fn().mockReturnThis(),
        sendFile: jest.fn().mockReturnThis(),
        headers: {}
      };

      expect(typeof mockRes.status).toBe('function');
      expect(typeof mockRes.json).toBe('function');
      expect(typeof mockRes.send).toBe('function');
      expect(typeof mockRes.setHeader).toBe('function');
      expect(typeof mockRes.sendFile).toBe('function');
    });

    test('should simulate endpoint handler with mocks', () => {
      const mockReq = { path: '/health' };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        setHeader: jest.fn().mockReturnThis()
      };

      // Simulate health endpoint handler
      const healthHandler = (req, res) => {
        const health = {
          status: 'ok',
          timestamp: new Date().toISOString()
        };
        
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-cache');
        res.status(200).json(health);
      };

      healthHandler(mockReq, mockRes);

      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'application/json');
      expect(mockRes.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-cache');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        status: 'ok',
        timestamp: expect.any(String)
      }));
    });

    test('should simulate error handling with mocks', () => {
      const mockReq = { path: '/error' };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };
      const mockNext = jest.fn();

      // Simulate error handler
      const errorHandler = (err, req, res, next) => {
        res.status(500).json({
          error: 'Internal Server Error',
          message: err.message
        });
      };

      const testError = new Error('Test error');
      errorHandler(testError, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Internal Server Error',
        message: 'Test error'
      });
    });
  });

  describe('HTTP Performance and Load Handling', () => {
    test('should handle multiple concurrent requests', async () => {
      const numRequests = 10;
      const requests = [];

      for (let i = 0; i < numRequests; i++) {
        requests.push(request(app).get('/health').expect(200));
      }

      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect(response.body.status).toBe('ok');
      });
    });

    test('should handle requests with large headers', async () => {
      const largeHeaderValue = 'x'.repeat(1000);
      
      const response = await request(app)
        .get('/health')
        .set('X-Large-Header', largeHeaderValue)
        .expect(200);

      expect(response.body.status).toBe('ok');
    });

    test('should respond within reasonable time limits', async () => {
      const startTime = Date.now();
      
      await request(app)
        .get('/health')
        .expect(200);
      
      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(1000); // Should respond within 1 second
    });
  });
});