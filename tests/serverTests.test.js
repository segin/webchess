/**
 * Server Integration Tests
 * Consolidates HTTP endpoint, Static File, and Socket.IO integration tests.
 * Uses the REAL server instance from src/server/index.js
 */

const request = require('supertest');
const Client = require('socket.io-client');
const path = require('path');
const fs = require('fs');

// Use the real server instance
const { app, server, io, gameManager } = require('../src/server/index');

describe('Server Integration Tests', () => {
  let clientSocket;
  let port;

  beforeAll((done) => {
    // Determine port being used by the imported server
    const address = server.address();
    if (address) {
        port = address.port;
        done();
    } else {
        // If server not listening yet, listen on a random port
        server.listen(0, () => {
          port = server.address().port;
          done();
        });
    }
  });

  afterAll((done) => {
    if (clientSocket && clientSocket.connected) {
      clientSocket.disconnect();
    }
    io.close();
    server.close(done);
  });

  describe('HTTP Endpoints', () => {
    test('should return health status', async () => {
      const response = await request(app).get('/health').expect(200);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('uptime');
      expect(response.headers['content-type']).toMatch(/application\/json/);
    });

    test('should return readiness status', async () => {
      const response = await request(app).get('/ready').expect(200);
      expect(response.body).toEqual({ status: 'ready' });
    });

    test('should serve static files with correct headers', async () => {
      // Index HTML
      const htmlRes = await request(app).get('/').expect(200);
      expect(htmlRes.headers['content-type']).toMatch(/text\/html/);
      expect(htmlRes.headers['cache-control']).toContain('no-cache');

      // JS File (if validation of existence is tricky, we check headers on likely existing file or catch 404 but check headers if possible)
      // Assuming script.js exists in public
      if (fs.existsSync(path.join(__dirname, '../public/script.js'))) {
          const jsRes = await request(app).get('/script.js').expect(200);
          expect(jsRes.headers['content-type']).toMatch(/javascript/);
          expect(jsRes.headers['cache-control']).toContain('public');
      }
    });

    test('should return 404 for non-existent routes', async () => {
      await request(app).get('/non-existent-route').expect(404);
    });
  });

  describe('Socket.IO Integration', () => {
    beforeEach((done) => {
      clientSocket = Client(`http://localhost:${port}`);
      clientSocket.on('connect', done);
    });

    afterEach(() => {
      if (clientSocket && clientSocket.connected) {
        clientSocket.disconnect();
      }
    });

    test('should connect successfully', () => {
      expect(clientSocket.connected).toBe(true);
    });

    test('should handle host-game event', (done) => {
      clientSocket.emit('host-game');
      clientSocket.once('game-created', (data) => {
        expect(data.gameId).toBeDefined();
        // createGame in real manager returns 6 chars
        expect(data.gameId).toHaveLength(6); 
        done();
      });
    });

    test('should handle join-game event', (done) => {
      // First host a game
      const hostClient = Client(`http://localhost:${port}`);
      hostClient.on('connect', () => {
        hostClient.emit('host-game');
        hostClient.once('game-created', (hostData) => {
          const gameId = hostData.gameId;
          
          // Now join as simple clientSocket
          clientSocket.emit('join-game', { gameId });
          
          clientSocket.once('game-joined', (joinData) => {
            expect(joinData.gameId).toBe(gameId);
            expect(joinData.color).toBe('black');
            hostClient.disconnect();
            done();
          });
        });
      });
    });

    test('should validate session', (done) => {
      // Host game to get ID
      const hostClient = Client(`http://localhost:${port}`);
      hostClient.on('connect', () => {
        hostClient.emit('host-game');
        hostClient.once('game-created', (data) => {
             const gameId = data.gameId;
             
             // Validate session
             hostClient.emit('validate-session', { gameId });
             hostClient.once('session-validation', (valData) => {
                 expect(valData.valid).toBe(true);
                 expect(valData.gameId).toBe(gameId);
                 hostClient.disconnect();
                 done();
             });
        });
      });
    });
  });

  describe('Game Flow Integration', () => {
    // This section tests the full flow: Host -> Join -> Move
    test('should allow a full game flow: host, join, move', (done) => {
        process.stdout.write('Game Flow: Start\n');
        const host = Client(`http://localhost:${port}`);
        const guest = Client(`http://localhost:${port}`);
        let gameId;

        // 1. Host connects
        host.on('connect', () => {
            process.stdout.write('Game Flow: Host connected\n');
            host.emit('host-game');
        });

        host.on('game-created', (data) => {
            process.stdout.write(`Game Flow: Game created ${data.gameId}\n`);
            gameId = data.gameId;
            // 2. Guest connects and joins
            guest.on('connect', () => {
                process.stdout.write('Game Flow: Guest connected\n');
                guest.emit('join-game', { gameId });
            });
        });

        guest.on('game-joined', (data) => {
            process.stdout.write('Game Flow: Guest joined\n');
            expect(data.color).toBe('black');
            
            // 3. Host makes a move (White)
            // Move Pawn e2 -> e4
            const move = { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } };
            process.stdout.write(`Game Flow: Host making move ${JSON.stringify(move)}\n`);
            host.emit('make-move', { gameId, move });
        });

        // Listen for move updates on both clients
        let updatesReceived = 0;
        const checkDone = () => {
            updatesReceived++;
            process.stdout.write(`Game Flow: Update received ${updatesReceived}\n`);
            if (updatesReceived === 2) {
                process.stdout.write('Game Flow: Done\n');
                host.disconnect();
                guest.disconnect();
                done();
            }
        };

        host.on('move-made', (data) => {
             process.stdout.write('Game Flow: Host received move-made\n');
             expect(data.gameState.currentTurn).toBe('black');
             checkDone();
        });

        guest.on('move-made', (data) => {
            process.stdout.write('Game Flow: Guest received move-made\n');
            expect(data.gameState.currentTurn).toBe('black');
            checkDone();
        });
    }, 5000); // 5s timeout
  });

  describe('Chat System Integration', () => {
      test('should calculate correct chat flow', (done) => {
          const host = Client(`http://localhost:${port}`);
          
          host.on('connect', () => {
              host.emit('host-game');
          });

          host.on('game-created', (data) => {
              const gameId = data.gameId;
              
              host.emit('chat-message', { gameId, message: 'Hello World' });
              
              host.on('chat-message', (chatData) => {
                  expect(chatData.message).toBe('Hello World');
                  expect(chatData.sender).toBe('White'); // Host is White
                  
                  // Now check history
                  host.emit('get-chat-history', { gameId });
                  host.once('chat-history', (histData) => {
                      expect(histData.messages).toHaveLength(1);
                      expect(histData.messages[0].message).toBe('Hello World');
                      host.disconnect();
                      done();
                  });
              });
          });
      });
  });
});
