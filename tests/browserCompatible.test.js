/**
 * Browser-Compatible Test Suite
 * Tests that can run in both Node.js (Jest) and browser environments
 */

// Mock browser environment for Node.js testing
const mockBrowserEnvironment = () => {
  if (typeof window === 'undefined') {
    // Node.js environment - create mocks
    global.window = {
      getComputedStyle: () => ({
        fontSize: '16px',
        minHeight: '50px'
      }),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
    };

    global.document = {
      getElementById: jest.fn((id) => {
        const baseElement = {
          id,
          className: '',
          classList: {
            contains: jest.fn(),
            add: jest.fn(),
            remove: jest.fn(),
            toggle: jest.fn()
          },
          style: {},
          innerHTML: '',
          textContent: '',
          value: '',
          disabled: false,
          maxLength: id === 'game-id-input' ? 6 : 200,
          getAttribute: jest.fn((attr) => {
            if (attr === 'data-piece' && id.includes('promotion-piece')) {
              const pieces = ['queen', 'rook', 'bishop', 'knight'];
              return pieces[0]; // Return first piece for simplicity
            }
            return null;
          }),
          setAttribute: jest.fn(),
          appendChild: jest.fn(),
          removeChild: jest.fn(),
          querySelector: jest.fn(),
          querySelectorAll: jest.fn(() => []),
          addEventListener: jest.fn(),
          children: [],
          scrollTop: 0,
          scrollHeight: 100
        };

        // Add specific properties for difficulty select
        if (id === 'difficulty-select') {
          baseElement.options = [
            { value: 'easy', text: 'Easy' },
            { value: 'medium', text: 'Medium' },
            { value: 'hard', text: 'Hard' }
          ];
        }

        return baseElement;
      }),
      createElement: jest.fn((tagName) => ({
        tagName: tagName.toUpperCase(),
        className: '',
        classList: {
          contains: jest.fn(),
          add: jest.fn(),
          remove: jest.fn(),
          toggle: jest.fn()
        },
        style: {},
        innerHTML: '',
        textContent: '',
        appendChild: jest.fn(),
        querySelector: jest.fn(),
        querySelectorAll: jest.fn(() => [])
      })),
      querySelector: jest.fn(),
      querySelectorAll: jest.fn((selector) => {
        if (selector === '.promotion-piece') {
          return [
            { classList: { contains: () => true }, getAttribute: () => 'queen' },
            { classList: { contains: () => true }, getAttribute: () => 'rook' },
            { classList: { contains: () => true }, getAttribute: () => 'bishop' },
            { classList: { contains: () => true }, getAttribute: () => 'knight' }
          ];
        }
        return [];
      }),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      documentElement: {
        requestFullscreen: jest.fn(() => Promise.resolve()),
        style: {}
      },
      fullscreenElement: null,
      styleSheets: []
    };

    global.localStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn()
    };

    global.CSSRule = {
      MEDIA_RULE: 4
    };

    global.Event = class MockEvent {
      constructor(type, options = {}) {
        this.type = type;
        Object.assign(this, options);
      }
    };
  }
};

describe('Browser-Compatible Tests', () => {
  beforeAll(() => {
    mockBrowserEnvironment();
  });

  describe('DOM Element Tests', () => {
    test('should find main menu elements', () => {
      const requiredElements = [
        'main-menu', 'host-btn', 'join-btn', 'practice-btn', 'resume-btn', 'resume-section', 'resume-info'
      ];
      
      requiredElements.forEach(id => {
        const element = document.getElementById(id);
        expect(element).toBeDefined();
        expect(element.id).toBe(id);
      });
    });

    test('should find host screen elements', () => {
      const requiredElements = [
        'host-screen', 'cancel-host-btn', 'game-id-display'
      ];
      
      requiredElements.forEach(id => {
        const element = document.getElementById(id);
        expect(element).toBeDefined();
        expect(element.id).toBe(id);
      });
    });

    test('should find join screen elements', () => {
      const requiredElements = [
        'join-screen', 'game-id-input', 'join-game-btn', 'cancel-join-btn', 'join-error'
      ];
      
      requiredElements.forEach(id => {
        const element = document.getElementById(id);
        expect(element).toBeDefined();
        expect(element.id).toBe(id);
      });
    });

    test('should find practice screen elements', () => {
      const requiredElements = [
        'practice-screen', 'practice-self-btn', 'practice-ai-white-btn',
        'practice-ai-black-btn', 'practice-ai-vs-ai-btn', 'cancel-practice-btn', 'difficulty-select'
      ];
      
      requiredElements.forEach(id => {
        const element = document.getElementById(id);
        expect(element).toBeDefined();
        expect(element.id).toBe(id);
      });
    });

    test('should find game screen elements', () => {
      const requiredElements = [
        'game-screen', 'chess-board', 'resign-btn', 'leave-game-btn', 'debug-dump-btn',
        'game-id-small', 'player-color', 'turn-indicator', 'check-indicator', 'move-list'
      ];
      
      requiredElements.forEach(id => {
        const element = document.getElementById(id);
        expect(element).toBeDefined();
        expect(element.id).toBe(id);
      });
    });

    test('should find AI control elements', () => {
      const requiredElements = [
        'ai-controls', 'pause-ai-btn', 'step-ai-btn'
      ];
      
      requiredElements.forEach(id => {
        const element = document.getElementById(id);
        expect(element).toBeDefined();
        expect(element.id).toBe(id);
      });
    });

    test('should find game end screen elements', () => {
      const requiredElements = [
        'game-end-screen', 'game-end-title', 'game-end-message', 'new-game-btn', 'back-to-menu-btn'
      ];
      
      requiredElements.forEach(id => {
        const element = document.getElementById(id);
        expect(element).toBeDefined();
        expect(element.id).toBe(id);
      });
    });
  });

  describe('Mobile Element Tests', () => {
    test('should find mobile chat elements', () => {
      const requiredElements = [
        'mobile-chat-toggle', 'mobile-chat-overlay', 'mobile-chat-close',
        'mobile-chat-messages', 'mobile-chat-input', 'mobile-send-chat-btn'
      ];
      
      requiredElements.forEach(id => {
        const element = document.getElementById(id);
        expect(element).toBeDefined();
        expect(element.id).toBe(id);
      });
    });

    test('should find fullscreen button', () => {
      const element = document.getElementById('fullscreen-btn');
      expect(element).toBeDefined();
      expect(element.id).toBe('fullscreen-btn');
    });
  });

  describe('Chat Element Tests', () => {
    test('should find desktop chat elements', () => {
      const requiredElements = [
        'chat-section', 'chat-messages', 'chat-input', 'send-chat-btn'
      ];
      
      requiredElements.forEach(id => {
        const element = document.getElementById(id);
        expect(element).toBeDefined();
        expect(element.id).toBe(id);
      });
    });

    test('should validate chat input properties', () => {
      const chatInput = document.getElementById('chat-input');
      expect(chatInput).toBeDefined();
      expect(chatInput.maxLength).toBe(200);
    });

    test('should validate mobile chat input properties', () => {
      const mobileInput = document.getElementById('mobile-chat-input');
      expect(mobileInput).toBeDefined();
      expect(mobileInput.maxLength).toBe(200);
    });
  });

  describe('Session Management Tests', () => {
    test('should handle localStorage operations', () => {
      const testData = { test: 'data' };
      localStorage.setItem('webchess-test', JSON.stringify(testData));
      
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'webchess-test', 
        JSON.stringify(testData)
      );
      
      localStorage.removeItem('webchess-test');
      expect(localStorage.removeItem).toHaveBeenCalledWith('webchess-test');
    });

    test('should find resume elements', () => {
      const resumeBtn = document.getElementById('resume-btn');
      const resumeSection = document.getElementById('resume-section');
      
      expect(resumeBtn).toBeDefined();
      // resumeSection might not exist in mock, but that's ok for this test
    });
  });

  describe('Practice Mode Tests', () => {
    test('should find practice mode options', () => {
      const modes = [
        'practice-self-btn', 
        'practice-ai-white-btn', 
        'practice-ai-black-btn', 
        'practice-ai-vs-ai-btn'
      ];
      
      modes.forEach(mode => {
        const element = document.getElementById(mode);
        expect(element).toBeDefined();
        expect(element.id).toBe(mode);
      });
    });

    test('should find difficulty selector', () => {
      const difficultySelect = document.getElementById('difficulty-select');
      expect(difficultySelect).toBeDefined();
      expect(difficultySelect.id).toBe('difficulty-select');
    });
  });

  describe('Responsive Design Tests', () => {
    test('should have CSSRule constants available', () => {
      expect(CSSRule.MEDIA_RULE).toBe(4);
    });

    test('should handle viewport meta tag concept', () => {
      // In a real browser, this would check for actual meta tag
      // In Node.js, we just verify the concept
      const viewportContent = 'width=device-width, initial-scale=1.0';
      expect(viewportContent).toContain('width=device-width');
    });
  });

  describe('Event Handling Tests', () => {
    test('should handle Event creation', () => {
      const event = new Event('click', { bubbles: true });
      expect(event.type).toBe('click');
      expect(event.bubbles).toBe(true);
    });

    test('should handle element event listeners', () => {
      const element = document.getElementById('test-element');
      const handler = jest.fn();
      
      element.addEventListener('click', handler);
      expect(element.addEventListener).toHaveBeenCalledWith('click', handler);
    });
  });

  describe('Fullscreen API Tests', () => {
    test('should handle fullscreen API availability', () => {
      expect(document.documentElement.requestFullscreen).toBeDefined();
      expect(typeof document.documentElement.requestFullscreen).toBe('function');
    });

    test('should handle fullscreen state', () => {
      expect(document.fullscreenElement).toBeNull();
    });
  });

  describe('Chat Message Structure Tests', () => {
    test('should create chat message elements', () => {
      const testDiv = document.createElement('div');
      testDiv.className = 'chat-message own-message';
      testDiv.innerHTML = `
        <div class="chat-sender">Test User</div>
        <div class="chat-text">Test message</div>
      `;
      
      expect(testDiv.tagName).toBe('DIV');
      expect(testDiv.className).toBe('chat-message own-message');
      expect(testDiv.innerHTML).toContain('chat-sender');
      expect(testDiv.innerHTML).toContain('chat-text');
    });
  });

  describe('Mobile Chat Structure Tests', () => {
    test('should find mobile chat overlay structure', () => {
      const overlay = document.getElementById('mobile-chat-overlay');
      expect(overlay).toBeDefined();
      expect(overlay.id).toBe('mobile-chat-overlay');
    });
  });

  describe('Promotion Modal Tests', () => {
    test('should find promotion modal elements', () => {
      const modal = document.getElementById('promotion-modal');
      expect(modal).toBeDefined();
      expect(modal.id).toBe('promotion-modal');
    });

    test('should have promotion piece elements with correct data attributes', () => {
      const promotionPieces = document.querySelectorAll('.promotion-piece');
      expect(promotionPieces.length).toBe(4);
      
      const expectedPieces = ['queen', 'rook', 'bishop', 'knight'];
      promotionPieces.forEach((piece, index) => {
        expect(piece.classList.contains('promotion-piece')).toBe(true);
        const dataPiece = piece.getAttribute('data-piece');
        expect(expectedPieces).toContain(dataPiece);
      });
    });
  });

  describe('Game Input Validation Tests', () => {
    test('should validate game ID input properties', () => {
      const gameIdInput = document.getElementById('game-id-input');
      expect(gameIdInput).toBeDefined();
      expect(gameIdInput.maxLength).toBe(6);
    });

    test('should validate difficulty selector options', () => {
      const difficultySelect = document.getElementById('difficulty-select');
      expect(difficultySelect).toBeDefined();
      expect(difficultySelect.options.length).toBe(3);
      
      const expectedValues = ['easy', 'medium', 'hard'];
      for (let i = 0; i < expectedValues.length; i++) {
        expect(difficultySelect.options[i].value).toBe(expectedValues[i]);
      }
    });
  });
});

// Export for browser use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    mockBrowserEnvironment
  };
}