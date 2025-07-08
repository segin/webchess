# WebChess - Two-Player Online Chess System

## Project Requirements

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

### User Interface
- **Simple main screen** with three buttons: Host, Join, Practice
- **Game ID display** for host player
- **Game ID input field** for joining player
- **Chess board** with clear piece representation
- **Move history** display
- **Game status** indicators (check, checkmate, turn)
- **Resign button** prominently displayed during active games

### Connectivity Handling
- **Graceful disconnection handling** with 15-minute grace period
- **Reconnection capability** for temporarily disconnected players
- **Session persistence** during brief network interruptions
- **Clear notifications** for connection status changes
- **LocalStorage session persistence** to maintain active game sessions across browser refreshes and PC reboots