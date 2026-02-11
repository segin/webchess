# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WebChess is a two-player online chess system with real-time multiplayer gameplay and single-player practice mode. The application uses a Node.js backend with Socket.IO for real-time communication, and a vanilla JavaScript frontend for the chess interface.

## Architecture

### Backend (`src/server/`)
- **index.js**: Express server with Socket.IO for real-time communication
- **gameManager.js**: Manages game sessions, player connections, and 6-character game IDs
- Handles multiplayer matchmaking, disconnection timeouts (15 minutes), and game state persistence

### Frontend (`src/client/` and `public/`)
- **script.js**: WebChessClient class handling UI, game logic, and Socket.IO communication
- **index.html**: Main interface with screens for hosting, joining, and playing games
- **styles.css**: Chess board styling and responsive design
- Uses localStorage for session persistence across browser refreshes

### Shared Logic (`src/shared/`)
- **chessGame.js**: Complete chess rules implementation including:
  - All standard piece movements and special moves (castling, en passant, promotion)
  - Check/checkmate/stalemate detection
  - Move validation and game state management

## Common Development Tasks

### Running the Application
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start

# Run tests
npm test

# Watch tests during development
npm test:watch
```

### Testing
- Tests are in `tests/` directory using Jest
- Test files: `chessGame.test.js`, `gameManager.test.js`
- Coverage configured for all `src/` files except client-side code
- Run single test: `npm test -- --testNamePattern="test name"`

### System Service Management
```bash
# Install as system service
npm run daemon:install
npm run daemon:enable
npm run daemon:start

# Service control
npm run daemon:stop
npm run daemon:restart
npm run daemon:status
npm run daemon:logs
```

## Key Implementation Details

### Game ID System
- 6-character alphanumeric game IDs (case-insensitive)
- Generated in `gameManager.js` with collision detection
- Used for host/join multiplayer sessions

### Real-time Communication
- Socket.IO events: `host-game`, `join-game`, `make-move`, `resign`, `disconnect`
- Automatic reconnection handling with session persistence
- 15-minute disconnection grace period before game abandonment

### Chess Rules Implementation
- Complete implementation in `chessGame.js` with all standard rules
- Server-side move validation prevents cheating
- Client-side validation provides immediate feedback
- Practice mode uses client-side chess logic for offline play

### Session Persistence
- localStorage used for maintaining game sessions across browser refreshes
- Session data: `gameId`, `playerColor`, `isPracticeMode`
- Automatic reconnection attempts on page reload

## Configuration

### Environment Variables
- `PORT`: Server port (default: 3000)
- `HOST`: Server host (default: localhost)
- `NODE_ENV`: Environment mode

### Deployment
- Uses systemd service configuration in `deployment/webchess.service`
- Nginx configuration templates in `deployment/` directory
- Automated installation script: `deployment/install.sh`

## File Structure Notes

- `public/`: Static frontend assets served by Express
- `deployment/`: System service files and installation scripts
- `tests/`: Jest test files for game logic validation
- No build process required - uses vanilla JavaScript and Node.js

## Testing Requirements

The project requires comprehensive test coverage for:
- Chess piece movement validation
- Special moves (castling, en passant, promotion)
- Check/checkmate/stalemate detection
- Game session management
- Connection handling and timeouts

## Original Project Requirements (from PROMPT.md)

### Core Features
- **Two-player online chess system** with real-time gameplay
- **Simple 6-character alphanumeric game ID** generation (case-insensitive)
- **Host/Join/Practice interface** for game selection
- **Single-player practice mode** for offline play
- **Full chess rule implementation** including all standard moves and edge cases

### Game Session Management
- **6-character game ID** generated when hosting a new game
- **Join functionality** using game ID input
- **15-minute connectivity timeout** before invalidating sessions
- **Explicit Resign button** for voluntary forfeit

### Technical Requirements
- **Node.js backend** for server-side game logic and session management
- **Real-time communication** for multiplayer gameplay
- **Unit tests** covering all chess rules and game mechanics
- **Simple, clean user interface** focusing on usability

### Chess Rules Implementation
Must implement all standard chess rules including:
- Basic piece movements (pawn, rook, knight, bishop, queen, king)
- Pawn special moves (initial two-space move, en passant, promotion)
- Castling (kingside and queenside)
- Check and checkmate detection
- Stalemate detection
- Draw conditions

### Unit Testing Requirements
Comprehensive test coverage for:
- Knight's tour validation
- Castling rules and edge cases
- Check and checkmate scenarios
- Pawn movement vs. attack patterns
- Pawn initial two-space move
- Knight's L-shaped movement patterns
- Pawn promotion mechanics

### Connectivity Handling
- **Graceful disconnection handling** with 15-minute grace period
- **Reconnection capability** for temporarily disconnected players
- **Session persistence** during brief network interruptions
- **Clear notifications** for connection status changes
- **LocalStorage session persistence** to maintain active game sessions across browser refreshes and PC reboots