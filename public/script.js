class WebChessClient {
  constructor() {
    this.socket = io();
    this.currentGameId = null;
    this.playerColor = null;
    this.gameState = null;
    this.selectedSquare = null;
    this.validMoves = [];
    this.isPracticeMode = false;
    
    this.initializeEventListeners();
    this.setupSocketListeners();
    this.loadSessionFromStorage();
  }

  initializeEventListeners() {
    // Main menu buttons
    document.getElementById('host-btn').addEventListener('click', () => this.hostGame());
    document.getElementById('join-btn').addEventListener('click', () => this.showJoinScreen());
    document.getElementById('practice-btn').addEventListener('click', () => this.startPracticeMode());
    
    // Host screen
    document.getElementById('cancel-host-btn').addEventListener('click', () => this.showMainMenu());
    
    // Join screen
    document.getElementById('join-game-btn').addEventListener('click', () => this.joinGame());
    document.getElementById('cancel-join-btn').addEventListener('click', () => this.showMainMenu());
    document.getElementById('game-id-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.joinGame();
    });
    
    // Game screen
    document.getElementById('resign-btn').addEventListener('click', () => this.resignGame());
    document.getElementById('leave-game-btn').addEventListener('click', () => this.leaveGame());
    
    // Game end screen
    document.getElementById('new-game-btn').addEventListener('click', () => this.showMainMenu());
    document.getElementById('back-to-menu-btn').addEventListener('click', () => this.showMainMenu());
    
    // Promotion modal
    document.querySelectorAll('.promotion-piece').forEach(piece => {
      piece.addEventListener('click', (e) => this.selectPromotion(e.target.dataset.piece));
    });
  }

  setupSocketListeners() {
    this.socket.on('game-created', (data) => {
      this.currentGameId = data.gameId;
      this.playerColor = 'white';
      this.saveSessionToStorage();
      this.showHostScreen(data.gameId);
    });

    this.socket.on('game-joined', (data) => {
      this.currentGameId = data.gameId;
      this.playerColor = data.color;
      this.saveSessionToStorage();
    });

    this.socket.on('opponent-joined', (data) => {
      this.showGameScreen();
    });

    this.socket.on('game-start', (data) => {
      this.gameState = data.gameState;
      this.showGameScreen();
      this.updateGameBoard();
    });

    this.socket.on('move-made', (data) => {
      this.gameState = data.gameState;
      this.updateGameBoard();
      this.updateGameStatus();
      this.addMoveToHistory(data.move);
    });

    this.socket.on('game-end', (data) => {
      this.showGameEndScreen(data.status, data.winner);
    });

    this.socket.on('join-error', (data) => {
      this.showJoinError(data.message);
    });

    this.socket.on('move-error', (data) => {
      this.showMoveError(data.message);
    });

    this.socket.on('connect', () => {
      this.updateConnectionStatus('connected');
    });

    this.socket.on('disconnect', () => {
      this.updateConnectionStatus('disconnected');
    });

    this.socket.on('reconnect', () => {
      this.updateConnectionStatus('connected');
      if (this.currentGameId) {
        this.rejoinGame();
      }
    });
  }

  loadSessionFromStorage() {
    const session = localStorage.getItem('webchess-session');
    if (session) {
      const data = JSON.parse(session);
      this.currentGameId = data.gameId;
      this.playerColor = data.color;
      this.isPracticeMode = data.isPracticeMode || false;
      
      if (this.currentGameId && !this.isPracticeMode) {
        this.rejoinGame();
      }
    }
  }

  saveSessionToStorage() {
    const session = {
      gameId: this.currentGameId,
      color: this.playerColor,
      isPracticeMode: this.isPracticeMode
    };
    localStorage.setItem('webchess-session', JSON.stringify(session));
  }

  clearSessionStorage() {
    localStorage.removeItem('webchess-session');
  }

  rejoinGame() {
    this.socket.emit('rejoin-game', {
      gameId: this.currentGameId,
      color: this.playerColor
    });
  }

  hostGame() {
    this.socket.emit('host-game');
  }

  showJoinScreen() {
    this.showScreen('join-screen');
    document.getElementById('game-id-input').focus();
  }

  joinGame() {
    const gameId = document.getElementById('game-id-input').value.trim().toUpperCase();
    if (gameId.length === 6) {
      this.socket.emit('join-game', { gameId });
    } else {
      this.showJoinError('Please enter a 6-character game ID');
    }
  }

  startPracticeMode() {
    this.isPracticeMode = true;
    this.playerColor = 'white';
    this.currentGameId = 'practice';
    this.gameState = this.createInitialGameState();
    this.saveSessionToStorage();
    this.showGameScreen();
    this.updateGameBoard();
  }

  createInitialGameState() {
    return {
      board: this.createInitialBoard(),
      currentTurn: 'white',
      status: 'active',
      winner: null,
      moveHistory: [],
      inCheck: false
    };
  }

  createInitialBoard() {
    const board = Array(8).fill(null).map(() => Array(8).fill(null));
    
    // Pawns
    for (let i = 0; i < 8; i++) {
      board[1][i] = { type: 'pawn', color: 'black' };
      board[6][i] = { type: 'pawn', color: 'white' };
    }
    
    // Rooks
    board[0][0] = { type: 'rook', color: 'black' };
    board[0][7] = { type: 'rook', color: 'black' };
    board[7][0] = { type: 'rook', color: 'white' };
    board[7][7] = { type: 'rook', color: 'white' };
    
    // Knights
    board[0][1] = { type: 'knight', color: 'black' };
    board[0][6] = { type: 'knight', color: 'black' };
    board[7][1] = { type: 'knight', color: 'white' };
    board[7][6] = { type: 'knight', color: 'white' };
    
    // Bishops
    board[0][2] = { type: 'bishop', color: 'black' };
    board[0][5] = { type: 'bishop', color: 'black' };
    board[7][2] = { type: 'bishop', color: 'white' };
    board[7][5] = { type: 'bishop', color: 'white' };
    
    // Queens
    board[0][3] = { type: 'queen', color: 'black' };
    board[7][3] = { type: 'queen', color: 'white' };
    
    // Kings
    board[0][4] = { type: 'king', color: 'black' };
    board[7][4] = { type: 'king', color: 'white' };
    
    return board;
  }

  showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
      screen.classList.add('hidden');
    });
    document.getElementById(screenId).classList.remove('hidden');
  }

  showMainMenu() {
    this.currentGameId = null;
    this.playerColor = null;
    this.gameState = null;
    this.isPracticeMode = false;
    this.clearSessionStorage();
    this.showScreen('main-menu');
  }

  showHostScreen(gameId) {
    document.getElementById('game-id-display').textContent = gameId;
    this.showScreen('host-screen');
  }

  showGameScreen() {
    this.showScreen('game-screen');
    this.updateGameInfo();
    this.createChessBoard();
  }

  showGameEndScreen(status, winner) {
    const title = document.getElementById('game-end-title');
    const message = document.getElementById('game-end-message');
    
    if (status === 'checkmate') {
      title.textContent = 'Checkmate!';
      message.textContent = `${winner === this.playerColor ? 'You win!' : 'You lose!'}`;
    } else if (status === 'stalemate') {
      title.textContent = 'Stalemate!';
      message.textContent = 'The game is a draw.';
    } else if (status === 'resigned') {
      title.textContent = 'Game Over';
      message.textContent = `${winner === this.playerColor ? 'Your opponent resigned. You win!' : 'You resigned.'}`;
    }
    
    this.showScreen('game-end-screen');
  }

  showJoinError(message) {
    const errorDiv = document.getElementById('join-error');
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
    setTimeout(() => errorDiv.classList.add('hidden'), 5000);
  }

  showMoveError(message) {
    console.error('Move error:', message);
  }

  updateGameInfo() {
    if (this.currentGameId && this.currentGameId !== 'practice') {
      document.getElementById('game-id-small').textContent = `Game ID: ${this.currentGameId}`;
    } else {
      document.getElementById('game-id-small').textContent = 'Practice Mode';
    }
    
    document.getElementById('player-color').textContent = `You are: ${this.playerColor}`;
  }

  createChessBoard() {
    const board = document.getElementById('chess-board');
    board.innerHTML = '';
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const square = document.createElement('div');
        square.className = 'chess-square';
        square.classList.add((row + col) % 2 === 0 ? 'light' : 'dark');
        square.dataset.row = row;
        square.dataset.col = col;
        
        square.addEventListener('click', (e) => this.handleSquareClick(e));
        
        board.appendChild(square);
      }
    }
  }

  updateGameBoard() {
    if (!this.gameState) return;
    
    const squares = document.querySelectorAll('.chess-square');
    squares.forEach(square => {
      const row = parseInt(square.dataset.row);
      const col = parseInt(square.dataset.col);
      const piece = this.gameState.board[row][col];
      
      square.innerHTML = '';
      square.classList.remove('selected', 'valid-move', 'capture-move');
      
      if (piece) {
        const pieceElement = document.createElement('div');
        pieceElement.className = 'chess-piece';
        pieceElement.textContent = this.getPieceUnicode(piece);
        square.appendChild(pieceElement);
      }
    });
    
    this.updateGameStatus();
  }

  getPieceUnicode(piece) {
    const pieces = {
      white: {
        king: '♔', queen: '♕', rook: '♖',
        bishop: '♗', knight: '♘', pawn: '♙'
      },
      black: {
        king: '♚', queen: '♛', rook: '♜',
        bishop: '♝', knight: '♞', pawn: '♟'
      }
    };
    return pieces[piece.color][piece.type];
  }

  handleSquareClick(event) {
    const square = event.currentTarget;
    const row = parseInt(square.dataset.row);
    const col = parseInt(square.dataset.col);
    
    if (this.selectedSquare) {
      if (this.selectedSquare.row === row && this.selectedSquare.col === col) {
        this.clearSelection();
        return;
      }
      
      if (this.isValidMove(row, col)) {
        this.makeMove(this.selectedSquare, { row, col });
        this.clearSelection();
        return;
      }
    }
    
    const piece = this.gameState.board[row][col];
    if (piece && piece.color === this.gameState.currentTurn) {
      if (this.isPracticeMode || piece.color === this.playerColor) {
        this.selectSquare(row, col);
      }
    }
  }

  selectSquare(row, col) {
    this.clearSelection();
    this.selectedSquare = { row, col };
    
    const square = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    square.classList.add('selected');
    
    this.highlightValidMoves(row, col);
  }

  clearSelection() {
    document.querySelectorAll('.chess-square').forEach(square => {
      square.classList.remove('selected', 'valid-move', 'capture-move');
    });
    this.selectedSquare = null;
    this.validMoves = [];
  }

  highlightValidMoves(row, col) {
    this.validMoves = this.getValidMoves(row, col);
    
    this.validMoves.forEach(move => {
      const square = document.querySelector(`[data-row="${move.row}"][data-col="${move.col}"]`);
      const isCapture = this.gameState.board[move.row][move.col] !== null;
      square.classList.add(isCapture ? 'capture-move' : 'valid-move');
    });
  }

  getValidMoves(row, col) {
    const moves = [];
    const piece = this.gameState.board[row][col];
    
    if (!piece) return moves;
    
    for (let toRow = 0; toRow < 8; toRow++) {
      for (let toCol = 0; toCol < 8; toCol++) {
        if (this.isValidMoveForPiece(piece, row, col, toRow, toCol)) {
          moves.push({ row: toRow, col: toCol });
        }
      }
    }
    
    return moves;
  }

  isValidMoveForPiece(piece, fromRow, fromCol, toRow, toCol) {
    if (fromRow === toRow && fromCol === toCol) return false;
    
    const target = this.gameState.board[toRow][toCol];
    if (target && target.color === piece.color) return false;
    
    switch (piece.type) {
      case 'pawn':
        return this.isValidPawnMove(piece, fromRow, fromCol, toRow, toCol);
      case 'rook':
        return this.isValidRookMove(fromRow, fromCol, toRow, toCol);
      case 'knight':
        return this.isValidKnightMove(fromRow, fromCol, toRow, toCol);
      case 'bishop':
        return this.isValidBishopMove(fromRow, fromCol, toRow, toCol);
      case 'queen':
        return this.isValidQueenMove(fromRow, fromCol, toRow, toCol);
      case 'king':
        return this.isValidKingMove(fromRow, fromCol, toRow, toCol);
      default:
        return false;
    }
  }

  isValidPawnMove(piece, fromRow, fromCol, toRow, toCol) {
    const direction = piece.color === 'white' ? -1 : 1;
    const startRow = piece.color === 'white' ? 6 : 1;
    const rowDiff = toRow - fromRow;
    const colDiff = Math.abs(toCol - fromCol);
    
    if (colDiff === 0) {
      if (rowDiff === direction && !this.gameState.board[toRow][toCol]) {
        return true;
      }
      if (fromRow === startRow && rowDiff === 2 * direction && !this.gameState.board[toRow][toCol]) {
        return true;
      }
    }
    
    if (colDiff === 1 && rowDiff === direction) {
      return this.gameState.board[toRow][toCol] !== null;
    }
    
    return false;
  }

  isValidRookMove(fromRow, fromCol, toRow, toCol) {
    return (fromRow === toRow || fromCol === toCol) && this.isPathClear(fromRow, fromCol, toRow, toCol);
  }

  isValidKnightMove(fromRow, fromCol, toRow, toCol) {
    const rowDiff = Math.abs(toRow - fromRow);
    const colDiff = Math.abs(toCol - fromCol);
    return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
  }

  isValidBishopMove(fromRow, fromCol, toRow, toCol) {
    const rowDiff = Math.abs(toRow - fromRow);
    const colDiff = Math.abs(toCol - fromCol);
    return rowDiff === colDiff && this.isPathClear(fromRow, fromCol, toRow, toCol);
  }

  isValidQueenMove(fromRow, fromCol, toRow, toCol) {
    return this.isValidRookMove(fromRow, fromCol, toRow, toCol) || 
           this.isValidBishopMove(fromRow, fromCol, toRow, toCol);
  }

  isValidKingMove(fromRow, fromCol, toRow, toCol) {
    const rowDiff = Math.abs(toRow - fromRow);
    const colDiff = Math.abs(toCol - fromCol);
    return rowDiff <= 1 && colDiff <= 1;
  }

  isPathClear(fromRow, fromCol, toRow, toCol) {
    const rowStep = toRow === fromRow ? 0 : (toRow - fromRow) / Math.abs(toRow - fromRow);
    const colStep = toCol === fromCol ? 0 : (toCol - fromCol) / Math.abs(toCol - fromCol);
    
    let row = fromRow + rowStep;
    let col = fromCol + colStep;
    
    while (row !== toRow || col !== toCol) {
      if (this.gameState.board[row][col]) {
        return false;
      }
      row += rowStep;
      col += colStep;
    }
    
    return true;
  }

  isValidMove(row, col) {
    return this.validMoves.some(move => move.row === row && move.col === col);
  }

  makeMove(from, to) {
    const move = { from, to };
    
    if (this.isPracticeMode) {
      this.makePracticeMove(move);
    } else {
      this.socket.emit('make-move', {
        gameId: this.currentGameId,
        move: move
      });
    }
  }

  makePracticeMove(move) {
    const piece = this.gameState.board[move.from.row][move.from.col];
    
    this.gameState.board[move.to.row][move.to.col] = piece;
    this.gameState.board[move.from.row][move.from.col] = null;
    
    this.gameState.currentTurn = this.gameState.currentTurn === 'white' ? 'black' : 'white';
    this.gameState.moveHistory.push(move);
    
    this.updateGameBoard();
    this.addMoveToHistory(move);
  }

  addMoveToHistory(move) {
    const moveList = document.getElementById('move-list');
    const moveItem = document.createElement('div');
    moveItem.className = 'move-item';
    moveItem.textContent = this.formatMove(move);
    moveList.appendChild(moveItem);
    moveList.scrollTop = moveList.scrollHeight;
  }

  formatMove(move) {
    const fromSquare = String.fromCharCode(97 + move.from.col) + (8 - move.from.row);
    const toSquare = String.fromCharCode(97 + move.to.col) + (8 - move.to.row);
    return `${fromSquare}-${toSquare}`;
  }

  updateGameStatus() {
    const turnIndicator = document.getElementById('turn-indicator');
    const checkIndicator = document.getElementById('check-indicator');
    
    if (this.gameState) {
      turnIndicator.textContent = `Turn: ${this.gameState.currentTurn}`;
      
      if (this.gameState.inCheck) {
        checkIndicator.classList.remove('hidden');
      } else {
        checkIndicator.classList.add('hidden');
      }
    }
  }

  updateConnectionStatus(status) {
    const indicator = document.getElementById('connection-indicator');
    const text = document.querySelector('.indicator-text');
    
    indicator.className = `connection-indicator ${status}`;
    text.textContent = status.charAt(0).toUpperCase() + status.slice(1);
  }

  resignGame() {
    if (confirm('Are you sure you want to resign?')) {
      if (this.isPracticeMode) {
        this.showMainMenu();
      } else {
        this.socket.emit('resign', { gameId: this.currentGameId });
      }
    }
  }

  leaveGame() {
    if (confirm('Are you sure you want to leave the game?')) {
      this.showMainMenu();
    }
  }

  selectPromotion(pieceType) {
    document.getElementById('promotion-modal').classList.add('hidden');
    // Handle promotion logic here
  }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
  new WebChessClient();
});