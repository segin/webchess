# Test Documentation & Coverage Strategy

## Recent Improvements (January 2026)

We have significantly improved test coverage and reliability, particularly for the server entry point (`src/server/index.js`) and edge cases in the game logic.

### Server Refactoring for Testability

The `src/server/index.js` file has been refactored to support proper integration testing. Previously, it would start the server immediately upon import, making it difficult to test in isolation or parallel mode.

**Changes:**
1. Wrapped `server.listen()` in a conditional check: `if (require.main === module) { ... }`.
2. Exported the core components: `{ app, server, io, gameManager }`.

This allows tests to import the server instance, listen on a random port (ephemeral), and run integration tests against a real running server instance without port conflicts.

### New Test Files

#### `tests/indexCoverage.test.js`
- **Purpose**: Targeted integration tests for `src/server/index.js`.
- **Coverage**: improved from ~19% to ~72%.
- **Scope**:
  - **Static File Serving**: Verifies cache control headers for HTML, CSS, and JS files.
  - **HTTP Endpoints**: Tests `/health` and `/ready` endpoints.
  - **Socket.IO Integration**: Tests connection, game creation, joining, moves, and chat functionality using real `socket.io-client` connecting to the exported server.
  - **Error Handling**: Validates rejection of invalid inputs and sessions.

#### `tests/chessGameCoverageImprovement.test.js`
- **Purpose**: Edge case coverage for the core game logic.
- **Coverage**: `src/shared/chessGame.js` coverage improved to >91%.
- **Scope**:
  - Error paths in validation logic.
  - complex pawn movement (en passant, promotion combinations).
  - Game state edge cases (stalemate, move history).

### Running Tests

To run the full suite:
```bash
npm test
```

To run coverage report:
```bash
npm test -- --coverage
```

### Future Work

- **GameManager Coverage**: While `indexCoverage.test.js` exercises `GameManager` indirectly, dedicated unit tests for `src/server/gameManager.js` would further improve coverage (currently ~19% reported, though functionally higher via integration).
- **Socket Error Branches**: Some specific error branches in `index.js` (e.g., specific race conditions in socket events) remain uncovered and could be targeted with more mocks.
