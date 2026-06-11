// Use globalThis so the bundle works both on the main thread (window)
// and inside Web Workers (self), where `window` does not exist.
globalThis.ChessGame = require('./chessGame');
globalThis.ChessAI = require('./chessAI');
