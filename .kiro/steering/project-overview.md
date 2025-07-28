# WebChess Project Overview

## Project Description
WebChess is a two-player online chess system with real-time gameplay and practice mode. It's a full-stack Node.js application that implements complete chess rules with multiplayer functionality via WebSocket connections.

## Core Features
- **Online Multiplayer**: Real-time chess games using 6-character game IDs
- **Practice Mode**: Single-player mode for offline practice
- **Full Chess Rules**: Complete implementation of all standard chess rules including special moves
- **Real-time Communication**: WebSocket-based multiplayer with chat functionality
- **Session Persistence**: Game state persistence and reconnection handling
- **Mobile Responsive**: Optimized for both desktop and mobile devices
- **Comprehensive Testing**: 130+ automated tests ensuring reliability

## Architecture
- **Backend**: Node.js with Express and Socket.IO
- **Frontend**: Vanilla JavaScript with responsive CSS
- **Game Logic**: Modular shared JavaScript components for consistent rule enforcement
- **Testing**: Jest for unit tests, npm test for all testing workflows
- **Deployment**: Systemd service with Nginx reverse proxy support

## Modular Architecture
The chess game logic has been refactored into focused modules:
- **ChessGame**: Core game orchestration and move execution
- **GameStateManager**: Comprehensive state tracking and validation
- **Move Validators**: Piece-specific movement validation
- **Check Detection**: King safety and check/checkmate logic
- **Special Moves**: Castling, en passant, and pawn promotion

## Key Technologies
- Node.js 18+
- Express.js for HTTP server
- Socket.IO for real-time communication
- Vanilla JavaScript (no frameworks)
- CSS Grid and Flexbox for responsive design
- Jest for testing
- Docker for containerization
- GitHub Actions for CI/CD

## Project Structure
```
webchess/
├── src/
│   ├── server/          # Node.js backend
│   │   ├── index.js     # Main server entry point
│   │   └── gameManager.js # Game session management
│   ├── client/          # Frontend code (currently empty)
│   └── shared/          # Modular shared game logic
│       ├── chessGame.js # Core game orchestration
│       ├── gameState.js # State management and validation
│       ├── chessAI.js   # AI opponent logic
│       └── [future modules] # Additional game logic modules
├── public/              # Static frontend assets
├── tests/               # Unit and integration tests
├── deployment/          # System deployment scripts
└── .kiro/              # Kiro configuration and specs
```