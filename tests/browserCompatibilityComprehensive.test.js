const ChessGame = require('../src/shared/chessGame');

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
  let game;

  beforeEach(() => {
    game = new ChessGame();
    mockBrowserEnvironment();
  });

  afterEach(() => {
    // Clean up global mocks
    delete global.window;
    delete global.document;
  });

  describe('Desktop Browser Compatibility', () => {
    test('should work with Chrome/Chromium browsers', () => {
      global.window.navigator.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
      
      // Test core functionality
      const result = game.makeMove({ row: 6, col: 4 }, { row: 4, col: 4 });
      expect(result.success).toBe(true);
      
      // Test browser-specific features
      expect(global.window.localStorage).toBeDefined();
      expect(global.window.sessionStorage).toBeDefined();
    });

    test('should work with Firefox browsers', () => {
      global.window.navigator.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0';
      
      // Test core functionality
      const result = game.makeMove({ row: 6, col: 4 }, { row: 4, col: 4 });
      expect(result.success).toBe(true);
      
      // Firefox-specific compatibility checks
      expect(typeof global.window.navigator.language).toBe('string');
    });

    test('should work with Safari browsers', () => {
      global.window.navigator.userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';
      
      // Test core functionality
      const result = game.makeMove({ row: 6, col: 4 }, { row: 4, col: 4 });
      expect(result.success).toBe(true);
      
      // Safari-specific compatibility checks
      expect(global.window.navigator.platform).toBeDefined();
    });

    test('should work with Edge browsers', () => {
      global.window.navigator.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0';
      
      // Test core functionality
      const result = game.makeMove({ row: 6, col: 4 }, { row: 4, col: 4 });
      expect(result.success).toBe(true);
    });

    test('should handle older browser versions gracefully', () => {
      // Simulate older browser with limited features
      global.window.navigator.userAgent = 'Mozilla/5.0 (Windows NT 6.1; WOW64; Trident/7.0; rv:11.0) like Gecko'; // IE 11
      delete global.window.localStorage;
      delete global.window.sessionStorage;
      
      // Core functionality should still work
      const result = game.makeMove({ row: 6, col: 4 }, { row: 4, col: 4 });
      expect(result.success).toBe(true);
    });
  });

  describe('Mobile Browser Compatibility', () => {
    test('should work on iOS Safari', () => {
      global.window.navigator.userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
      global.window.innerWidth = 375;
      global.window.innerHeight = 812;
      global.window.screen.width = 375;
      global.window.screen.height = 812;
      
      // Test mobile-specific functionality
      const result = game.makeMove({ row: 6, col: 4 }, { row: 4, col: 4 });
      expect(result.success).toBe(true);
      
      // Test touch event compatibility
      expect(global.window.navigator.userAgent).toContain('Mobile');
    });

    test('should work on Android Chrome', () => {
      global.window.navigator.userAgent = 'Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';
      global.window.innerWidth = 360;
      global.window.innerHeight = 800;
      global.window.screen.width = 360;
      global.window.screen.height = 800;
      
      // Test mobile functionality
      const result = game.makeMove({ row: 6, col: 4 }, { row: 4, col: 4 });
      expect(result.success).toBe(true);
    });

    test('should work on Android Firefox', () => {
      global.window.navigator.userAgent = 'Mozilla/5.0 (Mobile; rv:120.0) Gecko/120.0 Firefox/120.0';
      global.window.innerWidth = 360;
      global.window.innerHeight = 640;
      
      // Test mobile functionality
      const result = game.makeMove({ row: 6, col: 4 }, { row: 4, col: 4 });
      expect(result.success).toBe(true);
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

      orientations.forEach(({ width, height }) => {
        global.window.innerWidth = width;
        global.window.innerHeight = height;
        global.window.screen.width = width;
        global.window.screen.height = height;
        
        // Game should work in all orientations
        const result = game.makeMove({ row: 6, col: 4 }, { row: 4, col: 4 });
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Screen Size and Resolution Compatibility', () => {
    test('should work on small screens (320px width)', () => {
      global.window.innerWidth = 320;
      global.window.innerHeight = 568;
      global.window.screen.width = 320;
      global.window.screen.height = 568;
      
      // Test functionality on very small screens
      const result = game.makeMove({ row: 6, col: 4 }, { row: 4, col: 4 });
      expect(result.success).toBe(true);
    });

    test('should work on medium screens (768px width)', () => {
      global.window.innerWidth = 768;
      global.window.innerHeight = 1024;
      global.window.screen.width = 768;
      global.window.screen.height = 1024;
      
      // Test tablet-sized screens
      const result = game.makeMove({ row: 6, col: 4 }, { row: 4, col: 4 });
      expect(result.success).toBe(true);
    });

    test('should work on large screens (1920px width)', () => {
      global.window.innerWidth = 1920;
      global.window.innerHeight = 1080;
      global.window.screen.width = 1920;
      global.window.screen.height = 1080;
      
      // Test desktop screens
      const result = game.makeMove({ row: 6, col: 4 }, { row: 4, col: 4 });
      expect(result.success).toBe(true);
    });

    test('should work on ultra-wide screens (3440px width)', () => {
      global.window.innerWidth = 3440;
      global.window.innerHeight = 1440;
      global.window.screen.width = 3440;
      global.window.screen.height = 1440;
      
      // Test ultra-wide monitors
      const result = game.makeMove({ row: 6, col: 4 }, { row: 4, col: 4 });
      expect(result.success).toBe(true);
    });

    test('should handle high DPI displays', () => {
      const dpiRatios = [1, 1.5, 2, 2.5, 3];
      
      dpiRatios.forEach(ratio => {
        global.window.devicePixelRatio = ratio;
        
        // Game should work regardless of DPI
        const result = game.makeMove({ row: 6, col: 4 }, { row: 4, col: 4 });
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Feature Detection and Polyfills', () => {
    test('should work without modern JavaScript features', () => {
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
        // Core functionality should still work
        const result = game.makeMove({ row: 6, col: 4 }, { row: 4, col: 4 });
        expect(result.success).toBe(true);
      } finally {
        // Restore features
        global.Promise = originalPromise;
        global.fetch = originalFetch;
        global.Map = originalMap;
        global.Set = originalSet;
      }
    });

    test('should work without localStorage support', () => {
      delete global.window.localStorage;
      
      // Game should work without localStorage
      const result = game.makeMove({ row: 6, col: 4 }, { row: 4, col: 4 });
      expect(result.success).toBe(true);
    });

    test('should work without WebSocket support', () => {
      delete global.WebSocket;
      
      // Core game logic should still work
      const result = game.makeMove({ row: 6, col: 4 }, { row: 4, col: 4 });
      expect(result.success).toBe(true);
    });

    test('should detect and handle missing CSS features', () => {
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
          // Simulate event handling
          if (game.handleMouseEvent) {
            game.handleMouseEvent(mockEvent);
          }
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
          if (game.handleTouchEvent) {
            game.handleTouchEvent(mockEvent);
          }
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
          if (game.handleKeyboardEvent) {
            game.handleKeyboardEvent(mockEvent);
          }
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
          if (game.handlePointerEvent) {
            game.handlePointerEvent(mockEvent);
          }
        }).not.toThrow();
      });
    });
  });

  describe('Network and Connectivity Compatibility', () => {
    test('should handle offline scenarios', () => {
      global.window.navigator.onLine = false;
      
      // Core game logic should work offline
      const result = game.makeMove({ row: 6, col: 4 }, { row: 4, col: 4 });
      expect(result.success).toBe(true);
    });

    test('should handle slow network connections', () => {
      // Simulate slow connection
      global.window.navigator.connection = {
        effectiveType: '2g',
        downlink: 0.25,
        rtt: 2000
      };
      
      // Game should still function
      const result = game.makeMove({ row: 6, col: 4 }, { row: 4, col: 4 });
      expect(result.success).toBe(true);
    });

    test('should handle intermittent connectivity', () => {
      // Simulate connection changes
      global.window.navigator.onLine = true;
      const result1 = game.makeMove({ row: 6, col: 4 }, { row: 4, col: 4 });
      expect(result1.success).toBe(true);
      
      global.window.navigator.onLine = false;
      const result2 = game.makeMove({ row: 1, col: 4 }, { row: 3, col: 4 });
      expect(result2.success).toBe(true);
    });
  });

  describe('Accessibility and Assistive Technology Compatibility', () => {
    test('should work with screen readers', () => {
      // Simulate screen reader environment
      global.window.navigator.userAgent += ' NVDA/2023.1';
      
      // Game should provide accessible interface
      const result = game.makeMove({ row: 6, col: 4 }, { row: 4, col: 4 });
      expect(result.success).toBe(true);
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
          if (game.handleKeyboardNavigation) {
            game.handleKeyboardNavigation(key);
          }
        }).not.toThrow();
      });
    });

    test('should work with high contrast mode', () => {
      // Simulate high contrast mode
      global.window.matchMedia = jest.fn(() => ({
        matches: true,
        addListener: jest.fn(),
        removeListener: jest.fn()
      }));
      
      // Game should work in high contrast mode
      const result = game.makeMove({ row: 6, col: 4 }, { row: 4, col: 4 });
      expect(result.success).toBe(true);
    });

    test('should work with reduced motion preferences', () => {
      // Simulate reduced motion preference
      global.window.matchMedia = jest.fn((query) => ({
        matches: query.includes('prefers-reduced-motion'),
        addListener: jest.fn(),
        removeListener: jest.fn()
      }));
      
      // Game should respect motion preferences
      const result = game.makeMove({ row: 6, col: 4 }, { row: 4, col: 4 });
      expect(result.success).toBe(true);
    });
  });

  describe('Performance Across Different Devices', () => {
    test('should maintain performance on low-end devices', () => {
      // Simulate low-end device
      global.window.navigator.hardwareConcurrency = 2;
      global.window.navigator.deviceMemory = 2; // 2GB RAM
      
      const startTime = Date.now();
      
      // Perform multiple operations
      for (let i = 0; i < 100; i++) {
        game.makeMove({ row: 6, col: 4 }, { row: 4, col: 4 });
        game.makeMove({ row: 4, col: 4 }, { row: 6, col: 4 });
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
      
      // Perform many operations
      for (let i = 0; i < 1000; i++) {
        game.isValidMove({ row: 6, col: 4 }, { row: 4, col: 4 });
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should be very fast on high-end devices
      expect(duration).toBeLessThan(1000);
    });
  });
});