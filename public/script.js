class WebChessClient {
  constructor() {
    this.socket = null;
    this.currentGameId = null;
    this.playerColor = null;
    this.gameState = null;
    this.selectedSquare = null;
    this.validMoves = [];
    this.isPracticeMode = false;
    this.practiceMode = 'self'; // 'self', 'ai-white', 'ai-black', 'ai-vs-ai'
    this.aiDifficulty = 'medium';
    this.aiEngine = null;
    this.aiPaused = false;
    this.aiMoveDelay = 1000; // 1 second delay for AI moves
    this.pendingPromotionMove = null;
    
    // Make this instance globally accessible for testing
    window.webChessClient = this;
    
    this.initializeSocket();
    this.initializeEventListeners();
    this.setupSocketListeners();
    this.loadSessionFromStorage();
  }
  
  initializeSocket() {
    try {
      this.socket = io();
    } catch (error) {
      console.error('Socket.IO not available:', error);
      this.socket = null;
    }
  }

  initializeEventListeners() {
    // Main menu buttons
    document.getElementById('resume-btn').addEventListener('click', () => this.resumeGame());
    document.getElementById('host-btn').addEventListener('click', () => this.hostGame());
    document.getElementById('join-btn').addEventListener('click', () => this.showJoinScreen());
    document.getElementById('practice-btn').addEventListener('click', () => this.showPracticeScreen());
    
    // Host screen
    document.getElementById('cancel-host-btn').addEventListener('click', () => this.showMainMenu());
    
    // Join screen
    document.getElementById('join-game-btn').addEventListener('click', () => this.joinGame());
    document.getElementById('cancel-join-btn').addEventListener('click', () => this.showMainMenu());
    document.getElementById('game-id-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.joinGame();
    });
    
    // Practice screen
    document.getElementById('practice-self-btn').addEventListener('click', () => this.startPracticeMode('self'));
    document.getElementById('practice-ai-white-btn').addEventListener('click', () => this.startPracticeMode('ai-white'));
    document.getElementById('practice-ai-black-btn').addEventListener('click', () => this.startPracticeMode('ai-black'));
    document.getElementById('practice-ai-vs-ai-btn').addEventListener('click', () => this.startPracticeMode('ai-vs-ai'));
    document.getElementById('cancel-practice-btn').addEventListener('click', () => this.showMainMenu());
    
    // Game screen
    document.getElementById('resign-btn').addEventListener('click', () => this.resignGame());
    document.getElementById('leave-game-btn').addEventListener('click', () => this.leaveGame());
    document.getElementById('debug-dump-btn').addEventListener('click', () => this.debugDumpGameState());
    
    // AI controls
    document.getElementById('pause-ai-btn').addEventListener('click', () => this.toggleAIPause());
    document.getElementById('step-ai-btn').addEventListener('click', () => this.stepAI());
    
    // Chat controls
    document.getElementById('send-chat-btn').addEventListener('click', () => this.sendChatMessage());
    document.getElementById('chat-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.sendChatMessage();
    });
    
    // Mobile chat controls
    document.getElementById('mobile-chat-toggle').addEventListener('click', () => this.toggleMobileChat());
    document.getElementById('mobile-chat-close').addEventListener('click', () => this.closeMobileChat());
    document.getElementById('mobile-send-chat-btn').addEventListener('click', () => this.sendMobileChatMessage());
    document.getElementById('mobile-chat-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.sendMobileChatMessage();
    });
    
    // Fullscreen control
    document.getElementById('fullscreen-btn').addEventListener('click', () => this.toggleFullscreen());
    
    // Game end screen
    document.getElementById('new-game-btn').addEventListener('click', () => this.showMainMenu());
    document.getElementById('back-to-menu-btn').addEventListener('click', () => this.showMainMenu());
    
    // Promotion modal
    document.querySelectorAll('.promotion-piece').forEach(piece => {
      piece.addEventListener('click', (e) => this.selectPromotion(e.target.dataset.piece));
    });
  }

  setupSocketListeners() {
    if (!this.socket) return;
    
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
      
      // Request chat history when opponent joins
      if (!this.isPracticeMode && this.socket) {
        if (this.socket) this.socket.emit('get-chat-history', { gameId: this.currentGameId });
      }
    });

    this.socket.on('game-start', (data) => {
      this.gameState = data.gameState;
      this.showGameScreen();
      this.updateGameBoard();
      
      // Request chat history for the game
      if (!this.isPracticeMode) {
        if (this.socket) this.socket.emit('get-chat-history', { gameId: this.currentGameId });
      }
    });

    this.socket.on('move-made', (data) => {
      this.gameState = data.gameState;
      this.updateGameBoard();
      this.updateGameStatus();
      this.addMoveToHistory(data.move);
    });

    this.socket.on('game-end', (data) => {
      this.showGameEndScreen(data.status, data.winner);
      // Clear session since game has ended
      this.clearGameSession();
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

    this.socket.on('chat-message', (data) => {
      this.addChatMessage(data.message, data.sender, data.isOwn);
      // Also add to mobile chat
      this.addMobileChatMessage(data.message, data.sender, data.isOwn);
    });

    this.socket.on('chat-history', (data) => {
      if (data.gameId === this.currentGameId) {
        this.clearChat();
        // Clear mobile chat too
        const mobileMessages = document.getElementById('mobile-chat-messages');
        mobileMessages.innerHTML = '';
        
        data.messages.forEach(msg => {
          this.addChatMessage(msg.message, msg.sender, msg.isOwn);
          this.addMobileChatMessage(msg.message, msg.sender, msg.isOwn);
        });
      }
    });

    this.socket.on('session-validation', (data) => {
      if (!data.valid) {
        // Session is invalid, clear it
        this.clearGameSession();
      } else {
        // Session is valid, show resume button
        this.updateResumeButton();
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
      
      // Load additional practice mode data if available
      if (this.isPracticeMode && data.practiceData) {
        this.practiceMode = data.practiceData.mode;
        this.aiDifficulty = data.practiceData.difficulty;
        this.gameState = data.practiceData.gameState;
      }
      
      // Only validate multiplayer sessions
      if (this.currentGameId && !this.isPracticeMode) {
        this.validateSession();
      }
    }
  }
  
  validateSession() {
    if (this.currentGameId && !this.isPracticeMode) {
      if (this.socket) this.socket.emit('validate-session', { gameId: this.currentGameId });
    }
  }

  saveSessionToStorage() {
    const session = {
      gameId: this.currentGameId,
      color: this.playerColor,
      isPracticeMode: this.isPracticeMode
    };
    
    // Save additional practice mode data
    if (this.isPracticeMode && this.gameState) {
      session.practiceData = {
        mode: this.practiceMode,
        difficulty: this.aiDifficulty,
        gameState: this.gameState
      };
    }
    
    localStorage.setItem('webchess-session', JSON.stringify(session));
  }

  clearSessionStorage() {
    localStorage.removeItem('webchess-session');
  }

  rejoinGame() {
    if (this.socket) this.socket.emit('rejoin-game', {
      gameId: this.currentGameId,
      color: this.playerColor
    });
    
    // Request chat history on rejoin
    if (!this.isPracticeMode && this.currentGameId && this.currentGameId !== 'practice') {
      setTimeout(() => {
        if (this.socket) this.socket.emit('get-chat-history', { gameId: this.currentGameId });
      }, 1000); // Small delay to ensure game state is restored first
    }
  }

  resumePracticeGame() {
    // Initialize AI engine with saved difficulty
    this.aiEngine = new ChessAI(this.aiDifficulty);
    this.aiPaused = false;
    
    // Show game screen and update board
    this.showGameScreen();
    this.updateGameBoard();
    
    // Continue AI if it's AI's turn
    if (this.shouldAIMove()) {
      setTimeout(() => this.makeAIMove(), this.aiMoveDelay);
    }
  }

  hostGame() {
    this.resignFromPreviousGame();
    if (!this.socket) return;
    this.socket.emit('host-game');
  }
  
  resumeGame() {
    if (this.currentGameId) {
      if (this.isPracticeMode) {
        this.resumePracticeGame();
      } else {
        this.rejoinGame();
      }
    }
  }
  
  showResumeButton() {
    // Show if there's actually something to resume (multiplayer or practice)
    if (this.currentGameId) {
      this.updateResumeButton();
    }
  }
  
  updateResumeButton() {
    const resumeSection = document.getElementById('resume-section');
    const resumeInfo = document.getElementById('resume-info');
    
    // Show resume button for both multiplayer and practice sessions
    const hasValidSession = this.currentGameId && 
                           (this.currentGameId !== 'practice' || this.isPracticeMode);
    
    if (hasValidSession) {
      resumeSection.classList.remove('hidden');
      if (this.isPracticeMode) {
        resumeInfo.textContent = 'Resume practice game';
      } else {
        resumeInfo.textContent = `Resume game: ${this.currentGameId}`;
      }
    } else {
      resumeSection.classList.add('hidden');
    }
  }
  
  resignFromPreviousGame() {
    if (this.currentGameId && !this.isPracticeMode) {
      // Send resignation for previous game
      if (this.socket) this.socket.emit('resign', { gameId: this.currentGameId });
      this.clearGameSession();
    }
  }
  
  clearGameSession() {
    this.currentGameId = null;
    this.playerColor = null;
    this.gameState = null;
    this.isPracticeMode = false;
    this.clearSessionStorage();
    this.updateResumeButton();
  }

  showJoinScreen() {
    this.showScreen('join-screen');
    document.getElementById('game-id-input').focus();
  }
  
  showPracticeScreen() {
    this.showScreen('practice-screen');
  }

  joinGame() {
    const gameId = document.getElementById('game-id-input').value.trim().toUpperCase();
    if (gameId.length === 6) {
      this.resignFromPreviousGame();
      if (this.socket) this.socket.emit('join-game', { gameId });
    } else {
      this.showJoinError('Please enter a 6-character game ID');
    }
  }

  startPracticeMode(mode = 'self') {
    this.isPracticeMode = true;
    this.practiceMode = mode;
    this.aiDifficulty = document.getElementById('difficulty-select').value;
    this.aiEngine = new ChessAI(this.aiDifficulty);
    this.aiPaused = false;
    
    switch (mode) {
      case 'self':
        this.playerColor = 'both';
        break;
      case 'ai-white':
        this.playerColor = 'white'; // Human plays white when AI plays black
        break;
      case 'ai-black':
        this.playerColor = 'black'; // Human plays black when AI plays white
        break;
      case 'ai-vs-ai':
        this.playerColor = 'spectator';
        break;
    }
    
    this.currentGameId = 'practice';
    this.gameState = this.createInitialGameState();
    this.saveSessionToStorage();
    this.showGameScreen();
    this.updateGameBoard();
    
    // Start AI if needed
    if (this.shouldAIMove()) {
      setTimeout(() => this.makeAIMove(), this.aiMoveDelay);
    }
  }

  createInitialGameState() {
    return {
      board: this.createInitialBoard(),
      currentTurn: 'white',
      status: 'active',
      winner: null,
      moveHistory: [],
      inCheck: false,
      castlingRights: {
        whiteKingSide: true,
        whiteQueenSide: true,
        blackKingSide: true,
        blackQueenSide: true
      },
      enPassantTarget: null, // { row, col } of the square where en passant can be captured
      fiftyMoveRule: 0, // Counter for 50-move rule
      positionHistory: [], // For threefold repetition
      competitiveRules: {
        fiftyMoveRule: true,
        threefoldRepetition: true,
        insufficientMaterial: true
      }
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
    // Don't clear session data when just showing main menu
    // Only clear when explicitly leaving/ending a game
    this.clearChat();
    this.showScreen('main-menu');
    this.updateResumeButton();
  }

  showHostScreen(gameId) {
    document.getElementById('game-id-display').textContent = gameId;
    this.showScreen('host-screen');
  }

  showGameScreen() {
    this.showScreen('game-screen');
    this.updateGameInfo();
    this.createChessBoard();
    this.clearMoveHistory();
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
      const modeText = this.getModeDisplayText();
      document.getElementById('game-id-small').textContent = `Practice Mode: ${modeText}`;
    }
    
    if (this.playerColor === 'spectator') {
      document.getElementById('player-color').textContent = 'Spectating AI vs AI';
    } else if (this.playerColor === 'both') {
      document.getElementById('player-color').textContent = 'Playing both sides';
    } else {
      document.getElementById('player-color').textContent = `You are: ${this.playerColor}`;
    }
    
    // Show/hide AI controls
    const aiControls = document.getElementById('ai-controls');
    if (this.practiceMode === 'ai-vs-ai') {
      aiControls.classList.remove('hidden');
    } else {
      aiControls.classList.add('hidden');
    }
    
    // Show/hide chat section (only for multiplayer)
    const chatSection = document.getElementById('chat-section');
    const shouldShowChat = !this.isPracticeMode && this.currentGameId;
    
    if (shouldShowChat) {
      chatSection.classList.remove('hidden');
    } else {
      chatSection.classList.add('hidden');
    }
    
    // Update mobile chat visibility
    this.updateMobileChatVisibility();
  }
  
  getModeDisplayText() {
    switch (this.practiceMode) {
      case 'self': return 'Play Both Sides';
      case 'ai-white': return 'You vs AI (You: White)';
      case 'ai-black': return 'You vs AI (You: Black)';
      case 'ai-vs-ai': return 'AI vs AI';
      default: return 'Unknown';
    }
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
    
    // Don't allow clicks in AI vs AI mode or when it's not the player's turn
    if (this.isPracticeMode && this.practiceMode === 'ai-vs-ai') {
      console.log('Click blocked: AI vs AI mode');
      return;
    }
    
    if (!this.canPlayerMove()) {
      console.log(`Click blocked: canPlayerMove=false, mode=${this.practiceMode}, currentTurn=${this.gameState.currentTurn}`);
      return;
    }
    
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
    if (piece) {
      let canSelect = false;
      
      if (this.isPracticeMode) {
        // Practice mode: use the practice-specific logic
        canSelect = this.canPlayerMovePiece(piece);
        console.log(`Square click: mode=${this.practiceMode}, piece=${piece.color}, canSelect=${canSelect}, currentTurn=${this.gameState.currentTurn}`);
      } else {
        // Multiplayer mode: can select if it's the player's piece color
        canSelect = (piece.color === this.playerColor);
      }
      
      if (canSelect) {
        console.log(`Selecting square ${row},${col} with piece:`, piece);
        this.selectSquare(row, col);
      } else {
        console.log(`Cannot select square ${row},${col} with piece:`, piece);
      }
    }
  }
  
  canPlayerMove() {
    // In multiplayer mode, check if it's the player's turn
    if (!this.isPracticeMode) {
      return this.gameState.currentTurn === this.playerColor;
    }
    
    // Practice mode logic
    if (this.practiceMode === 'self') return true;
    if (this.practiceMode === 'ai-vs-ai') return false;
    if (this.practiceMode === 'ai-white') return this.gameState.currentTurn === 'white'; // Human plays white, AI plays black
    if (this.practiceMode === 'ai-black') return this.gameState.currentTurn === 'black'; // Human plays black, AI plays white
    return true; // Default to allowing moves
  }
  
  canPlayerMovePiece(piece) {
    // In multiplayer mode, check if the piece belongs to the player
    if (!this.isPracticeMode) {
      return piece.color === this.playerColor;
    }
    
    // Practice mode logic
    if (this.practiceMode === 'self') return true;
    if (this.practiceMode === 'ai-vs-ai') return false;
    if (this.practiceMode === 'ai-white') return piece.color === 'white'; // Human plays white, AI plays black
    if (this.practiceMode === 'ai-black') return piece.color === 'black'; // Human plays black, AI plays white
    return true; // Default to allowing moves
  }

  selectSquare(row, col) {
    console.log(`Selecting square ${row},${col}`);
    this.clearSelection();
    this.selectedSquare = { row, col };
    
    const square = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    if (square) {
      square.classList.add('selected');
      console.log('Added selected class to square');
    } else {
      console.error(`Could not find square element for ${row},${col}`);
    }
    
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
    console.log(`Valid moves for ${row},${col}:`, this.validMoves);
    
    this.validMoves.forEach(move => {
      const square = document.querySelector(`[data-row="${move.row}"][data-col="${move.col}"]`);
      if (square) {
        const isCapture = this.gameState.board[move.row][move.col] !== null;
        square.classList.add(isCapture ? 'capture-move' : 'valid-move');
        console.log(`Highlighted square ${move.row},${move.col} as ${isCapture ? 'capture' : 'valid'} move`);
      }
    });
  }

  getValidMoves(row, col) {
    const moves = [];
    const piece = this.gameState.board[row][col];
    
    if (!piece) {
      console.log(`No piece at ${row},${col}`);
      return moves;
    }
    
    console.log(`Getting valid moves for ${piece.color} ${piece.type} at ${row},${col}`);
    
    // Optimize for pawns - only check a few possible moves instead of all 64 squares
    if (piece.type === 'pawn') {
      const direction = piece.color === 'white' ? -1 : 1;
      const startRow = piece.color === 'white' ? 6 : 1;
      console.log(`Pawn optimization: direction=${direction}, startRow=${startRow}, current row=${row}`);
      
      // Check one square forward
      const oneForward = row + direction;
      console.log(`Checking one forward: ${oneForward}`);
      if (oneForward >= 0 && oneForward < 8) {
        console.log(`One forward is valid, calling isValidMoveForPiece(${row},${col} -> ${oneForward},${col})`);
        if (this.isValidMoveForPiece(piece, row, col, oneForward, col)) {
          console.log('One forward move added');
          moves.push({ row: oneForward, col });
        }
      }
      
      // Check two squares forward from starting position
      if (row === startRow) {
        const twoForward = row + 2 * direction;
        console.log(`Checking two forward: ${twoForward}`);
        if (twoForward >= 0 && twoForward < 8) {
          console.log(`Two forward is valid, calling isValidMoveForPiece(${row},${col} -> ${twoForward},${col})`);
          if (this.isValidMoveForPiece(piece, row, col, twoForward, col)) {
            console.log('Two forward move added');
            moves.push({ row: twoForward, col });
          }
        }
      }
      
      // Check diagonal captures
      for (let colOffset of [-1, 1]) {
        const newCol = col + colOffset;
        const newRow = row + direction;
        if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
          if (this.isValidMoveForPiece(piece, row, col, newRow, newCol)) {
            moves.push({ row: newRow, col: newCol });
          }
        }
      }
    } else {
      // For other pieces, check all squares
      for (let toRow = 0; toRow < 8; toRow++) {
        for (let toCol = 0; toCol < 8; toCol++) {
          if (this.isValidMoveForPiece(piece, row, col, toRow, toCol)) {
            moves.push({ row: toRow, col: toCol });
          }
        }
      }
    }
    
    console.log(`Total valid moves found: ${moves.length}`, moves);
    return moves;
  }

  isValidMoveForPiece(piece, fromRow, fromCol, toRow, toCol) {
    console.log(`isValidMoveForPiece: ${piece.color} ${piece.type} from ${fromRow},${fromCol} to ${toRow},${toCol}`);
    
    if (fromRow === toRow && fromCol === toCol) {
      console.log('Same square, invalid');
      return false;
    }
    
    const target = this.gameState.board[toRow][toCol];
    if (target && target.color === piece.color) {
      console.log('Same color piece at target, invalid');
      return false;
    }
    
    switch (piece.type) {
      case 'pawn':
        console.log('Calling pawn validation');
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
        console.log('Unknown piece type');
        return false;
    }
  }

  isValidPawnMove(piece, fromRow, fromCol, toRow, toCol) {
    const direction = piece.color === 'white' ? -1 : 1;
    const startRow = piece.color === 'white' ? 6 : 1;
    const rowDiff = toRow - fromRow;
    const colDiff = Math.abs(toCol - fromCol);
    
    console.log(`Checking pawn move: ${piece.color} from ${fromRow},${fromCol} to ${toRow},${toCol}`);
    console.log(`Direction: ${direction}, startRow: ${startRow}, rowDiff: ${rowDiff}, colDiff: ${colDiff}`);
    console.log(`Target square content:`, this.gameState.board[toRow][toCol]);
    
    // Forward move
    if (colDiff === 0) {
      if (rowDiff === direction && !this.gameState.board[toRow][toCol]) {
        console.log(`Pawn one-square move valid: ${fromRow},${fromCol} -> ${toRow},${toCol}`);
        return true;
      }
      if (fromRow === startRow && rowDiff === 2 * direction && !this.gameState.board[toRow][toCol]) {
        console.log(`Pawn two-square move valid: ${fromRow},${fromCol} -> ${toRow},${toCol}`);
        return true;
      }
      console.log(`Forward move blocked or invalid`);
    }
    
    // Diagonal capture
    if (colDiff === 1 && rowDiff === direction) {
      // Regular capture
      if (this.gameState.board[toRow][toCol] !== null) {
        return true;
      }
      
      // En passant capture
      if (this.gameState.enPassantTarget &&
          this.gameState.enPassantTarget.row === toRow &&
          this.gameState.enPassantTarget.col === toCol) {
        return true;
      }
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
    
    // Normal king move (one square in any direction)
    if (rowDiff <= 1 && colDiff <= 1) {
      return true;
    }
    
    // Castling move
    if (rowDiff === 0 && colDiff === 2) {
      return this.isValidCastlingMove(fromRow, fromCol, toRow, toCol);
    }
    
    return false;
  }

  isValidCastlingMove(fromRow, fromCol, toRow, toCol) {
    // Check if castling is valid
    const piece = this.gameState.board[fromRow][fromCol];
    if (!piece || piece.type !== 'king') return false;
    
    // King must be on starting square
    const startRow = piece.color === 'white' ? 7 : 0;
    if (fromRow !== startRow || fromCol !== 4) return false;
    
    // Check castling rights
    const isKingSide = toCol > fromCol;
    const castlingRight = piece.color === 'white' 
      ? (isKingSide ? 'whiteKingSide' : 'whiteQueenSide')
      : (isKingSide ? 'blackKingSide' : 'blackQueenSide');
    
    if (!this.gameState.castlingRights[castlingRight]) return false;
    
    // Check if king is in check
    if (this.isKingInCheck(piece.color)) return false;
    
    // Check if path is clear and king doesn't move through check
    const rookCol = isKingSide ? 7 : 0;
    const direction = isKingSide ? 1 : -1;
    const rook = this.gameState.board[startRow][rookCol];
    
    if (!rook || rook.type !== 'rook' || rook.color !== piece.color) return false;
    
    // Check squares between king and rook are empty
    const startCol = Math.min(fromCol, rookCol) + 1;
    const endCol = Math.max(fromCol, rookCol) - 1;
    
    for (let col = startCol; col <= endCol; col++) {
      if (this.gameState.board[startRow][col] !== null) return false;
    }
    
    // Check that king doesn't move through check
    for (let col = fromCol; col !== toCol; col += direction) {
      if (this.wouldKingBeInCheck(piece.color, startRow, col)) return false;
    }
    
    return true;
  }

  wouldKingBeInCheck(color, row, col) {
    // Temporarily place king at the position and check if it's in check
    const originalPiece = this.gameState.board[row][col];
    this.gameState.board[row][col] = { type: 'king', color: color };
    
    const inCheck = this.isKingInCheck(color);
    
    // Restore original piece
    this.gameState.board[row][col] = originalPiece;
    
    return inCheck;
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
      if (this.socket) this.socket.emit('make-move', {
        gameId: this.currentGameId,
        move: move
      });
    }
  }

  makePracticeMove(move) {
    // Validate the move before executing
    if (!this.isValidMoveObject(move)) {
      this.showInvalidMoveMessage();
      return;
    }
    
    // Check for pawn promotion before making the move
    const piece = this.gameState.board[move.from.row][move.from.col];
    const isPromotion = piece && piece.type === 'pawn' && 
                       ((piece.color === 'white' && move.to.row === 0) || 
                        (piece.color === 'black' && move.to.row === 7));
    
    if (isPromotion) {
      // Store the pending promotion move and show modal
      this.pendingPromotionMove = move;
      this.showPromotionModal();
      return;
    }
    
    // Execute the move
    this.executeMove(move);
  }
  
  executeMove(move) {
    const piece = this.gameState.board[move.from.row][move.from.col];
    const capturedPiece = this.gameState.board[move.to.row][move.to.col];
    
    // Handle castling
    if (piece.type === 'king' && Math.abs(move.to.col - move.from.col) === 2) {
      this.executeCastling(move);
    } else {
      // Regular move
      this.gameState.board[move.to.row][move.to.col] = piece;
      this.gameState.board[move.from.row][move.from.col] = null;
    }
    
    // Update castling rights
    this.updateCastlingRights(move, piece);
    
    // Handle en passant
    this.handleEnPassant(move, piece);
    
    // Update fifty-move rule counter
    this.updateFiftyMoveRule(move, piece);
    
    // Add position to history for threefold repetition
    this.addPositionToHistory();
    
    // Update turn and add move to history with color info
    const currentColor = this.gameState.currentTurn;
    this.gameState.currentTurn = this.gameState.currentTurn === 'white' ? 'black' : 'white';
    
    // Enhance move object with piece color and type for history
    const enhancedMove = {
      ...move,
      color: currentColor,
      piece: piece.type,
      captured: capturedPiece ? capturedPiece.type : null
    };
    this.gameState.moveHistory.push(enhancedMove);
    
    // Update check status
    this.updateCheckStatus();
    
    this.updateGameBoard();
    this.addMoveToHistory(move);
    
    // Save session after successful move
    this.saveSessionToStorage();
    
    // Check if AI should make next move
    if (this.shouldAIMove() && this.gameState.status === 'active') {
      setTimeout(() => this.makeAIMove(), this.aiMoveDelay);
    }
  }
  
  createChessGameFromState() {
    // For client-side, we'll work directly with the game state
    // since we can't instantiate the full ChessGame class
    return {
      board: this.gameState.board.map(row => 
        row.map(piece => piece ? {...piece} : null)
      ),
      currentTurn: this.gameState.currentTurn,
      status: this.gameState.status,
      winner: this.gameState.winner,
      moveHistory: [...this.gameState.moveHistory],
      makeMove: (move) => {
        // Simple move execution for AI - don't change turn here as executeMove will handle it
        const piece = this.gameState.board[move.from.row][move.from.col];
        if (!piece) return { success: false };
        
        this.gameState.board[move.to.row][move.to.col] = piece;
        this.gameState.board[move.from.row][move.from.col] = null;
        // Don't change turn or update move history here - executeMove will handle it
        
        return { success: true };
      },
      getGameState: () => {
        return this.gameState;
      }
    };
  }
  
  shouldAIMove() {
    if (!this.aiEngine || this.aiPaused) return false;
    
    switch (this.practiceMode) {
      case 'ai-vs-ai':
        return true;
      case 'ai-white':
        return this.gameState.currentTurn === 'black'; // AI plays black when human plays white
      case 'ai-black':
        return this.gameState.currentTurn === 'white'; // AI plays white when human plays black
      default:
        return false;
    }
  }
  
  makeAIMove() {
    if (!this.shouldAIMove() || !this.gameState || this.gameState.status !== 'active') {
      console.log('AI should not move:', this.shouldAIMove(), this.gameState?.status);
      return;
    }
    
    console.log('AI attempting to move for', this.gameState.currentTurn);
    const aiMove = this.aiEngine.getBestMove(this.gameState);
    console.log('AI selected move:', aiMove);
    
    if (aiMove) {
      // Validate the AI move using the same checks as player moves
      if (!this.isValidMoveObject(aiMove)) {
        console.error('AI generated invalid move:', aiMove);
        // Try to find a valid move instead of returning
        console.log('AI attempting to find alternative move...');
        const validMoves = this.getAllValidMovesForColor(this.gameState.currentTurn);
        if (validMoves.length > 0) {
          const fallbackMove = validMoves[Math.floor(Math.random() * validMoves.length)];
          console.log('AI using fallback move:', fallbackMove);
          this.executeMove(fallbackMove);
        } else {
          console.error('No valid moves available for AI');
        }
        return;
      }
      
      // Execute the move using the same method as player moves
      this.executeMove(aiMove);
    }
  }
  
  toggleAIPause() {
    this.aiPaused = !this.aiPaused;
    const btn = document.getElementById('pause-ai-btn');
    btn.textContent = this.aiPaused ? 'Resume' : 'Pause';
    
    if (!this.aiPaused && this.shouldAIMove()) {
      setTimeout(() => this.makeAIMove(), this.aiMoveDelay);
    }
  }
  
  stepAI() {
    if (this.practiceMode === 'ai-vs-ai' && this.gameState.status === 'active') {
      this.makeAIMove();
    }
  }

  addMoveToHistory(move) {
    const moveList = document.getElementById('move-list');
    const moveItem = document.createElement('div');
    moveItem.className = 'move-item';
    moveItem.textContent = this.formatMove(move);
    moveList.appendChild(moveItem);
    moveList.scrollTop = moveList.scrollHeight;
  }

  clearMoveHistory() {
    const moveList = document.getElementById('move-list');
    if (moveList) {
      moveList.innerHTML = '';
    }
  }

  executeCastling(move) {
    const piece = this.gameState.board[move.from.row][move.from.col];
    const isKingSide = move.to.col > move.from.col;
    const rookFromCol = isKingSide ? 7 : 0;
    const rookToCol = isKingSide ? 5 : 3;
    
    // Move king
    this.gameState.board[move.to.row][move.to.col] = piece;
    this.gameState.board[move.from.row][move.from.col] = null;
    
    // Move rook
    const rook = this.gameState.board[move.from.row][rookFromCol];
    this.gameState.board[move.from.row][rookToCol] = rook;
    this.gameState.board[move.from.row][rookFromCol] = null;
  }

  updateCastlingRights(move, piece) {
    if (piece.type === 'king') {
      if (piece.color === 'white') {
        this.gameState.castlingRights.whiteKingSide = false;
        this.gameState.castlingRights.whiteQueenSide = false;
      } else {
        this.gameState.castlingRights.blackKingSide = false;
        this.gameState.castlingRights.blackQueenSide = false;
      }
    } else if (piece.type === 'rook') {
      if (piece.color === 'white') {
        if (move.from.row === 7 && move.from.col === 0) {
          this.gameState.castlingRights.whiteQueenSide = false;
        } else if (move.from.row === 7 && move.from.col === 7) {
          this.gameState.castlingRights.whiteKingSide = false;
        }
      } else {
        if (move.from.row === 0 && move.from.col === 0) {
          this.gameState.castlingRights.blackQueenSide = false;
        } else if (move.from.row === 0 && move.from.col === 7) {
          this.gameState.castlingRights.blackKingSide = false;
        }
      }
    }
  }

  handleEnPassant(move, piece) {
    // Clear previous en passant target
    this.gameState.enPassantTarget = null;
    
    if (piece.type === 'pawn') {
      const rowDiff = Math.abs(move.to.row - move.from.row);
      
      // Check if pawn moved two squares (set en passant target)
      if (rowDiff === 2) {
        this.gameState.enPassantTarget = {
          row: (move.from.row + move.to.row) / 2,
          col: move.from.col
        };
      }
      
      // Check if this is an en passant capture
      if (Math.abs(move.to.col - move.from.col) === 1 && 
          this.gameState.board[move.to.row][move.to.col] === null) {
        // Remove the captured pawn
        const capturedPawnRow = piece.color === 'white' ? move.to.row + 1 : move.to.row - 1;
        this.gameState.board[capturedPawnRow][move.to.col] = null;
      }
    }
  }

  updateFiftyMoveRule(move, piece) {
    if (!this.gameState.competitiveRules.fiftyMoveRule) return;
    
    const isCapture = this.gameState.board[move.to.row][move.to.col] !== null;
    const isPawnMove = piece.type === 'pawn';
    
    if (isCapture || isPawnMove) {
      this.gameState.fiftyMoveRule = 0;
    } else {
      this.gameState.fiftyMoveRule++;
    }
  }

  addPositionToHistory() {
    if (!this.gameState.competitiveRules.threefoldRepetition) return;
    
    const positionKey = this.getPositionKey();
    this.gameState.positionHistory.push(positionKey);
  }

  getPositionKey() {
    // Create a string representation of the position
    let key = '';
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = this.gameState.board[row][col];
        if (piece) {
          key += piece.color[0] + piece.type[0];
        } else {
          key += '--';
        }
      }
    }
    
    // Add castling rights and en passant target
    key += this.gameState.castlingRights.whiteKingSide ? 'K' : '-';
    key += this.gameState.castlingRights.whiteQueenSide ? 'Q' : '-';
    key += this.gameState.castlingRights.blackKingSide ? 'k' : '-';
    key += this.gameState.castlingRights.blackQueenSide ? 'q' : '-';
    key += this.gameState.enPassantTarget ? 
      `${this.gameState.enPassantTarget.row}${this.gameState.enPassantTarget.col}` : '--';
    key += this.gameState.currentTurn;
    
    return key;
  }

  hasLegalMoves(color) {
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = this.gameState.board[row][col];
        if (piece && piece.color === color) {
          const validMoves = this.getValidMovesForPiece(row, col);
          if (validMoves.length > 0) {
            return true;
          }
        }
      }
    }
    return false;
  }

  getValidMovesForPiece(row, col) {
    const moves = [];
    const piece = this.gameState.board[row][col];
    
    if (!piece) return moves;
    
    for (let toRow = 0; toRow < 8; toRow++) {
      for (let toCol = 0; toCol < 8; toCol++) {
        const move = { from: { row, col }, to: { row: toRow, col: toCol } };
        if (this.isValidMoveObject(move)) {
          moves.push({ row: toRow, col: toCol });
        }
      }
    }
    
    return moves;
  }

  checkDrawConditions() {
    // Check fifty-move rule
    if (this.gameState.competitiveRules.fiftyMoveRule && this.gameState.fiftyMoveRule >= 100) {
      this.gameState.status = 'draw';
      this.gameState.winner = null;
      this.showGameEndScreen('draw', null);
      return;
    }
    
    // Check threefold repetition
    if (this.gameState.competitiveRules.threefoldRepetition) {
      const currentPosition = this.getPositionKey();
      const occurrences = this.gameState.positionHistory.filter(pos => pos === currentPosition).length;
      if (occurrences >= 3) {
        this.gameState.status = 'draw';
        this.gameState.winner = null;
        this.showGameEndScreen('draw', null);
        return;
      }
    }
    
    // Check insufficient material
    if (this.gameState.competitiveRules.insufficientMaterial && this.isInsufficientMaterial()) {
      this.gameState.status = 'draw';
      this.gameState.winner = null;
      this.showGameEndScreen('draw', null);
      return;
    }
  }

  isInsufficientMaterial() {
    const whitePieces = [];
    const blackPieces = [];
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = this.gameState.board[row][col];
        if (piece) {
          if (piece.color === 'white') {
            whitePieces.push(piece.type);
          } else {
            blackPieces.push(piece.type);
          }
        }
      }
    }
    
    // King vs King
    if (whitePieces.length === 1 && blackPieces.length === 1) {
      return true;
    }
    
    // King + Bishop vs King
    if (whitePieces.length === 2 && blackPieces.length === 1) {
      if (whitePieces.includes('king') && whitePieces.includes('bishop')) {
        return true;
      }
    }
    if (blackPieces.length === 2 && whitePieces.length === 1) {
      if (blackPieces.includes('king') && blackPieces.includes('bishop')) {
        return true;
      }
    }
    
    // King + Knight vs King
    if (whitePieces.length === 2 && blackPieces.length === 1) {
      if (whitePieces.includes('king') && whitePieces.includes('knight')) {
        return true;
      }
    }
    if (blackPieces.length === 2 && whitePieces.length === 1) {
      if (blackPieces.includes('king') && blackPieces.includes('knight')) {
        return true;
      }
    }
    
    // King + Bishop vs King + Bishop (same color squares)
    if (whitePieces.length === 2 && blackPieces.length === 2) {
      if (whitePieces.includes('king') && whitePieces.includes('bishop') &&
          blackPieces.includes('king') && blackPieces.includes('bishop')) {
        // This is a simplification - in reality we'd need to check if bishops are on same color squares
        return true;
      }
    }
    
    return false;
  }

  formatMove(move) {
    const piece = this.gameState.board[move.to.row][move.to.col];
    if (!piece) return this.formatSimpleMove(move);
    
    // Handle castling
    if (piece.type === 'king' && Math.abs(move.to.col - move.from.col) === 2) {
      return move.to.col > move.from.col ? 'O-O' : 'O-O-O';
    }
    
    const pieceSymbol = piece.type === 'pawn' ? '' : piece.type.toUpperCase()[0];
    const toSquare = String.fromCharCode(97 + move.to.col) + (8 - move.to.row);
    
    // Check for capture
    const isCapture = move.capture || (piece.type === 'pawn' && move.from.col !== move.to.col);
    const captureSymbol = isCapture ? 'x' : '';
    
    // For pawn captures, include the file
    const fromFile = piece.type === 'pawn' && isCapture ? 
      String.fromCharCode(97 + move.from.col) : '';
    
    // Check for promotion
    const promotionSymbol = move.promotion ? `=${move.promotion.toUpperCase()}` : '';
    
    // Check if move results in check/checkmate
    let checkSymbol = '';
    if (this.gameState.status === 'checkmate') {
      checkSymbol = '#';
    } else if (this.gameState.inCheck) {
      checkSymbol = '+';
    }
    
    return `${pieceSymbol}${fromFile}${captureSymbol}${toSquare}${promotionSymbol}${checkSymbol}`;
  }

  formatSimpleMove(move) {
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
        this.clearGameSession(); // Clear session for practice mode too
        this.showMainMenu();
      } else {
        if (this.socket) this.socket.emit('resign', { gameId: this.currentGameId });
        this.clearGameSession(); // Clear session after resigning
      }
    }
  }

  leaveGame() {
    if (confirm('Are you sure you want to leave the game?')) {
      if (!this.isPracticeMode) {
        this.clearGameSession(); // Clear session when leaving multiplayer
      }
      this.showMainMenu();
    }
  }

  showPromotionModal() {
    const modal = document.getElementById('promotion-modal');
    const piece = this.gameState.board[this.pendingPromotionMove.from.row][this.pendingPromotionMove.from.col];
    
    // Update the promotion pieces to show the correct color
    const promotionPieces = document.querySelectorAll('.promotion-piece');
    const pieces = piece.color === 'white' 
      ? { queen: '♕', rook: '♖', bishop: '♗', knight: '♘' }
      : { queen: '♛', rook: '♜', bishop: '♝', knight: '♞' };
    
    promotionPieces.forEach(btn => {
      const pieceType = btn.dataset.piece;
      btn.textContent = pieces[pieceType];
    });
    
    modal.classList.remove('hidden');
  }

  selectPromotion(pieceType) {
    document.getElementById('promotion-modal').classList.add('hidden');
    
    if (!this.pendingPromotionMove) return;
    
    // Execute the promotion move
    const move = this.pendingPromotionMove;
    
    // Execute the basic move
    this.executeMove(move);
    
    // Replace the pawn with the selected piece
    const promotedPiece = this.gameState.board[move.to.row][move.to.col];
    this.gameState.board[move.to.row][move.to.col] = {
      type: pieceType,
      color: promotedPiece.color
    };
    
    this.updateGameBoard();
    
    // Check if AI should make next move
    if (this.shouldAIMove() && this.gameState.status === 'active') {
      setTimeout(() => this.makeAIMove(), this.aiMoveDelay);
    }
    
    this.pendingPromotionMove = null;
  }
  
  // Check validation methods
  isValidMoveObject(move) {
    if (!move || !move.from || !move.to) return false;
    
    const piece = this.gameState.board[move.from.row][move.from.col];
    if (!piece || piece.color !== this.gameState.currentTurn) return false;
    
    // Check if trying to capture a king (not allowed)
    const targetSquare = this.gameState.board[move.to.row][move.to.col];
    if (targetSquare && targetSquare.type === 'king') return false;
    
    // Check if the move is a valid piece move
    if (!this.isValidPieceMove(move, piece)) return false;
    
    // Check if the move would leave the king in check
    if (this.wouldLeaveKingInCheck(move)) return false;
    
    return true;
  }
  
  isValidPieceMove(move, piece) {
    if (!move || !move.from || !move.to) return false;
    
    const dx = Math.abs(move.to.col - move.from.col);
    const dy = Math.abs(move.to.row - move.from.row);
    const target = this.gameState.board[move.to.row][move.to.col];
    
    // Can't capture own piece
    if (target && target.color === piece.color) return false;
    
    switch (piece.type) {
      case 'pawn':
        return this.isValidPawnMove(move, piece);
      case 'rook':
        return (dx === 0 || dy === 0) && this.isPathClear(move);
      case 'bishop':
        return dx === dy && this.isPathClear(move);
      case 'queen':
        return (dx === 0 || dy === 0 || dx === dy) && this.isPathClear(move);
      case 'knight':
        return (dx === 2 && dy === 1) || (dx === 1 && dy === 2);
      case 'king':
        return dx <= 1 && dy <= 1;
      default:
        return false;
    }
  }
  
  isValidPawnMove(move, piece) {
    if (!move || !move.from || !move.to) return false;
    
    const direction = piece.color === 'white' ? -1 : 1;
    const startRow = piece.color === 'white' ? 6 : 1;
    const dy = move.to.row - move.from.row;
    const dx = Math.abs(move.to.col - move.from.col);
    const target = this.gameState.board[move.to.row][move.to.col];
    
    // Forward move
    if (dx === 0) {
      if (target) return false; // Blocked
      if (dy === direction) return true; // One square forward
      if (dy === 2 * direction && move.from.row === startRow) return true; // Two squares from start
      return false;
    }
    
    // Diagonal capture
    if (dx === 1 && dy === direction) {
      return target && target.color !== piece.color;
    }
    
    return false;
  }
  
  isPathClear(move) {
    const dx = Math.sign(move.to.col - move.from.col);
    const dy = Math.sign(move.to.row - move.from.row);
    let row = move.from.row + dy;
    let col = move.from.col + dx;
    
    while (row !== move.to.row || col !== move.to.col) {
      if (this.gameState.board[row][col]) return false;
      row += dy;
      col += dx;
    }
    
    return true;
  }
  
  wouldLeaveKingInCheck(move) {
    // Make a temporary move to test
    const originalPiece = this.gameState.board[move.to.row][move.to.col];
    const movingPiece = this.gameState.board[move.from.row][move.from.col];
    
    this.gameState.board[move.to.row][move.to.col] = movingPiece;
    this.gameState.board[move.from.row][move.from.col] = null;
    
    const inCheck = this.isKingInCheck(movingPiece.color);
    
    // Restore the board
    this.gameState.board[move.from.row][move.from.col] = movingPiece;
    this.gameState.board[move.to.row][move.to.col] = originalPiece;
    
    return inCheck;
  }
  
  isKingInCheck(color) {
    const kingPos = this.findKing(color);
    if (!kingPos) return false;
    
    const opponentColor = color === 'white' ? 'black' : 'white';
    
    // Check if any opponent piece can attack the king
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = this.gameState.board[row][col];
        if (piece && piece.color === opponentColor) {
          const move = { from: { row, col }, to: kingPos };
          if (this.isValidPieceMove(move, piece)) {
            return true;
          }
        }
      }
    }
    
    return false;
  }
  
  findKing(color) {
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = this.gameState.board[row][col];
        if (piece && piece.type === 'king' && piece.color === color) {
          return { row, col };
        }
      }
    }
    return null;
  }
  
  updateCheckStatus() {
    const whiteInCheck = this.isKingInCheck('white');
    const blackInCheck = this.isKingInCheck('black');
    
    this.gameState.inCheck = whiteInCheck || blackInCheck;
    
    // Check for checkmate and stalemate
    const currentPlayerInCheck = this.gameState.currentTurn === 'white' ? whiteInCheck : blackInCheck;
    const hasLegalMoves = this.hasLegalMoves(this.gameState.currentTurn);
    
    if (!hasLegalMoves) {
      if (currentPlayerInCheck) {
        // Checkmate
        this.gameState.status = 'checkmate';
        this.gameState.winner = this.gameState.currentTurn === 'white' ? 'black' : 'white';
        this.showGameEndScreen('checkmate', this.gameState.winner);
      } else {
        // Stalemate
        this.gameState.status = 'stalemate';
        this.gameState.winner = null;
        this.showGameEndScreen('stalemate', null);
      }
      return;
    }
    
    // Check for draw conditions
    this.checkDrawConditions();
    
    // Update UI check indicator
    const checkIndicator = document.getElementById('check-indicator');
    if (this.gameState.inCheck) {
      checkIndicator.classList.remove('hidden');
      checkIndicator.textContent = `${this.gameState.currentTurn === 'white' ? 'WHITE' : 'BLACK'} IN CHECK!`;
    } else {
      checkIndicator.classList.add('hidden');
    }
  }
  
  showInvalidMoveMessage() {
    // Show temporary message for invalid moves
    const message = document.createElement('div');
    message.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #ff4444;
      color: white;
      padding: 10px 20px;
      border-radius: 5px;
      z-index: 10000;
      font-weight: bold;
    `;
    message.textContent = this.gameState.inCheck ? 'Must move out of check!' : 'Invalid move!';
    document.body.appendChild(message);
    
    setTimeout(() => {
      document.body.removeChild(message);
    }, 2000);
  }
  
  sendChatMessage() {
    const chatInput = document.getElementById('chat-input');
    const message = chatInput.value.trim();
    
    if (message && !this.isPracticeMode && this.currentGameId) {
      if (this.socket) this.socket.emit('chat-message', {
        gameId: this.currentGameId,
        message: message
      });
      
      // Add message immediately to own chat
      this.addChatMessage(message, 'You', true);
      
      // Clear input
      chatInput.value = '';
    }
  }
  
  addChatMessage(message, sender, isOwn = false) {
    const chatMessages = document.getElementById('chat-messages');
    const messageElement = document.createElement('div');
    messageElement.className = `chat-message ${isOwn ? 'own-message' : 'other-message'}`;
    
    const senderElement = document.createElement('span');
    senderElement.className = 'chat-sender';
    senderElement.textContent = sender + ': ';
    
    const textElement = document.createElement('span');
    textElement.className = 'chat-text';
    textElement.textContent = message;
    
    messageElement.appendChild(senderElement);
    messageElement.appendChild(textElement);
    chatMessages.appendChild(messageElement);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Limit to 50 messages
    while (chatMessages.children.length > 50) {
      chatMessages.removeChild(chatMessages.firstChild);
    }
  }
  
  clearChat() {
    const chatMessages = document.getElementById('chat-messages');
    chatMessages.innerHTML = '';
  }
  
  // Mobile chat functions
  toggleMobileChat() {
    const overlay = document.getElementById('mobile-chat-overlay');
    overlay.classList.toggle('show');
    
    // Sync messages when opening
    if (overlay.classList.contains('show')) {
      this.syncMobileChatMessages();
    }
  }
  
  closeMobileChat() {
    const overlay = document.getElementById('mobile-chat-overlay');
    overlay.classList.remove('show');
  }
  
  sendMobileChatMessage() {
    const input = document.getElementById('mobile-chat-input');
    const message = input.value.trim();
    
    if (message && !this.isPracticeMode && this.currentGameId) {
      if (this.socket) this.socket.emit('chat-message', {
        gameId: this.currentGameId,
        message: message
      });
      
      // Add message to mobile chat
      this.addMobileChatMessage(message, 'You', true);
      input.value = '';
    }
  }
  
  addMobileChatMessage(message, sender, isOwn = false) {
    const chatMessages = document.getElementById('mobile-chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${isOwn ? 'own-message' : 'other-message'}`;
    
    messageDiv.innerHTML = `
      <div class="chat-sender">${sender}</div>
      <div class="chat-text">${this.escapeHtml(message)}</div>
    `;
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Limit to 50 messages
    while (chatMessages.children.length > 50) {
      chatMessages.removeChild(chatMessages.firstChild);
    }
  }
  
  syncMobileChatMessages() {
    const desktopMessages = document.getElementById('chat-messages');
    const mobileMessages = document.getElementById('mobile-chat-messages');
    
    // Clear mobile messages
    mobileMessages.innerHTML = '';
    
    // Copy messages from desktop chat
    Array.from(desktopMessages.children).forEach(message => {
      const clone = message.cloneNode(true);
      mobileMessages.appendChild(clone);
    });
    
    // Scroll to bottom
    mobileMessages.scrollTop = mobileMessages.scrollHeight;
  }
  
  // Fullscreen functionality
  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.log('Error attempting to enable fullscreen:', err);
      });
    } else {
      document.exitFullscreen();
    }
  }
  
  updateMobileChatVisibility() {
    const toggleBtn = document.getElementById('mobile-chat-toggle');
    
    // Show mobile chat toggle for multiplayer games only
    if (!this.isPracticeMode && this.currentGameId) {
      toggleBtn.classList.remove('hidden');
    } else {
      toggleBtn.classList.add('hidden');
      this.closeMobileChat();
    }
  }

  debugDumpGameState() {
    if (!this.gameState) {
      console.log('No game state available');
      alert('No game state available');
      return;
    }

    const pieceSymbols = {
      'king': { 'white': '♔', 'black': '♚' },
      'queen': { 'white': '♕', 'black': '♛' },
      'rook': { 'white': '♖', 'black': '♜' },
      'bishop': { 'white': '♗', 'black': '♝' },
      'knight': { 'white': '♘', 'black': '♞' },
      'pawn': { 'white': '♙', 'black': '♟' }
    };

    let markdown = '## Current Game State\n\n';
    markdown += `**Turn:** ${this.gameState.currentTurn}\n`;
    markdown += `**Status:** ${this.gameState.status}\n`;
    markdown += `**Player Color:** ${this.playerColor}\n`;
    markdown += `**Practice Mode:** ${this.isPracticeMode ? this.practiceMode : 'false'}\n`;
    markdown += `**Selected Square:** ${this.selectedSquare ? `${String.fromCharCode(97 + this.selectedSquare.col)}${8 - this.selectedSquare.row}` : 'none'}\n`;
    markdown += `**Valid Moves:** ${this.validMoves.length}\n`;
    markdown += `**In Check:** ${this.gameState.inCheck}\n\n`;

    markdown += '| | a | b | c | d | e | f | g | h |\n';
    markdown += '|---|---|---|---|---|---|---|---|---|\n';

    for (let row = 0; row < 8; row++) {
      let rowStr = `| **${8 - row}** |`;
      for (let col = 0; col < 8; col++) {
        const piece = this.gameState.board[row][col];
        if (piece) {
          const symbol = pieceSymbols[piece.type]?.[piece.color] || '?';
          rowStr += ` ${symbol} |`;
        } else {
          rowStr += '   |';
        }
      }
      markdown += rowStr + '\n';
    }

    markdown += '\n**Move History:** ' + this.gameState.moveHistory.length + ' moves\n';
    if (this.gameState.moveHistory.length > 0) {
      const lastMove = this.gameState.moveHistory[this.gameState.moveHistory.length - 1];
      markdown += `**Last Move:** ${this.formatMove(lastMove)}\n`;
    }

    console.log(markdown);
    
    // Copy to clipboard
    navigator.clipboard.writeText(markdown).then(() => {
      alert('Game state copied to clipboard!\n\nAlso check the browser console for the full output.');
    }).catch(() => {
      // Fallback: show in alert (truncated)
      const shortMarkdown = markdown.substring(0, 500) + (markdown.length > 500 ? '...\n\n[Full output in console]' : '');
      alert('Game state (check console for full version):\n\n' + shortMarkdown);
    });
  }
}

// Simple ChessAI implementation for client-side use
class ChessAI {
  constructor(difficulty = 'medium') {
    this.difficulty = difficulty;
    this.maxDepth = this.getMaxDepth(difficulty);
    this.pieceValues = {
      pawn: 100,
      knight: 300,
      bishop: 300,
      rook: 500,
      queen: 900,
      king: 10000
    };
  }
  
  getMaxDepth(difficulty) {
    switch (difficulty) {
      case 'easy': return 1;
      case 'medium': return 2;
      case 'hard': return 3;
      default: return 2;
    }
  }
  
  getBestMove(gameState) {
    const moves = this.getAllValidMoves(gameState);
    console.log('AI found', moves.length, 'valid moves for', gameState.currentTurn);
    if (moves.length === 0) return null;
    
    // Easy mode: random moves occasionally
    if (this.difficulty === 'easy' && Math.random() < 0.4) {
      return moves[Math.floor(Math.random() * moves.length)];
    }
    
    let bestMove = null;
    let bestScore = gameState.currentTurn === 'white' ? -Infinity : Infinity;
    
    for (const move of moves) {
      const score = this.evaluateMove(gameState, move);
      
      if (gameState.currentTurn === 'white' && score > bestScore) {
        bestScore = score;
        bestMove = move;
      } else if (gameState.currentTurn === 'black' && score < bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }
    
    return bestMove;
  }
  
  getAllValidMoves(gameState) {
    const moves = [];
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = gameState.board[row][col];
        if (piece && piece.color === gameState.currentTurn) {
          const pieceMoves = this.getValidMovesForPiece(gameState, row, col);
          moves.push(...pieceMoves);
        }
      }
    }
    
    return moves;
  }
  
  getValidMovesForPiece(gameState, row, col) {
    const moves = [];
    
    for (let toRow = 0; toRow < 8; toRow++) {
      for (let toCol = 0; toCol < 8; toCol++) {
        const move = {
          from: { row, col },
          to: { row: toRow, col: toCol }
        };
        
        if (this.isValidMove(gameState, move)) {
          moves.push(move);
        }
      }
    }
    
    return moves;
  }
  
  isValidMove(gameState, move) {
    if (!move || !move.from || !move.to) return false;
    
    const piece = gameState.board[move.from.row][move.from.col];
    if (!piece) return false;
    
    // Basic validation - piece can move to target square
    const target = gameState.board[move.to.row][move.to.col];
    if (target && target.color === piece.color) return false;
    
    // Use simplified move validation
    return this.isValidMoveForPiece(piece, move.from.row, move.from.col, move.to.row, move.to.col, gameState);
  }
  
  isValidMoveForPiece(piece, fromRow, fromCol, toRow, toCol, gameState) {
    const rowDiff = Math.abs(toRow - fromRow);
    const colDiff = Math.abs(toCol - fromCol);
    
    switch (piece.type) {
      case 'pawn':
        const direction = piece.color === 'white' ? -1 : 1;
        const startRow = piece.color === 'white' ? 6 : 1;
        const rowMove = toRow - fromRow;
        
        if (colDiff === 0) {
          return (rowMove === direction && !gameState.board[toRow][toCol]) ||
                 (fromRow === startRow && rowMove === 2 * direction && !gameState.board[toRow][toCol]);
        } else if (colDiff === 1 && rowMove === direction) {
          return gameState.board[toRow][toCol] !== null;
        }
        return false;
        
      case 'rook':
        return (fromRow === toRow || fromCol === toCol) && this.isPathClear(gameState, fromRow, fromCol, toRow, toCol);
        
      case 'knight':
        return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
        
      case 'bishop':
        return rowDiff === colDiff && this.isPathClear(gameState, fromRow, fromCol, toRow, toCol);
        
      case 'queen':
        return ((fromRow === toRow || fromCol === toCol) || (rowDiff === colDiff)) &&
               this.isPathClear(gameState, fromRow, fromCol, toRow, toCol);
        
      case 'king':
        return rowDiff <= 1 && colDiff <= 1;
        
      default:
        return false;
    }
  }
  
  isPathClear(gameState, fromRow, fromCol, toRow, toCol) {
    const rowStep = toRow === fromRow ? 0 : (toRow - fromRow) / Math.abs(toRow - fromRow);
    const colStep = toCol === fromCol ? 0 : (toCol - fromCol) / Math.abs(toCol - fromCol);
    
    let row = fromRow + rowStep;
    let col = fromCol + colStep;
    
    while (row !== toRow || col !== toCol) {
      if (gameState.board[row][col]) return false;
      row += rowStep;
      col += colStep;
    }
    
    return true;
  }
  
  evaluateMove(gameState, move) {
    let score = 0;
    
    // Capture value
    const target = gameState.board[move.to.row][move.to.col];
    if (target) {
      score += this.pieceValues[target.type];
    }
    
    // Center control
    const centerDistance = Math.abs(move.to.row - 3.5) + Math.abs(move.to.col - 3.5);
    score += (7 - centerDistance) * 5;
    
    // Random factor for variety
    score += Math.random() * 10;
    
    return score;
  }
  
  // Check validation methods for AI
  isKingInCheck(gameState, color) {
    const kingPos = this.findKing(gameState, color);
    if (!kingPos) return false;
    
    const opponentColor = color === 'white' ? 'black' : 'white';
    
    // Check if any opponent piece can attack the king
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = gameState.board[row][col];
        if (piece && piece.color === opponentColor) {
          const move = { from: { row, col }, to: kingPos };
          if (this.isValidPieceMove(gameState, move, piece)) {
            return true;
          }
        }
      }
    }
    
    return false;
  }
  
  findKing(gameState, color) {
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = gameState.board[row][col];
        if (piece && piece.type === 'king' && piece.color === color) {
          return { row, col };
        }
      }
    }
    return null;
  }
  
  wouldLeaveKingInCheck(gameState, move, color) {
    // Make a temporary move to test
    const originalPiece = gameState.board[move.to.row][move.to.col];
    const movingPiece = gameState.board[move.from.row][move.from.col];
    
    gameState.board[move.to.row][move.to.col] = movingPiece;
    gameState.board[move.from.row][move.from.col] = null;
    
    const inCheck = this.isKingInCheck(gameState, color);
    
    // Restore the board
    gameState.board[move.from.row][move.from.col] = movingPiece;
    gameState.board[move.to.row][move.to.col] = originalPiece;
    
    return inCheck;
  }
  
  isValidPieceMove(gameState, move, piece) {
    const dx = Math.abs(move.to.col - move.from.col);
    const dy = Math.abs(move.to.row - move.from.row);
    const target = gameState.board[move.to.row][move.to.col];
    
    // Can't capture own piece
    if (target && target.color === piece.color) return false;
    
    switch (piece.type) {
      case 'pawn':
        return this.isValidPawnMove(gameState, move, piece);
      case 'rook':
        return (dx === 0 || dy === 0) && this.isPathClear(gameState, move);
      case 'bishop':
        return dx === dy && this.isPathClear(gameState, move);
      case 'queen':
        return (dx === 0 || dy === 0 || dx === dy) && this.isPathClear(gameState, move);
      case 'knight':
        return (dx === 2 && dy === 1) || (dx === 1 && dy === 2);
      case 'king':
        return dx <= 1 && dy <= 1;
      default:
        return false;
    }
  }
  
  isValidPawnMove(gameState, move, piece) {
    const direction = piece.color === 'white' ? -1 : 1;
    const startRow = piece.color === 'white' ? 6 : 1;
    const dy = move.to.row - move.from.row;
    const dx = Math.abs(move.to.col - move.from.col);
    const target = gameState.board[move.to.row][move.to.col];
    
    // Forward move
    if (dx === 0) {
      if (target) return false; // Blocked
      if (dy === direction) return true; // One square forward
      if (dy === 2 * direction && move.from.row === startRow) return true; // Two squares from start
      return false;
    }
    
    // Diagonal capture
    if (dx === 1 && dy === direction) {
      return target && target.color !== piece.color;
    }
    
    return false;
  }
  
  isPathClear(gameState, move) {
    if (!move || !move.from || !move.to) return false;
    
    const dx = Math.sign(move.to.col - move.from.col);
    const dy = Math.sign(move.to.row - move.from.row);
    let row = move.from.row + dy;
    let col = move.from.col + dx;
    
    while (row !== move.to.row || col !== move.to.col) {
      if (gameState.board[row][col]) return false;
      row += dy;
      col += dx;
    }
    
    return true;
  }
  
  getAllValidMovesForColor(color) {
    const validMoves = [];
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = this.gameState.board[row][col];
        if (piece && piece.color === color) {
          const pieceMoves = this.getValidMoves(row, col);
          pieceMoves.forEach(move => {
            validMoves.push({
              from: { row, col },
              to: { row: move.row, col: move.col }
            });
          });
        }
      }
    }
    
    return validMoves;
  }
}

// WebChessClient initialization is now handled in index.html to ensure proper timing