# WebChess Architecture

## Overview

WebChess is a real-time, two-player online chess application built with a **Node.js** backend and a **Vanilla JavaScript** frontend. It facilitates game session management, real-time move synchronization via **Socket.IO**, and supports single-player practice against an AI.

## High-Level Architecture

The system follows a client-server model:

1.  **Client (Browser)**
    *   Renders the game UI (HTML/CSS).
    *   Handles user input (mouse clicks for moves).
    *   Maintains local game state for immediate feedback.
    *   Communicates with the server via WebSocket events.
    *   Executes AI logic locally in Practice Mode.

2.  **Server (Node.js)**
    *   Hosts the static frontend files.
    *   Manages game rooms and player sessions.
    *   Validates moves using shared chess logic to prevent cheating.
    *   Broadcasts game state updates to connected clients.

3.  **Shared Logic**
    *   `ChessGame` class encapsulates all chess rules.
    *   Used by both Client (for prediction/practice) and Server (for validation).

## Directory Structure

```
webchess/
├── src/
│   ├── client/         # Frontend logic (imported by public/script.js)
│   ├── server/         # Backend logic (Express, Socket.IO)
│   ├── shared/         # Common game logic (ChessGame class)
├── public/             # Static assets (HTML, CSS, client JS entry point)
├── tests/              # Jest test suites
├── deployment/         # Deployment configurations (systemd, nginx)
├── docs/               # Project documentation
```

## Key Components

### 1. Backend (`src/server/`)

*   **`index.js`**: The entry point. Sets up the Express server and initializes Socket.IO.
*   **`gameManager.js`**:
    *   Manages the lifecycle of game sessions (creation, joining, ending).
    *   Generates unique 6-character game IDs.
    *   Handles player disconnections and reconnections (15-minute grace period).
    *   Stores active `ChessGame` instances in memory.

### 2. Frontend (`public/`)

*   **`index.html`**: Single-page application structure with views for Main Menu, Host/Join, and Game Board.
*   **`script.js`**:
    *   `WebChessClient` class manages the UI state.
    *   Handles Socket.IO events (`connect`, `disconnect`, `game-start`, `move-made`).
    *   Integrates `ChessAI` for local practice games.
*   **`style.css`**: Responsive styling for the application.

### 3. Shared Logic (`src/shared/`)

*   **`chessGame.js`**:
    *   Core game engine.
    *   Validates legal moves (pseudolegal + check constraints).
    *   Manages board state (8x8 array).
    *   Handles special moves: En Passant, Castling, Promotion.
    *   Detects game end conditions: Checkmate, Stalemate, Draw.
*   **`chessAI.js`**:
    *   Implements a Minimax algorithm with Alpha-Beta pruning.
    *   Features Transposition Tables (Zobrist Hashing), Iterative Deepening, and Quiescence Search.
    *   Evaluates board positions using Piece-Square Tables (PSTs).

## Data Flow

### Multiplayer Game

1.  **Host**: User clicks "Host Game" -> Server creates room, returns Game ID.
2.  **Join**: User enters Game ID -> Server adds user to room, starts game.
3.  **Move**:
    *   Player A makes a move UI -> Client sends `make-move` event.
    *   Server receives event -> Validates move via `ChessGame`.
    *   If valid: Server updates state -> Broadcasts `move-made` to both clients.
    *   Clients receive `move-made` -> Update board UI.

### Practice Mode (Local)

1.  **Setup**: User selects Player vs AI or AI vs AI.
2.  **Start**: Client initializes local `ChessGame` and `ChessAI` instances.
3.  **Move**:
    *   Human moves: interacting directly with local `ChessGame`.
    *   AI moves: `script.js` invokes `ChessAI.getBestMove()` in a non-blocking manner (using `setTimeout`).
    *   UI updates immediately reflects changes without server interaction.

## Deployment

*   **Systemd**: Manages the Node.js process (`webchess.service`).
*   **Nginx**: Reverse proxy handling HTTP requests and WebSocket upgrades.
