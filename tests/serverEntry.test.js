const request = require('supertest');
const http = require('http');
const socketIo = require('socket.io');
const express = require('express');
const path = require('path');

// Mock dependencies
jest.mock('express', () => {
  const mockApp = {
    use: jest.fn(),
    get: jest.fn(),
    static: jest.fn(() => 'static_middleware'),
  };
  const expressMock = jest.fn(() => mockApp);
  expressMock.static = jest.fn(() => 'static_middleware');
  return expressMock;
});

jest.mock('http', () => ({
  createServer: jest.fn(() => ({
    listen: jest.fn((port, host, cb) => cb && cb()),
    on: jest.fn(),
    close: jest.fn()
  }))
}));

jest.mock('socket.io', () => {
  const mockIo = {
    on: jest.fn(),
    emit: jest.fn(),
    to: jest.fn().mockReturnThis()
  };
  return jest.fn(() => mockIo);
});

// We need to load the index file to trigger the server creation
// But we want to prevent it from actually starting the server if we can
// Or we just test the side effects

describe('Server Index', () => {
  let expressMock;
  let httpMock;
  let socketIoMock;
  let appMock;
  let serverMock;
  let ioMock;

  beforeEach(() => {
    jest.resetModules();
    expressMock = require('express');
    httpMock = require('http');
    socketIoMock = require('socket.io');

    // Setup mocks before requiring index.js
    require('../src/server/index.js');

    appMock = expressMock.mock.results[0].value;
    serverMock = httpMock.createServer.mock.results[0].value;
    ioMock = socketIoMock.mock.results[0].value;
  });

  test('should create express app', () => {
    expect(expressMock).toHaveBeenCalled();
  });

  test('should create http server', () => {
    expect(httpMock.createServer).toHaveBeenCalledWith(appMock);
  });

  test('should initialize socket.io', () => {
    expect(socketIoMock).toHaveBeenCalledWith(serverMock);
  });

  test('should serve static files', () => {
    expect(expressMock.static).toHaveBeenCalled();
    expect(appMock.use).toHaveBeenCalledWith(expect.any(String));
  });

  test('should setup routes', () => {
    expect(appMock.get).toHaveBeenCalledWith('/health', expect.any(Function));
    expect(appMock.get).toHaveBeenCalledWith('/ready', expect.any(Function));
    expect(appMock.get).toHaveBeenCalledWith('/', expect.any(Function));
  });

  test('should setup socket connection handler', () => {
    expect(ioMock.on).toHaveBeenCalledWith('connection', expect.any(Function));
  });

  test('should not start listening on port when required', () => {
    expect(serverMock.listen).not.toHaveBeenCalled();
  });
});
