const request = require('supertest');
const { createServer } = require('http');
const express = require('express');
const socketIo = require('socket.io');
const { io: Client } = require('socket.io-client');

// Test for server functionality
describe('WebChess Server Tests', () => {
  let app, server, io, clientSocket;

  beforeAll((done) => {
    // Create test server
    app = express();
    server = createServer(app);
    io = socketIo(server);

    server.listen(() => {
      const port = server.address().port;
      clientSocket = new Client(`http://localhost:${port}`);
      io.on('connection', (socket) => {
        console.log('Test client connected');
      });
      clientSocket.on('connect', done);
    });
  });

  afterAll(() => {
    io.close();
    clientSocket.close();
    server.close();
  });

  test('Server starts successfully', () => {
    expect(server.listening).toBe(true);
  });

  test('Socket connection works', (done) => {
    clientSocket.emit('test-message', 'hello');
    done();
  });

  test('Express server serves static files', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
  });
});