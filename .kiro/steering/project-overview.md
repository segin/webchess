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
- **Game Logic**: Shared JavaScript modules for consistent rule enforcement
- **Testing**: Jest for unit tests, custom test runners for integration tests
- **Deployment**: Systemd service with Nginx reverse proxy support

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
│   ├── client/          # Frontend code (currently empty)
│   └── shared/          # Shared game logic
├── public/              # Static frontend assets
├── tests/               # Unit and integration tests
├── deployment/          # System deployment scripts
└── .kiro/              # Kiro configuration and specs
```