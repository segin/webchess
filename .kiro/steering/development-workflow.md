# Development Workflow for WebChess

## Development Environment Setup

### Prerequisites
- Node.js 18+ installed
- Git configured with user credentials
- Code editor with JavaScript support
- Modern web browser for testing

### Initial Setup
```bash
# Clone and setup
git clone <repository-url>
cd webchess
npm install

# Start development server
npm run dev

# Run tests
npm test
npm run test:browser
```

### Development Commands
- `npm start` - Start production server
- `npm run dev` - Start development server with auto-reload
- `npm test` - Run Node.js test suite
- `npm run test:comprehensive` - Run comprehensive test suite
- `npm run test:browser` - Instructions for browser testing

## Feature Development Process

### 1. Planning Phase
- Review existing specs in `.kiro/specs/`
- Create or update feature specifications
- Define acceptance criteria and test cases
- Identify affected components and dependencies

### 2. Implementation Phase
- Create feature branch from `main`
- Implement server-side logic first (if applicable)
- Add comprehensive unit tests
- Implement client-side functionality
- Add integration tests

### 3. Testing Phase
- Run full test suite locally
- Test in multiple browsers
- Validate mobile responsiveness
- Test multiplayer functionality with multiple browser tabs
- Performance testing for complex scenarios

### 4. Review and Merge
- Create pull request with detailed description
- Include test results and coverage information
- Address code review feedback
- Merge to main after approval

## Code Organization Guidelines

### File Structure Standards
```
src/
├── server/
│   ├── index.js          # Main server entry point
│   ├── gameManager.js    # Game session management
│   └── utils/            # Server utilities
├── shared/
│   ├── chessGame.js      # Core chess logic
│   ├── chessAI.js        # AI implementation
│   └── constants.js      # Shared constants
└── client/               # Future client-side modules
```

### Module Dependencies
- **Server modules** can import from `shared/`
- **Client code** (in `public/`) should be self-contained
- **Shared modules** should have no external dependencies beyond Node.js built-ins
- **Test files** can import from any module for testing

## Chess Rule Implementation Workflow

### Rule Implementation Process
1. **Research**: Verify rule against FIDE standards
2. **Test Cases**: Write comprehensive test cases first
3. **Implementation**: Implement rule in `chessGame.js`
4. **Validation**: Ensure all tests pass
5. **Integration**: Test with complete game flow
6. **Documentation**: Update chess rules reference

### Move Validation Implementation
```javascript
// Standard pattern for move validation
isValidMove(from, to, piece) {
  // 1. Basic validation (coordinates, piece ownership)
  if (!this.isValidSquare(from) || !this.isValidSquare(to)) {
    return false;
  }
  
  // 2. Piece-specific movement rules
  if (!this.isPieceMovementValid(from, to, piece)) {
    return false;
  }
  
  // 3. Path obstruction check (except knights)
  if (piece.type !== 'knight' && !this.isPathClear(from, to)) {
    return false;
  }
  
  // 4. Check prevention
  if (this.wouldBeInCheck(from, to, piece.color)) {
    return false;
  }
  
  return true;
}
```

## Testing Workflow

### Test-First Development
1. Write failing test for new functionality
2. Implement minimal code to make test pass
3. Refactor while keeping tests green
4. Add edge case tests
5. Optimize implementation

### Chess Testing Strategy
- **Unit Tests**: Individual piece movement validation
- **Integration Tests**: Complete move sequences
- **Game Flow Tests**: Full games from start to end
- **Edge Case Tests**: Boundary conditions and error scenarios

### Test Execution Order
```bash
# Quick validation
npm test

# Comprehensive testing
npm run test:comprehensive

# Browser testing (manual)
open tests/run_tests.html
```

## Debugging Guidelines

### Server-Side Debugging
- Use `console.log` for development debugging
- Implement structured logging for production
- Use Node.js debugger for complex issues
- Monitor WebSocket connections and events

### Client-Side Debugging
- Use browser developer tools
- Test WebSocket connections in Network tab
- Validate game state consistency
- Test responsive design in device emulation

### Chess Logic Debugging
- Log board state before and after moves
- Visualize piece positions in console
- Trace move validation logic step by step
- Verify game state transitions

## Performance Optimization

### Server Performance
- Minimize memory usage for game state
- Efficient algorithms for move validation
- Clean up disconnected games promptly
- Optimize WebSocket message frequency

### Client Performance
- Minimize DOM manipulations
- Efficient board rendering
- Optimize mobile touch interactions
- Reduce network requests

### Chess Engine Performance
- Pre-calculate possible moves where beneficial
- Use efficient data structures for board representation
- Optimize check detection algorithms
- Cache frequently accessed game states

## Deployment Workflow

### Local Testing
- Test complete functionality locally
- Validate all test suites pass
- Check mobile responsiveness
- Test multiplayer with multiple browser tabs

### Staging Deployment
- Deploy to staging environment
- Run automated test suite against staging
- Manual testing of critical paths
- Performance validation

### Production Deployment
- Deploy during low-traffic periods
- Monitor server logs and performance
- Validate health check endpoints
- Have rollback plan ready

## Code Review Guidelines

### Review Checklist
- [ ] Code follows project standards
- [ ] Comprehensive test coverage
- [ ] Chess rules correctly implemented
- [ ] Error handling implemented
- [ ] Performance considerations addressed
- [ ] Mobile compatibility maintained
- [ ] Documentation updated

### Chess-Specific Review Points
- Verify move validation against FIDE rules
- Check for edge cases in special moves
- Validate game state consistency
- Ensure proper error messages for invalid moves
- Test complex chess scenarios

## Documentation Maintenance

### Code Documentation
- JSDoc comments for public APIs
- Inline comments for complex chess logic
- Update README for new features
- Maintain API documentation

### Chess Rules Documentation
- Keep chess rules reference current
- Document any rule interpretation decisions
- Maintain test case explanations
- Update examples for new functionality

## Troubleshooting Common Issues

### WebSocket Connection Issues
- Check server startup logs
- Validate port availability
- Test with different browsers
- Check firewall settings

### Chess Logic Issues
- Verify board coordinate system
- Check piece movement validation
- Validate game state updates
- Test with known chess positions

### Mobile Issues
- Test touch event handling
- Validate responsive CSS
- Check viewport configuration
- Test on actual mobile devices

### Performance Issues
- Profile memory usage
- Monitor CPU usage during games
- Check for memory leaks
- Optimize hot code paths