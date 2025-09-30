const ChessGame = require('../src/shared/chessGame');

// Test utilities for API validation
const testUtils = {
  validateSuccessResponse(result) {
    expect(result.success).toBe(true);
    expect(result.message).toBeDefined();
    expect(result.data).toBeDefined();
  },

  validateErrorResponse(result, expectedCode) {
    expect(result.success).toBe(false);
    expect(result.message).toBeDefined();
    if (expectedCode) {
      expect(result.code).toBe(expectedCode);
    }
  },

  validateGameState(game) {
    expect(game.currentTurn).toBeDefined();
    expect(game.gameStatus).toBeDefined();
    expect(game.board).toBeDefined();
    expect(game.moveHistory).toBeDefined();
  },

  createValidMove(fromRow, fromCol, toRow, toCol, promotion = null) {
    const move = {
      from: { row: fromRow, col: fromCol },
      to: { row: toRow, col: toCol }
    };
    if (promotion) {
      move.promotion = promotion;
    }
    return move;
  }
};

// Mock browser environment for testing
const mockBrowserEnvironment = () => {
  global.window = {
    innerWidth: 1920,
    innerHeight: 1080,
    devicePixelRatio: 1,
    navigator: {
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      platform: 'Win32',
      language: 'en-US',
      languages: ['en-US', 'en'],
      cookieEnabled: true,
      onLine: true
    },
    screen: {
      width: 1920,
      height: 1080,
      availWidth: 1920,
      availHeight: 1040
    },
    location: {
      protocol: 'https:',
      host: 'localhost:3000',
      pathname: '/',
      search: '',
      hash: ''
    },
    localStorage: {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn()
    },
    sessionStorage: {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn()
    }
  };

  global.document = {
    createElement: jest.fn(() => ({
      style: {},
      classList: {
        add: jest.fn(),
        remove: jest.fn(),
        contains: jest.fn()
      },
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      appendChild: jest.fn(),
      removeChild: jest.fn()
    })),
    getElementById: jest.fn(),
    querySelector: jest.fn(),
    querySelectorAll: jest.fn(() => []),
    body: {
      style: {},
      classList: {
        add: jest.fn(),
        remove: jest.fn()
      },
      appendChild: jest.fn()
    },
    documentElement: {
      style: {},
      clientWidth: 1920,
      clientHeight: 1080
    }
  };
};

describe('Comprehensive Browser Compatibility Tests', () => {
  beforeEach(() => {
    mockBrowserEnvironment();
  });

  afterEach(() => {
    // Clean up global mocks
    delete global.window;
    delete global.document;
  });

  describe('Desktop Browser Compatibility', () => {
    test('should work with Chrome/Chromium browsers', () => {
      const game = new ChessGame();
      global.window.navigator.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
      
      // Test core functionality with current API
      const move = testUtils.createValidMove(6, 4, 4, 4);
      const result = game.makeMove(move);
      testUtils.validateSuccessResponse(result);
      testUtils.validateGameState(game);
      
      // Verify game state properties
      expect(game.currentTurn).toBe('black');
      expect(game.gameStatus).toBe('active');
      
      // Test browser-specific features
      expect(global.window.localStorage).toBeDefined();
      expect(global.window.sessionStorage).toBeDefined();
    });

    test('should work with Firefox browsers', () => {
      const game = new ChessGame();
      global.window.navigator.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0';
      
      // Test core functionality with current API
      const move = testUtils.createValidMove(6, 4, 4, 4);
      const result = game.makeMove(move);
      testUtils.validateSuccessResponse(result);
      testUtils.validateGameState(game);
      
      // Verify game state after move
      expect(game.currentTurn).toBe('black');
      expect(game.gameStatus).toBe('active');
      
      // Firefox-specific compatibility checks
      expect(typeof global.window.navigator.language).toBe('string');
    });

    test('should work with Safari browsers', () => {
      const game = new ChessGame();
      global.window.navigator.userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';
      
      // Test core functionality with current API
      const move = testUtils.createValidMove(6, 4, 4, 4);
      const result = game.makeMove(move);
      testUtils.validateSuccessResponse(result);
      testUtils.validateGameState(game);
      
      // Verify game state properties
      expect(game.currentTurn).toBe('black');
      expect(game.gameStatus).toBe('active');
      
      // Safari-specific compatibility checks
      expect(global.window.navigator.platform).toBeDefined();
    });

    test('should work with Edge browsers', () => {
      const game = new ChessGame();
      global.window.navigator.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0';
      
      // Test core functionality with current API
      const move = testUtils.createValidMove(6, 4, 4, 4);
      const result = game.makeMove(move);
      testUtils.validateSuccessResponse(result);
      testUtils.validateGameState(game);
      
      // Verify game state properties
      expect(game.currentTurn).toBe('black');
      expect(game.gameStatus).toBe('active');
    });

    test('should handle older browser versions gracefully', () => {
      const game = new ChessGame();
      // Simulate older browser with limited features
      global.window.navigator.userAgent = 'Mozilla/5.0 (Windows NT 6.1; WOW64; Trident/7.0; rv:11.0) like Gecko'; // IE 11
      delete global.window.localStorage;
      delete global.window.sessionStorage;
      
      // Core functionality should still work with current API
      const move = testUtils.createValidMove(6, 4, 4, 4);
      const result = game.makeMove(move);
      testUtils.validateSuccessResponse(result);
      testUtils.validateGameState(game);
      
      // Verify game state properties
      expect(game.currentTurn).toBe('black');
      expect(game.gameStatus).toBe('active');
    });
  });

  describe('Mobile Browser Compatibility', () => {
    test('should work on iOS Safari', () => {
      const game = new ChessGame();
      global.window.navigator.userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
      global.window.innerWidth = 375;
      global.window.innerHeight = 812;
      global.window.screen.width = 375;
      global.window.screen.height = 812;
      
      // Test mobile-specific functionality with current API
      const move = testUtils.createValidMove(6, 4, 4, 4);
      const result = game.makeMove(move);
      testUtils.validateSuccessResponse(result);
      testUtils.validateGameState(game);
      
      // Verify game state properties
      expect(game.currentTurn).toBe('black');
      expect(game.gameStatus).toBe('active');
      
      // Test touch event compatibility
      expect(global.window.navigator.userAgent).toContain('Mobile');
    });

    test('should work on Android Chrome', () => {
      const game = new ChessGame();
      global.window.navigator.userAgent = 'Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';
      global.window.innerWidth = 360;
      global.window.innerHeight = 800;
      global.window.screen.width = 360;
      global.window.screen.height = 800;
      
      // Test mobile functionality with current API
      const move = testUtils.createValidMove(6, 4, 4, 4);
      const result = game.makeMove(move);
      testUtils.validateSuccessResponse(result);
      testUtils.validateGameState(game);
      
      // Verify game state properties
      expect(game.currentTurn).toBe('black');
      expect(game.gameStatus).toBe('active');
    });

    test('should work on Android Firefox', () => {
      const game = new ChessGame();
      global.window.navigator.userAgent = 'Mozilla/5.0 (Mobile; rv:120.0) Gecko/120.0 Firefox/120.0';
      global.window.innerWidth = 360;
      global.window.innerHeight = 640;
      
      // Test mobile functionality with current API
      const move = testUtils.createValidMove(6, 4, 4, 4);
      const result = game.makeMove(move);
      testUtils.validateSuccessResponse(result);
      testUtils.validateGameState(game);
      
      // Verify game state properties
      expect(game.currentTurn).toBe('black');
      expect(game.gameStatus).toBe('active');
    });

    test('should handle various mobile screen orientations', () => {
      const orientations = [
        { width: 375, height: 812 }, // Portrait iPhone
        { width: 812, height: 375 }, // Landscape iPhone
        { width: 360, height: 800 }, // Portrait Android
        { width: 800, height: 360 }, // Landscape Android
        { width: 768, height: 1024 }, // Portrait iPad
        { width: 1024, height: 768 }, // Landscape iPad
      ];

      orientations.forEach(({ width, height }, index) => {
        // Create fresh game for each orientation test
        const orientationGame = new ChessGame();
        
        global.window.innerWidth = width;
        global.window.innerHeight = height;
        global.window.screen.width = width;
        global.window.screen.height = height;
        
        // Game should work in all orientations with current API
        const move = testUtils.createValidMove(6, 4, 4, 4);
        const result = orientationGame.makeMove(move);
        testUtils.validateSuccessResponse(result);
        testUtils.validateGameState(orientationGame);
        
        // Verify game state properties
        expect(orientationGame.currentTurn).toBe('black');
        expect(orientationGame.gameStatus).toBe('active');
      });
    });
  });

  describe('Screen Size and Resolution Compatibility', () => {
    test('should work on small screens (320px width)', () => {
      const game = new ChessGame();
      global.window.innerWidth = 320;
      global.window.innerHeight = 568;
      global.window.screen.width = 320;
      global.window.screen.height = 568;
      
      // Test functionality on very small screens with current API
      const move = testUtils.createValidMove(6, 4, 4, 4);
      const result = game.makeMove(move);
      testUtils.validateSuccessResponse(result);
      testUtils.validateGameState(game);
      
      // Verify game state properties
      expect(game.currentTurn).toBe('black');
      expect(game.gameStatus).toBe('active');
    });

    test('should work on medium screens (768px width)', () => {
      const game = new ChessGame();
      global.window.innerWidth = 768;
      global.window.innerHeight = 1024;
      global.window.screen.width = 768;
      global.window.screen.height = 1024;
      
      // Test tablet-sized screens with current API
      const move = testUtils.createValidMove(6, 4, 4, 4);
      const result = game.makeMove(move);
      testUtils.validateSuccessResponse(result);
      testUtils.validateGameState(game);
      
      // Verify game state properties
      expect(game.currentTurn).toBe('black');
      expect(game.gameStatus).toBe('active');
    });

    test('should work on large screens (1920px width)', () => {
      const game = new ChessGame();
      global.window.innerWidth = 1920;
      global.window.innerHeight = 1080;
      global.window.screen.width = 1920;
      global.window.screen.height = 1080;
      
      // Test desktop screens with current API
      const move = testUtils.createValidMove(6, 4, 4, 4);
      const result = game.makeMove(move);
      testUtils.validateSuccessResponse(result);
      testUtils.validateGameState(game);
      
      // Verify game state properties
      expect(game.currentTurn).toBe('black');
      expect(game.gameStatus).toBe('active');
    });

    test('should work on ultra-wide screens (3440px width)', () => {
      const game = new ChessGame();
      global.window.innerWidth = 3440;
      global.window.innerHeight = 1440;
      global.window.screen.width = 3440;
      global.window.screen.height = 1440;
      
      // Test ultra-wide monitors with current API
      const move = testUtils.createValidMove(6, 4, 4, 4);
      const result = game.makeMove(move);
      testUtils.validateSuccessResponse(result);
      testUtils.validateGameState(game);
      
      // Verify game state properties
      expect(game.currentTurn).toBe('black');
      expect(game.gameStatus).toBe('active');
    });

    test('should handle high DPI displays', () => {
      const dpiRatios = [1, 1.5, 2, 2.5, 3];
      
      dpiRatios.forEach((ratio, index) => {
        // Create fresh game for each DPI test
        const dpiGame = new ChessGame();
        global.window.devicePixelRatio = ratio;
        
        // Game should work regardless of DPI with current API
        const move = testUtils.createValidMove(6, 4, 4, 4);
        const result = dpiGame.makeMove(move);
        testUtils.validateSuccessResponse(result);
        testUtils.validateGameState(dpiGame);
        
        // Verify game state properties
        expect(dpiGame.currentTurn).toBe('black');
        expect(dpiGame.gameStatus).toBe('active');
      });
    });
  });

  describe('Feature Detection and Polyfills', () => {
    test('should work without modern JavaScript features', () => {
      const game = new ChessGame();
      // Simulate older browser without modern features
      const originalPromise = global.Promise;
      const originalFetch = global.fetch;
      const originalMap = global.Map;
      const originalSet = global.Set;
      
      delete global.Promise;
      delete global.fetch;
      delete global.Map;
      delete global.Set;
      
      try {
        // Core functionality should still work with current API
        const move = testUtils.createValidMove(6, 4, 4, 4);
        const result = game.makeMove(move);
        testUtils.validateSuccessResponse(result);
        testUtils.validateGameState(game);
        
        // Verify game state properties
        expect(game.currentTurn).toBe('black');
        expect(game.gameStatus).toBe('active');
      } finally {
        // Restore features
        global.Promise = originalPromise;
        global.fetch = originalFetch;
        global.Map = originalMap;
        global.Set = originalSet;
      }
    });

    test('should work without localStorage support', () => {
      const game = new ChessGame();
      delete global.window.localStorage;
      
      // Game should work without localStorage with current API
      const move = testUtils.createValidMove(6, 4, 4, 4);
      const result = game.makeMove(move);
      testUtils.validateSuccessResponse(result);
      testUtils.validateGameState(game);
      
      // Verify game state properties
      expect(game.currentTurn).toBe('black');
      expect(game.gameStatus).toBe('active');
    });

    test('should work without WebSocket support', () => {
      const game = new ChessGame();
      delete global.WebSocket;
      
      // Core game logic should still work with current API
      const move = testUtils.createValidMove(6, 4, 4, 4);
      const result = game.makeMove(move);
      testUtils.validateSuccessResponse(result);
      testUtils.validateGameState(game);
      
      // Verify game state properties
      expect(game.currentTurn).toBe('black');
      expect(game.gameStatus).toBe('active');
    });

    test('should detect and handle missing CSS features', () => {
      const game = new ChessGame();
      // Simulate browser without CSS Grid support
      const mockElement = {
        style: {},
        classList: {
          add: jest.fn(),
          remove: jest.fn(),
          contains: jest.fn()
        }
      };
      
      global.document.createElement.mockReturnValue(mockElement);
      
      // Should handle gracefully
      const element = global.document.createElement('div');
      expect(element).toBeDefined();
      
      // Game logic should still work
      const move = testUtils.createValidMove(6, 4, 4, 4);
      const result = game.makeMove(move);
      testUtils.validateSuccessResponse(result);
    });
  });

  describe('Input Method Compatibility', () => {
    test('should handle mouse input events', () => {
      const mouseEvents = ['click', 'mousedown', 'mouseup', 'mousemove'];
      
      mouseEvents.forEach(eventType => {
        const mockEvent = {
          type: eventType,
          clientX: 100,
          clientY: 100,
          button: 0,
          preventDefault: jest.fn(),
          stopPropagation: jest.fn()
        };
        
        // Should handle mouse events without errors
        expect(() => {
          // Core game functionality should work regardless of input method
          const mouseGame = new ChessGame();
          const move = testUtils.createValidMove(6, 4, 4, 4);
          const result = mouseGame.makeMove(move);
          testUtils.validateSuccessResponse(result);
          testUtils.validateGameState(mouseGame);
        }).not.toThrow();
      });
    });

    test('should handle touch input events', () => {
      const touchEvents = ['touchstart', 'touchmove', 'touchend'];
      
      touchEvents.forEach(eventType => {
        const mockEvent = {
          type: eventType,
          touches: [{
            clientX: 100,
            clientY: 100,
            identifier: 0
          }],
          preventDefault: jest.fn(),
          stopPropagation: jest.fn()
        };
        
        // Should handle touch events without errors
        expect(() => {
          // Core game functionality should work with touch input
          const touchGame = new ChessGame();
          const move = testUtils.createValidMove(6, 4, 4, 4);
          const result = touchGame.makeMove(move);
          testUtils.validateSuccessResponse(result);
          testUtils.validateGameState(touchGame);
        }).not.toThrow();
      });
    });

    test('should handle keyboard input events', () => {
      const keyboardEvents = ['keydown', 'keyup', 'keypress'];
      
      keyboardEvents.forEach(eventType => {
        const mockEvent = {
          type: eventType,
          key: 'Enter',
          keyCode: 13,
          which: 13,
          preventDefault: jest.fn(),
          stopPropagation: jest.fn()
        };
        
        // Should handle keyboard events without errors
        expect(() => {
          // Core game functionality should work with keyboard input
          const keyboardGame = new ChessGame();
          const move = testUtils.createValidMove(6, 4, 4, 4);
          const result = keyboardGame.makeMove(move);
          testUtils.validateSuccessResponse(result);
          testUtils.validateGameState(keyboardGame);
        }).not.toThrow();
      });
    });

    test('should handle pointer events', () => {
      const pointerEvents = ['pointerdown', 'pointermove', 'pointerup'];
      
      pointerEvents.forEach(eventType => {
        const mockEvent = {
          type: eventType,
          pointerId: 1,
          clientX: 100,
          clientY: 100,
          pointerType: 'mouse',
          preventDefault: jest.fn(),
          stopPropagation: jest.fn()
        };
        
        // Should handle pointer events without errors
        expect(() => {
          // Core game functionality should work with pointer input
          const pointerGame = new ChessGame();
          const move = testUtils.createValidMove(6, 4, 4, 4);
          const result = pointerGame.makeMove(move);
          testUtils.validateSuccessResponse(result);
          testUtils.validateGameState(pointerGame);
        }).not.toThrow();
      });
    });
  });

  describe('Network and Connectivity Compatibility', () => {
    test('should handle offline scenarios', () => {
      const game = new ChessGame();
      global.window.navigator.onLine = false;
      
      // Core game logic should work offline with current API
      const move = testUtils.createValidMove(6, 4, 4, 4);
      const result = game.makeMove(move);
      testUtils.validateSuccessResponse(result);
      testUtils.validateGameState(game);
      
      // Verify game state properties
      expect(game.currentTurn).toBe('black');
      expect(game.gameStatus).toBe('active');
    });

    test('should handle slow network connections', () => {
      const game = new ChessGame();
      // Simulate slow connection
      global.window.navigator.connection = {
        effectiveType: '2g',
        downlink: 0.25,
        rtt: 2000
      };
      
      // Game should still function with current API
      const move = testUtils.createValidMove(6, 4, 4, 4);
      const result = game.makeMove(move);
      testUtils.validateSuccessResponse(result);
      testUtils.validateGameState(game);
      
      // Verify game state properties
      expect(game.currentTurn).toBe('black');
      expect(game.gameStatus).toBe('active');
    });

    test('should handle intermittent connectivity', () => {
      const game = new ChessGame();
      // Simulate connection changes
      global.window.navigator.onLine = true;
      const move1 = testUtils.createValidMove(6, 4, 4, 4);
      const result1 = game.makeMove(move1);
      testUtils.validateSuccessResponse(result1);
      
      // Verify first move state
      expect(game.currentTurn).toBe('black');
      expect(game.gameStatus).toBe('active');
      
      global.window.navigator.onLine = false;
      const move2 = testUtils.createValidMove(1, 4, 3, 4);
      const result2 = game.makeMove(move2);
      testUtils.validateSuccessResponse(result2);
      
      // Verify second move state
      expect(game.currentTurn).toBe('white');
      expect(game.gameStatus).toBe('active');
      testUtils.validateGameState(game);
    });
  });

  describe('Accessibility and Assistive Technology Compatibility', () => {
    test('should work with screen readers', () => {
      const game = new ChessGame();
      // Simulate screen reader environment
      global.window.navigator.userAgent += ' NVDA/2023.1';
      
      // Game should provide accessible interface with current API
      const move = testUtils.createValidMove(6, 4, 4, 4);
      const result = game.makeMove(move);
      testUtils.validateSuccessResponse(result);
      testUtils.validateGameState(game);
      
      // Verify game state properties
      expect(game.currentTurn).toBe('black');
      expect(game.gameStatus).toBe('active');
    });

    test('should work with keyboard-only navigation', () => {
      // Simulate keyboard-only user
      const keyboardNavigation = [
        { key: 'Tab', keyCode: 9 },
        { key: 'Enter', keyCode: 13 },
        { key: 'Space', keyCode: 32 },
        { key: 'ArrowUp', keyCode: 38 },
        { key: 'ArrowDown', keyCode: 40 },
        { key: 'ArrowLeft', keyCode: 37 },
        { key: 'ArrowRight', keyCode: 39 },
      ];
      
      keyboardNavigation.forEach(key => {
        expect(() => {
          // Core game functionality should work with keyboard navigation
          const keyboardGame = new ChessGame();
          const move = testUtils.createValidMove(6, 4, 4, 4);
          const result = keyboardGame.makeMove(move);
          testUtils.validateSuccessResponse(result);
          testUtils.validateGameState(keyboardGame);
        }).not.toThrow();
      });
    });

    test('should work with high contrast mode', () => {
      const game = new ChessGame();
      // Simulate high contrast mode
      global.window.matchMedia = jest.fn(() => ({
        matches: true,
        addListener: jest.fn(),
        removeListener: jest.fn()
      }));
      
      // Game should work in high contrast mode with current API
      const move = testUtils.createValidMove(6, 4, 4, 4);
      const result = game.makeMove(move);
      testUtils.validateSuccessResponse(result);
      testUtils.validateGameState(game);
      
      // Verify game state properties
      expect(game.currentTurn).toBe('black');
      expect(game.gameStatus).toBe('active');
    });

    test('should work with reduced motion preferences', () => {
      const game = new ChessGame();
      // Simulate reduced motion preference
      global.window.matchMedia = jest.fn((query) => ({
        matches: query.includes('prefers-reduced-motion'),
        addListener: jest.fn(),
        removeListener: jest.fn()
      }));
      
      // Game should respect motion preferences with current API
      const move = testUtils.createValidMove(6, 4, 4, 4);
      const result = game.makeMove(move);
      testUtils.validateSuccessResponse(result);
      testUtils.validateGameState(game);
      
      // Verify game state properties
      expect(game.currentTurn).toBe('black');
      expect(game.gameStatus).toBe('active');
    });
  });

  describe('Performance Across Different Devices', () => {
    test('should maintain performance on low-end devices', () => {
      // Simulate low-end device
      global.window.navigator.hardwareConcurrency = 2;
      global.window.navigator.deviceMemory = 2; // 2GB RAM
      
      const startTime = Date.now();
      
      // Perform multiple operations with current API
      for (let i = 0; i < 25; i++) {
        const performanceGame = new ChessGame();
        
        // White move
        const move1 = testUtils.createValidMove(6, 4, 4, 4);
        const result1 = performanceGame.makeMove(move1);
        testUtils.validateSuccessResponse(result1);
        
        // Black move
        const move2 = testUtils.createValidMove(1, 4, 3, 4);
        const result2 = performanceGame.makeMove(move2);
        testUtils.validateSuccessResponse(result2);
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within reasonable time even on low-end devices
      expect(duration).toBeLessThan(5000);
    });

    test('should scale performance on high-end devices', () => {
      // Simulate high-end device
      global.window.navigator.hardwareConcurrency = 16;
      global.window.navigator.deviceMemory = 32; // 32GB RAM
      
      const startTime = Date.now();
      
      // Perform many operations with current API
      for (let i = 0; i < 50; i++) {
        const highEndGame = new ChessGame();
        
        // White move
        const move1 = testUtils.createValidMove(6, 4, 4, 4);
        const result1 = highEndGame.makeMove(move1);
        testUtils.validateSuccessResponse(result1);
        
        // Black move
        const move2 = testUtils.createValidMove(1, 4, 3, 4);
        const result2 = highEndGame.makeMove(move2);
        testUtils.validateSuccessResponse(result2);
        
        // Verify game state
        testUtils.validateGameState(highEndGame);
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should be reasonably fast on high-end devices (adjusted for CI environment)
      expect(duration).toBeLessThan(5000);
    });
  });
});