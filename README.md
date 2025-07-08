# WebChess

A two-player online chess system with real-time gameplay and practice mode.

## Features

- **Online Multiplayer**: Play chess with another player using a simple 6-character game ID
- **Practice Mode**: Play against yourself to practice chess strategies
- **Full Chess Rules**: Complete implementation of all standard chess rules
- **Real-time Gameplay**: Live moves with instant updates
- **Connectivity Handling**: 15-minute grace period for connection issues
- **Simple Interface**: Clean, easy-to-use chess board and controls

## Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the server**:
   ```bash
   npm start
   ```

3. **Open your browser** and navigate to `http://localhost:3000`

## How to Play

### Multiplayer
1. Click **Host** to create a new game - you'll receive a 6-character game ID
2. Share the game ID with your opponent
3. Your opponent clicks **Join** and enters the game ID
4. Start playing!

### Practice Mode
1. Click **Practice** to play against yourself
2. Perfect for learning chess or testing strategies

## Game Features

- **Standard Chess Rules**: All pieces move according to official chess rules
- **Special Moves**: Castling, en passant, pawn promotion
- **Game States**: Check, checkmate, stalemate detection
- **Resign Option**: Explicit resign button for voluntary forfeit
- **Move History**: Track all moves made during the game

## Development

### Testing
```bash
npm test
```

### Project Structure
```
webchess/
├── src/
│   ├── server/          # Node.js backend
│   ├── client/          # Frontend code
│   └── shared/          # Shared game logic
├── tests/               # Unit tests
└── public/              # Static assets
```

## Requirements

- Node.js 16 or higher
- Modern web browser with WebSocket support