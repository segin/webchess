# WebChess Coding Standards

## JavaScript Standards

### Code Style
- Use ES6+ features where appropriate
- Prefer `const` and `let` over `var`
- Use arrow functions for callbacks and short functions
- Use template literals for string interpolation
- Use destructuring for object and array assignments

### Naming Conventions
- **Variables and Functions**: camelCase (`gameManager`, `makeMove`)
- **Classes**: PascalCase (`ChessGame`, `GameManager`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_GAME_DURATION`)
- **Files**: camelCase for modules (`gameManager.js`, `chessGame.js`)

### Function Structure
- Keep functions focused and single-purpose
- Use descriptive parameter names
- Return objects with `success` boolean and relevant data
- Handle errors gracefully with meaningful messages

### Error Handling
- Always return structured error responses: `{ success: false, message: "Error description" }`
- Use try-catch blocks for async operations
- Validate inputs at function entry points
- Provide user-friendly error messages

## Chess Game Logic Standards

### Move Validation
- All moves must be validated against FIDE chess rules
- Use coordinate system: `{ row: number, col: number }` (0-7 range)
- Validate piece ownership before allowing moves
- Check for path obstructions (except knights)
- Prevent moves that would put own king in check

### Game State Management
- Maintain immutable game history
- Track castling rights, en passant targets, and move counters
- Update game status after each move (active, check, checkmate, stalemate)
- Preserve game state for reconnection scenarios

### Special Moves Implementation
- **Castling**: Validate all FIDE requirements (king/rook unmoved, path clear, not through check)
- **En Passant**: Track target square after pawn two-square moves
- **Pawn Promotion**: Default to queen if no promotion piece specified

## Testing Standards

### Test Structure
- Use descriptive test names that explain the scenario
- Group related tests using `describe` blocks
- Use `beforeEach` for test setup
- Test both success and failure cases

### Test Execution
- **All testing should be done via `npm test`** - This runs the complete test suite
- Tests are automatically discovered and run by Jest
- Use `npm run test:watch` for development with auto-rerun on file changes

### Test Coverage Requirements
- All public methods must have unit tests
- Edge cases and error conditions must be tested
- Chess rule implementations require comprehensive test coverage
- Integration tests for complete game flows

### Test Data
- Use realistic chess positions for testing
- Include both valid and invalid move scenarios
- Test boundary conditions (board edges, piece limits)
- Verify game state consistency after operations

## API Design Standards

### Socket.IO Events
- Use kebab-case for event names (`host-game`, `make-move`)
- Include gameId in all game-related events
- Return structured responses with success indicators
- Emit to appropriate rooms/sockets only

### HTTP Endpoints
- Use RESTful conventions where applicable
- Include health check endpoints (`/health`, `/ready`)
- Set appropriate cache headers for static assets
- Return JSON responses with consistent structure

## File Organization

### Directory Structure
- **src/server/**: Server-side Node.js code
- **src/shared/**: Modular shared game logic components
- **public/**: Static frontend assets
- **tests/**: All test files (run via `npm test`)
- **deployment/**: System deployment scripts

### Module Design Principles
- **Single Responsibility**: Each module should have one clear purpose
- **Clear Interfaces**: Export classes and functions with well-defined APIs
- **Minimal Dependencies**: Shared modules should avoid external dependencies
- **Testability**: Design modules to be easily testable in isolation

### Module Exports
- Use `module.exports` for Node.js modules
- Export classes and functions with clear interfaces
- Document public APIs with JSDoc comments
- Follow consistent naming conventions across modules

## Performance Guidelines

### Memory Management
- Clean up disconnected player data after timeout
- Limit chat message history per game
- Remove completed games from memory
- Use efficient data structures for game state

### Network Optimization
- Minimize data sent over WebSocket connections
- Use appropriate caching headers for static assets
- Compress responses where beneficial
- Batch related updates when possible

## Security Considerations

### Input Validation
- Validate all user inputs on both client and server
- Sanitize chat messages to prevent XSS
- Validate move coordinates and piece references
- Rate limit game creation and moves

### Game Integrity
- Validate moves server-side regardless of client validation
- Prevent players from making moves for opponents
- Ensure game state consistency across all clients
- Protect against cheating through client manipulation