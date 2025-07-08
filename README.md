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
├── public/              # Static assets
└── deployment/          # System deployment files
```

## Deployment

### Quick System Installation

**For Debian/Ubuntu systems:**

```bash
# One-command installation
git clone https://github.com/segin/webchess.git
cd webchess
sudo ./deployment/install.sh
```

See [DEBIAN_INSTALL.md](DEBIAN_INSTALL.md) for detailed Debian/Ubuntu instructions.

**For other Unix/Linux systems with systemd:**

```bash
# Clone and install as system service
git clone https://github.com/segin/webchess.git
cd webchess
sudo ./deployment/install.sh
```

This will:
- Create a `webchess` system user
- Install the app to `/opt/webchess`
- Set up a systemd service
- Start the service automatically

### Configuration

The server listens on configurable host/port:

```bash
# Environment variables
export PORT=3000          # Default: 3000
export HOST=localhost      # Default: localhost
export NODE_ENV=production

# Start server
npm start
```

### Nginx Integration

Set up WebChess on a subdomain (works with existing sites):

```bash
# Automated setup for subdomain
sudo deployment/setup-nginx.sh -d yourdomain.com

# Custom subdomain
sudo deployment/setup-nginx.sh -d yourdomain.com -s games
```

This creates `chess.yourdomain.com` (or custom subdomain) without affecting existing nginx sites.

### Service Management

```bash
# Service commands
sudo systemctl start webchess
sudo systemctl stop webchess
sudo systemctl restart webchess
sudo systemctl status webchess

# View logs
sudo journalctl -u webchess -f
```

For detailed deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md).

## Requirements

- Node.js 16 or higher
- Modern web browser with WebSocket support
- systemd (for daemon installation)
- nginx (optional, for reverse proxy)