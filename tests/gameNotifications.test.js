/**
 * Game Notifications Tests
 * Tests for check and checkmate notification pop-ups
 */

describe('Game Notifications', () => {
  let mockClient;
  let originalDocument;

  beforeEach(() => {
    // Mock DOM elements and methods
    originalDocument = global.document;
    
    const mockElement = {
      style: {},
      textContent: '',
      innerHTML: '',
      appendChild: jest.fn(),
      removeChild: jest.fn(),
      contains: jest.fn(() => true),
      classList: {
        add: jest.fn(),
        remove: jest.fn(),
        contains: jest.fn(() => false)
      }
    };

    global.document = {
      createElement: jest.fn(() => mockElement),
      body: {
        appendChild: jest.fn(),
        removeChild: jest.fn(),
        contains: jest.fn(() => true)
      },
      getElementById: jest.fn(() => mockElement)
    };

    // Mock setTimeout to avoid actual delays in tests
    jest.useFakeTimers();

    // Create a mock WebChessClient instance with the notification methods
    mockClient = {
      gameState: {
        inCheck: false,
        status: 'active',
        currentTurn: 'white',
        winner: null
      },
      
      showCheckNotification: function(color) {
        try {
          const message = document.createElement('div');
          message.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #ff9800;
            color: white;
            padding: 15px 25px;
            border-radius: 8px;
            z-index: 10000;
            font-weight: bold;
            font-size: 1.2rem;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            border: 2px solid #f57c00;
          `;
          message.textContent = `${color.toUpperCase()} IN CHECK!`;
          document.body.appendChild(message);
          
          setTimeout(() => {
            try {
              if (document.body.contains(message)) {
                document.body.removeChild(message);
              }
            } catch (error) {
              // Silently handle removal errors
            }
          }, 3000);
        } catch (error) {
          // Silently handle DOM errors
        }
      },

      showCheckmateNotification: function(winner, loser) {
        try {
          const message = document.createElement('div');
          message.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #d32f2f;
            color: white;
            padding: 20px 30px;
            border-radius: 10px;
            z-index: 10000;
            font-weight: bold;
            font-size: 1.4rem;
            text-align: center;
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
            border: 3px solid #b71c1c;
          `;
          message.innerHTML = `
            <div style="margin-bottom: 10px;">CHECKMATE!</div>
            <div style="font-size: 1rem;">${winner.toUpperCase()} WINS!</div>
          `;
          document.body.appendChild(message);
          
          setTimeout(() => {
            try {
              if (document.body.contains(message)) {
                document.body.removeChild(message);
              }
            } catch (error) {
              // Silently handle removal errors
            }
          }, 5000);
        } catch (error) {
          // Silently handle DOM errors
        }
      }
    };
  });

  afterEach(() => {
    jest.useRealTimers();
    global.document = originalDocument;
  });

  describe('Check Notification', () => {
    test('should create and display check notification with correct styling', () => {
      mockClient.showCheckNotification('white');

      // Verify DOM element creation
      expect(document.createElement).toHaveBeenCalledWith('div');
      expect(document.body.appendChild).toHaveBeenCalled();

      // Get the created element from the mock
      const createdElement = document.createElement.mock.results[0].value;
      
      // Verify styling contains key properties
      expect(createdElement.style.cssText).toContain('position: fixed');
      expect(createdElement.style.cssText).toContain('background: #ff9800');
      expect(createdElement.style.cssText).toContain('z-index: 10000');
      
      // Verify content
      expect(createdElement.textContent).toBe('WHITE IN CHECK!');
    });

    test('should display check notification for black player', () => {
      mockClient.showCheckNotification('black');

      const createdElement = document.createElement.mock.results[0].value;
      expect(createdElement.textContent).toBe('BLACK IN CHECK!');
    });

    test('should automatically remove check notification after timeout', () => {
      mockClient.showCheckNotification('white');

      // Initially, removeChild should not be called
      expect(document.body.removeChild).not.toHaveBeenCalled();

      // Fast-forward time to trigger timeout
      jest.advanceTimersByTime(3000);

      // Now removeChild should be called
      expect(document.body.removeChild).toHaveBeenCalled();
    });

    test('should handle case where element is already removed', () => {
      // Mock contains to return false (element not in DOM)
      document.body.contains.mockReturnValue(false);

      mockClient.showCheckNotification('white');
      jest.advanceTimersByTime(3000);

      // Should not attempt to remove if element is not in DOM
      expect(document.body.removeChild).not.toHaveBeenCalled();
    });
  });

  describe('Checkmate Notification', () => {
    test('should create and display checkmate notification with correct styling', () => {
      mockClient.showCheckmateNotification('white', 'black');

      // Verify DOM element creation
      expect(document.createElement).toHaveBeenCalledWith('div');
      expect(document.body.appendChild).toHaveBeenCalled();

      const createdElement = document.createElement.mock.results[0].value;
      
      // Verify styling contains key properties
      expect(createdElement.style.cssText).toContain('position: fixed');
      expect(createdElement.style.cssText).toContain('background: #d32f2f');
      expect(createdElement.style.cssText).toContain('z-index: 10000');
      expect(createdElement.style.cssText).toContain('text-align: center');
      
      // Verify content includes both checkmate message and winner
      expect(createdElement.innerHTML).toContain('CHECKMATE!');
      expect(createdElement.innerHTML).toContain('WHITE WINS!');
    });

    test('should display checkmate notification for black winner', () => {
      mockClient.showCheckmateNotification('black', 'white');

      const createdElement = document.createElement.mock.results[0].value;
      expect(createdElement.innerHTML).toContain('CHECKMATE!');
      expect(createdElement.innerHTML).toContain('BLACK WINS!');
    });

    test('should automatically remove checkmate notification after timeout', () => {
      mockClient.showCheckmateNotification('white', 'black');

      // Initially, removeChild should not be called
      expect(document.body.removeChild).not.toHaveBeenCalled();

      // Fast-forward time to trigger timeout (5 seconds for checkmate)
      jest.advanceTimersByTime(5000);

      // Now removeChild should be called
      expect(document.body.removeChild).toHaveBeenCalled();
    });

    test('should have longer timeout than check notification', () => {
      mockClient.showCheckmateNotification('white', 'black');

      // After 3 seconds (check notification timeout), should not be removed yet
      jest.advanceTimersByTime(3000);
      expect(document.body.removeChild).not.toHaveBeenCalled();

      // After 5 seconds (checkmate notification timeout), should be removed
      jest.advanceTimersByTime(2000);
      expect(document.body.removeChild).toHaveBeenCalled();
    });
  });

  describe('Notification Styling', () => {
    test('check notification should have orange/amber styling', () => {
      mockClient.showCheckNotification('white');
      
      const createdElement = document.createElement.mock.results[0].value;
      expect(createdElement.style.cssText).toContain('#ff9800'); // Orange background
      expect(createdElement.style.cssText).toContain('#f57c00'); // Orange border
    });

    test('checkmate notification should have red styling', () => {
      mockClient.showCheckmateNotification('white', 'black');
      
      const createdElement = document.createElement.mock.results[0].value;
      expect(createdElement.style.cssText).toContain('#d32f2f'); // Red background
      expect(createdElement.style.cssText).toContain('#b71c1c'); // Dark red border
    });

    test('notifications should be positioned in center of screen', () => {
      mockClient.showCheckNotification('white');
      
      const createdElement = document.createElement.mock.results[0].value;
      expect(createdElement.style.cssText).toContain('top: 50%');
      expect(createdElement.style.cssText).toContain('left: 50%');
      expect(createdElement.style.cssText).toContain('transform: translate(-50%, -50%)');
    });

    test('notifications should have high z-index for visibility', () => {
      mockClient.showCheckNotification('white');
      
      const createdElement = document.createElement.mock.results[0].value;
      expect(createdElement.style.cssText).toContain('z-index: 10000');
    });
  });

  describe('Notification Content', () => {
    test('should format check notification text correctly', () => {
      mockClient.showCheckNotification('white');
      const element = document.createElement.mock.results[0].value;
      expect(element.textContent).toBe('WHITE IN CHECK!');

      // Reset mocks for second test
      document.createElement.mockClear();
      
      mockClient.showCheckNotification('black');
      const element2 = document.createElement.mock.results[0].value;
      expect(element2.textContent).toBe('BLACK IN CHECK!');
    });

    test('should format checkmate notification HTML correctly', () => {
      mockClient.showCheckmateNotification('white', 'black');
      
      const element = document.createElement.mock.results[0].value;
      expect(element.innerHTML).toContain('<div style="margin-bottom: 10px;">CHECKMATE!</div>');
      expect(element.innerHTML).toContain('<div style="font-size: 1rem;">WHITE WINS!</div>');
    });

    test('should handle different winner colors in checkmate notification', () => {
      const testCases = [
        { winner: 'white', expected: 'WHITE WINS!' },
        { winner: 'black', expected: 'BLACK WINS!' }
      ];

      testCases.forEach(({ winner, expected }, index) => {
        // Clear previous mocks
        document.createElement.mockClear();
        
        mockClient.showCheckmateNotification(winner, winner === 'white' ? 'black' : 'white');
        
        const element = document.createElement.mock.results[0].value;
        expect(element.innerHTML).toContain(expected);
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle DOM manipulation errors gracefully', () => {
      // Mock appendChild to throw an error
      document.body.appendChild.mockImplementation(() => {
        throw new Error('DOM error');
      });

      // Should not throw when DOM operations fail
      expect(() => {
        mockClient.showCheckNotification('white');
      }).not.toThrow();
    });

    test('should handle removeChild errors gracefully', () => {
      // Mock removeChild to throw an error
      document.body.removeChild.mockImplementation(() => {
        throw new Error('Remove error');
      });

      mockClient.showCheckNotification('white');
      
      // Should not throw when removal fails
      expect(() => {
        jest.advanceTimersByTime(3000);
      }).not.toThrow();
    });
  });
});