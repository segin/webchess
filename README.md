# WebChess

A two-player online chess system with real-time gameplay and practice mode.

## Node.js Compatibility

[![CI](https://github.com/segin/webchess/workflows/CI%2FCD%20Pipeline/badge.svg)](https://github.com/segin/webchess/actions/workflows/ci.yml)

### Individual Version Status

| Version | Status | Support Level | Coverage |
|---------|--------|---------------|----------|
| Node.js 16.x | [![Node.js 16.x Test](https://github.com/segin/webchess/workflows/Node.js%2016.x%20Test/badge.svg)](https://github.com/segin/webchess/actions/workflows/node16-test.yml) | 🧪 Experimental | Compatibility tracking |
| Node.js 18.x | [![Node.js 18.x Test](https://github.com/segin/webchess/workflows/Node.js%2018.x%20Test/badge.svg)](https://github.com/segin/webchess/actions/workflows/node18-test.yml) | 🧪 Experimental | Compatibility tracking |
| Node.js 20.x | [![Node.js 20.x Test](https://github.com/segin/webchess/workflows/Node.js%2020.x%20Test/badge.svg)](https://github.com/segin/webchess/actions/workflows/node20-test.yml) | 🧪 Experimental | Compatibility tracking |
| Node.js 22.x | [![Node.js 22.x Test](https://github.com/segin/webchess/workflows/Node.js%2022.x%20Test/badge.svg)](https://github.com/segin/webchess/actions/workflows/node22-test.yml) | ✅ Fully Supported | Full test suite + coverage |
| Node.js 23.x | [![Node.js 23.x Test](https://github.com/segin/webchess/workflows/Node.js%2023.x%20Test/badge.svg)](https://github.com/segin/webchess/actions/workflows/node23-test.yml) | ✅ Fully Supported | Full test suite + coverage |
| Node.js 24.x | [![Node.js 24.x Test](https://github.com/segin/webchess/workflows/Node.js%2024.x%20Test/badge.svg)](https://github.com/segin/webchess/actions/workflows/node24-test.yml) | ✅ Fully Supported | Full test suite + coverage |
| Node.js 25.x | [![Node.js 25.x Test](https://github.com/segin/webchess/workflows/Node.js%2025.x%20Test/badge.svg)](https://github.com/segin/webchess/actions/workflows/node25-test.yml) | ✅ Fully Supported | Full test suite + coverage |

### Support Policy

- **🧪 Experimental**: Tested for compatibility tracking, failures don't block CI
- **✅ Fully Supported**: Required to pass for CI success, includes full test coverage
- **📊 Coverage**: Each version uploads separate coverage reports to Codecov with version-specific flags

> **Note**: This comprehensive testing matrix helps track exactly when older Node.js versions break, allowing for proactive documentation updates and support decisions.

## Features

- **Online Multiplayer**: Play chess with another player using a simple 6-character game ID
- **Practice Mode**: Play against yourself or AI opponents with multiple difficulty levels
- **Full Chess Rules**: Complete implementation of all standard chess rules
- **Real-time Gameplay**: Live moves with instant updates via WebSocket
- **AI Integration**: Smart AI opponents with configurable difficulty
- **Chat System**: Real-time messaging between players
- **Session Persistence**: Resume games after connection issues
- **Mobile Responsive**: Optimized for both desktop and mobile devices
- **Comprehensive Testing**: 130+ automated tests ensuring reliability
- **CI/CD Pipeline**: Automated testing, building, and deployment

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

## CI/CD & Automation

WebChess includes a comprehensive CI/CD pipeline with GitHub Actions:

### 🔄 Continuous Integration
- **Automated Testing**: 130+ unit, integration, and browser tests
- **Multi-Version Support**: Tests on Node.js 16.x, 18.x, 20.x, 22.x, 23.x, 24.x, 25.x
- **Legacy Compatibility**: Node.js 16.x, 18.x, 20.x tested experimentally (failures don't block CI)
- **Code Quality**: ESLint linting and security audits
- **Coverage Reports**: Minimum 70% test coverage requirement

### 🚀 Continuous Deployment
- **Staging**: Auto-deploy `develop` branch to staging environment
- **Production**: Auto-deploy `main` branch to production
- **Docker**: Automated container builds and registry publishing
- **Health Checks**: Automated monitoring and failure notifications

### 🔧 Automated Workflows
- **Pull Request Validation**: Comprehensive PR checks with automated comments
- **Dependency Updates**: Dependabot with auto-merge for patch/minor updates
- **Release Automation**: GitHub releases with changelog generation
- **Performance Monitoring**: Lighthouse audits and security scanning

### 📊 Monitoring & Quality
- **Health Endpoints**: `/health` and `/ready` for monitoring
- **Performance Budgets**: Lighthouse CI with accessibility validation
- **Security Scanning**: Trivy vulnerability detection
- **Automated Issue Creation**: Health check failures create GitHub issues

See [.github/README.md](.github/README.md) for detailed CI/CD documentation.

## Requirements

- Node.js 18.x or higher (tested on 16.x, 18.x, 20.x, 22.x, 23.x, 24.x, 25.x)
- Modern web browser with WebSocket support
- systemd (for daemon installation)
- nginx (optional, for reverse proxy)
- Docker (optional, for containerized deployment)