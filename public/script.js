// vim: sw=4 ts=4 et fenc=utf-8 ft=javascript
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
      const token = localStorage.getItem('webchess_session_token');
      this.socket = io({
        auth: {
          token
        }
      });
      this.socket.on('session-token', data => {
        localStorage.setItem('webchess_session_token', data.token);
        console.log('Session token persisted:', data.token);
      });
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
    document.getElementById('game-id-input').addEventListener('keypress', e => {
      if (e.key === 'Enter') this.joinGame();
    });

    // Practice screen
    // Practice screen
    document.getElementById('start-practice-btn').addEventListener('click', () => this.startPracticeGame());
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
    document.getElementById('chat-input').addEventListener('keypress', e => {
      if (e.key === 'Enter') this.sendChatMessage();
    });

    // Mobile chat controls
    document.getElementById('mobile-chat-toggle').addEventListener('click', () => this.toggleMobileChat());
    document.getElementById('mobile-chat-close').addEventListener('click', () => this.closeMobileChat());
    document.getElementById('mobile-send-chat-btn').addEventListener('click', () => this.sendMobileChatMessage());
    document.getElementById('mobile-chat-input').addEventListener('keypress', e => {
      if (e.key === 'Enter') this.sendMobileChatMessage();
    });

    // Fullscreen control
    document.getElementById('fullscreen-btn').addEventListener('click', () => this.toggleFullscreen());

    // Game end screen
    document.getElementById('new-game-btn').addEventListener('click', () => this.showMainMenu());
    document.getElementById('back-to-menu-btn').addEventListener('click', () => this.showMainMenu());

    // Promotion modal
    document.querySelectorAll('.promotion-piece').forEach(piece => {
      piece.addEventListener('click', e => this.selectPromotion(e.target.dataset.piece));
    });
  }
  setupSocketListeners() {
    if (!this.socket) return;
    this.socket.on('game-created', data => {
      this.currentGameId = data.gameId;
      this.playerColor = 'white';
      this.saveSessionToStorage();
      this.showHostScreen(data.gameId);
    });
    this.socket.on('game-joined', data => {
      this.currentGameId = data.gameId;
      this.playerColor = data.color;
      this.saveSessionToStorage();
    });
    this.socket.on('opponent-joined', data => {
      this.showGameScreen();

      // Request chat history when opponent joins
      if (!this.isPracticeMode && this.socket) {
        if (this.socket) this.socket.emit('get-chat-history', {
          gameId: this.currentGameId
        });
      }
    });
    this.socket.on('game-start', data => {
      this.gameState = data.gameState;
      this.showGameScreen();
      this.updateGameBoard();

      // Request chat history for the game
      if (!this.isPracticeMode) {
        if (this.socket) this.socket.emit('get-chat-history', {
          gameId: this.currentGameId
        });
      }
    });
    this.socket.on('move-made', data => {
      this.gameState = data.gameState;
      this.updateGameBoard();
      this.updateGameStatus();
      this.addMoveToHistory(data.move);
    });
    this.socket.on('game-end', data => {
      this.showGameEndScreen(data.status, data.winner);
      // Clear session since game has ended
      this.clearGameSession();
    });
    this.socket.on('join-error', data => {
      this.showJoinError(data.message);
    });
    this.socket.on('move-error', data => {
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
    this.socket.on('chat-message', data => {
      this.addChatMessage(data.message, data.sender, data.isOwn);
      // Also add to mobile chat
      this.addMobileChatMessage(data.message, data.sender, data.isOwn);
    });
    this.socket.on('chat-history', data => {
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
    this.socket.on('session-validation', data => {
      if (!data.valid) {
        // Session is invalid, clear it
        this.clearGameSession();
      } else {
        // Session is valid, show resume button
        this.updateResumeButton();
      }
    });
  }
  startPracticeMode() {
    this.showScreen('practice-screen');
  }

  // ... (startPracticeGame and makeAIMove remain mostly the same, ensuring they set this.players) ...

  saveSessionToStorage() {
    const session = {
      gameId: this.currentGameId,
      color: this.playerColor,
      isPracticeMode: this.isPracticeMode
    };

    // Save additional practice mode data
    if (this.isPracticeMode && this.gameState) {
      session.practiceData = {
        // mode: this.practiceMode, // Deprecated, use players config
        players: this.players,
        gameState: {
          board: this.chess.board,
          currentTurn: this.chess.currentTurn,
          gameStatus: this.chess.gameStatus,
          castlingRights: this.chess.castlingRights,
          enPassantTarget: this.chess.enPassantTarget,
          moveHistory: this.chess.moveHistory,
          // Important for some rules
          halfMoveClock: this.chess.halfMoveClock,
          fullMoveNumber: this.chess.fullMoveNumber
        }
      };
    }
    localStorage.setItem('webchess-session', JSON.stringify(session));
  }
  loadSessionFromStorage() {
    const session = localStorage.getItem('webchess-session');
    if (session) {
      const data = JSON.parse(session);
      this.currentGameId = data.gameId;
      this.playerColor = data.color;
      this.isPracticeMode = data.isPracticeMode || false;
      if (this.isPracticeMode && data.practiceData) {
        this.players = data.practiceData.players;
        this.savedGameState = data.practiceData.gameState; // Store temporarily until resume
      }
      if (this.currentGameId && !this.isPracticeMode) {
        this.validateSession();
      }
    }
  }
  resumePracticeGame() {
    if (!this.savedGameState || !this.players) return;

    // Reconstruct ChessGame instance
    this.chess = new ChessGame();
    Object.assign(this.chess, this.savedGameState);
    // Deep copy/correct reference reconstruction might be needed if ChessGame methods rely on specific prototypes or internal linking
    // For now, assuming direct property assignment works for the logic we have.
    // However, board contains objects that might be just data now. `ChessGame` logic usually handles data objects fine.

    this.gameState = {
      board: this.chess.board,
      currentTurn: this.chess.currentTurn,
      status: this.chess.gameStatus
    };

    // Initialize AI
    if (this.players.white.type === 'ai') this.whiteAI = new ChessAI(this.players.white.difficulty);
    if (this.players.black.type === 'ai') this.blackAI = new ChessAI(this.players.black.difficulty);
    this.showScreen('game-screen');
    this.updateGameInfo();
    this.updateGameBoard();

    // Continue AI if needed
    if (this.chess.gameStatus === 'active' && this.players[this.chess.currentTurn].type === 'ai') {
      setTimeout(() => this.makeAIMove(), 500);
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
    const hasValidSession = this.currentGameId && (this.currentGameId !== 'practice' || this.isPracticeMode);
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
      if (this.socket) this.socket.emit('resign', {
        gameId: this.currentGameId
      });
      this.clearGameSession();
    }
  }
  clearGameSession() {
    this.currentGameId = null;
    this.playerColor = null;
    this.gameState = null;
    this.isPracticeMode = false;
    if (this.whiteAIWorker) {
      this.whiteAIWorker.terminate();
      this.whiteAIWorker = null;
    }
    if (this.blackAIWorker) {
      this.blackAIWorker.terminate();
      this.blackAIWorker = null;
    }
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
      if (this.socket) this.socket.emit('join-game', {
        gameId
      });
    } else {
      this.showJoinError('Please enter a 6-character game ID');
    }
  }
  startPracticeGame() {
    const whiteType = document.getElementById('whitePlayerType').value;
    const blackType = document.getElementById('blackPlayerType').value;

    // Parse types: 'human' or 'ai-difficulty'
    const getPlayerConfig = typeValue => {
      if (typeValue === 'human') return {
        type: 'human'
      };
      return {
        type: 'ai',
        difficulty: typeValue.split('-')[1]
      };
    };
    this.players = {
      white: getPlayerConfig(whiteType),
      black: getPlayerConfig(blackType)
    };
    this.isPracticeMode = true;
    this.gameId = 'practice';
    this.playerColor = 'white'; // Viewpoint defaults to white, but can be irrelevant in AIvAI

    // If Human vs AI (classic), set playerColor to the human side
    if (this.players.white.type === 'human' && this.players.black.type === 'ai') {
      this.playerColor = 'white';
    } else if (this.players.white.type === 'ai' && this.players.black.type === 'human') {
      this.playerColor = 'black';
    } else {
      this.playerColor = 'white'; // Default view
    }

    // Initialize AI instances if needed
    // Note: In a real app we might want separate AI instances or just one configurable one
    // minimal-chess-ai is stateless mostly, but ChessAI class has state (transposition table)
    // Let's create two instances if needed to keep their memories separate (better for testing)
    // or just one and reconfigure. Separate is safer.
    if (this.players.white.type === 'ai') {
      this.whiteAIWorker = new Worker('aiWorker.js');
      this.whiteAIWorker.postMessage({
        type: 'INIT',
        data: {
          difficulty: this.players.white.difficulty
        }
      });
      this.whiteAIWorker.onmessage = this.handleAIWorkerMessage.bind(this);
    }
    if (this.players.black.type === 'ai') {
      this.blackAIWorker = new Worker('aiWorker.js');
      this.blackAIWorker.postMessage({
        type: 'INIT',
        data: {
          difficulty: this.players.black.difficulty
        }
      });
      this.blackAIWorker.onmessage = this.handleAIWorkerMessage.bind(this);
    }
    this.chess = new ChessGame();
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('gameScreen').style.display = 'block';
    document.getElementById('currentGameId').textContent = 'Practice Mode';
    this.gameState = {
      board: this.chess.board,
      currentTurn: this.chess.currentTurn,
      status: this.chess.gameStatus
    };
    this.updateGameBoard();
    this.updateGameStatus();

    // Trigger first move if White is AI
    if (this.players.white.type === 'ai') {
      setTimeout(() => this.makeAIMove(), 500);
    }
  }
  handleAIWorkerMessage(e) {
    const {
      type,
      data,
      error
    } = e.data;
    if (type === 'ERROR') {
      console.error("AI Worker Error:", error);
      return;
    }
    if (type === 'MOVE_CALCULATED') {
      const move = data.move;
      if (move) {
        this.makeMove(move.from, move.to, move.promotion);

        // If next player is also AI, trigger next move
        if (this.chess.gameStatus === 'active' && this.players[this.chess.currentTurn].type === 'ai') {
          setTimeout(() => this.makeAIMove(), 500);
        }
      }
    }
  }
  makeAIMove() {
    if (!this.isPracticeMode || this.chess.gameStatus !== 'active') return;
    const turn = this.chess.currentTurn;
    if (this.players[turn].type !== 'ai') return;
    const worker = turn === 'white' ? this.whiteAIWorker : this.blackAIWorker;

    // Get FEN position to send to worker
    const fen = this.chess.stateManager.getFENPosition(this.chess.board, this.chess.currentTurn, this.chess.castlingRights, this.chess.enPassantTarget);
    worker.postMessage({
      type: 'CALCULATE_MOVE',
      data: {
        fen: fen
      }
    });
  }
  makeMove(from, to, promotion = null) {
    if (this.isPracticeMode) {
      const moveResult = this.chess.makeMove({
        from,
        to,
        promotion
      });
      if (moveResult.success) {
        this.gameState = {
          board: this.chess.board,
          currentTurn: this.chess.currentTurn,
          status: this.chess.gameStatus
        };
        this.updateGameBoard();
        this.updateGameStatus();
        if (this.chess.gameStatus !== 'active' && this.chess.gameStatus !== 'check') {
          this.showGameEndScreen(this.chess.gameStatus, this.chess.winner);
        }

        // If against AI (and I just moved as human), trigger AI response
        if (this.chess.gameStatus === 'active' && this.players[this.chess.currentTurn].type === 'ai') {
          this.makeAIMove();
        }
      }
      return;
    }

    // Multiplayer logic... (unchanged)
    this.socket.emit('make-move', {
      gameId: this.gameId,
      from,
      to,
      promotion
    });
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
      enPassantTarget: null,
      // { row, col } of the square where en passant can be captured
      fiftyMoveRule: 0,
      // Counter for 50-move rule
      positionHistory: [],
      // For threefold repetition
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
      board[1][i] = {
        type: 'pawn',
        color: 'black'
      };
      board[6][i] = {
        type: 'pawn',
        color: 'white'
      };
    }

    // Rooks
    board[0][0] = {
      type: 'rook',
      color: 'black'
    };
    board[0][7] = {
      type: 'rook',
      color: 'black'
    };
    board[7][0] = {
      type: 'rook',
      color: 'white'
    };
    board[7][7] = {
      type: 'rook',
      color: 'white'
    };

    // Knights
    board[0][1] = {
      type: 'knight',
      color: 'black'
    };
    board[0][6] = {
      type: 'knight',
      color: 'black'
    };
    board[7][1] = {
      type: 'knight',
      color: 'white'
    };
    board[7][6] = {
      type: 'knight',
      color: 'white'
    };

    // Bishops
    board[0][2] = {
      type: 'bishop',
      color: 'black'
    };
    board[0][5] = {
      type: 'bishop',
      color: 'black'
    };
    board[7][2] = {
      type: 'bishop',
      color: 'white'
    };
    board[7][5] = {
      type: 'bishop',
      color: 'white'
    };

    // Queens
    board[0][3] = {
      type: 'queen',
      color: 'black'
    };
    board[7][3] = {
      type: 'queen',
      color: 'white'
    };

    // Kings
    board[0][4] = {
      type: 'king',
      color: 'black'
    };
    board[7][4] = {
      type: 'king',
      color: 'white'
    };
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
    document.getElementById('game-end-screen').classList.add('hidden');
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
    document.getElementById('game-end-screen').classList.remove('hidden');
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
      case 'self':
        return 'Play Both Sides';
      case 'ai-white':
        return 'You vs AI (You: White)';
      case 'ai-black':
        return 'You vs AI (You: Black)';
      case 'ai-vs-ai':
        return 'AI vs AI';
      default:
        return 'Unknown';
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
        square.addEventListener('click', e => this.handleSquareClick(e));
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
        king: '♔',
        queen: '♕',
        rook: '♖',
        bishop: '♗',
        knight: '♘',
        pawn: '♙'
      },
      black: {
        king: '♚',
        queen: '♛',
        rook: '♜',
        bishop: '♝',
        knight: '♞',
        pawn: '♟'
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
        this.makeMove(this.selectedSquare, {
          row,
          col
        });
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
      } else {
        // Multiplayer mode: can select if it's the player's piece color
        canSelect = piece.color === this.playerColor;
      }
      if (canSelect) {
        this.selectSquare(row, col);
      }
    }
  }
  canPlayerMove() {
    // Multiplayer mode
    if (!this.isPracticeMode) {
      return this.gameState.currentTurn === this.playerColor;
    }

    // Practice mode logic using player config
    if (this.playerColor === 'spectator') return false;
    if (this.playerColor === 'both') return true;

    // Human vs AI (or specific side)
    return this.gameState.currentTurn === this.playerColor;
  }
  canPlayerMovePiece(piece) {
    // Multiplayer mode
    if (!this.isPracticeMode) {
      return piece.color === this.playerColor;
    }

    // Practice mode logic
    if (this.playerColor === 'spectator') return false;
    if (this.playerColor === 'both') return true; // Can move any piece if it's their turn (canPlayerMove checks turn)

    return piece.color === this.playerColor;
  }
  selectSquare(row, col) {
    console.log(`Selecting square ${row},${col}`);
    this.clearSelection();
    this.selectedSquare = {
      row,
      col
    };
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
    if (!this.chess) return [];
    const piece = this.gameState.board[row][col];
    if (!piece || piece.color !== this.gameState.currentTurn) return [];
    const allLegalMoves = this.chess.getAllLegalMoves(piece.color);
    return allLegalMoves.filter(move => move.from.row === row && move.from.col === col).map(move => ({
      row: move.to.row,
      col: move.to.col
    }));
  }
  makePracticeMove(move) {
    // Validate the move before executing
    if (!this.isValidMoveObject(move)) {
      this.showInvalidMoveMessage();
      return;
    }

    // Check for pawn promotion before making the move
    const piece = this.gameState.board[move.from.row][move.from.col];
    const isPromotion = piece && piece.type === 'pawn' && (piece.color === 'white' && move.to.row === 0 || piece.color === 'black' && move.to.row === 7);
    if (isPromotion) {
      // Store the pending promotion move and show modal
      this.pendingPromotionMove = move;
      this.showPromotionModal();
      return;
    }

    // Execute the move
    this.executeMove(move);
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
      // Check for AI pawn promotion before validation
      const piece = this.gameState.board[aiMove.from.row][aiMove.from.col];
      const isPromotion = piece && piece.type === 'pawn' && (piece.color === 'white' && aiMove.to.row === 0 || piece.color === 'black' && aiMove.to.row === 7);
      if (isPromotion) {
        // AI always promotes to queen (best choice)
        aiMove.promotion = 'queen';
      }

      // Validate the AI move using the same checks as player moves
      if (!this.isValidMoveObject(aiMove)) {
        console.error('AI generated invalid move:', aiMove);
        console.log('AI move details:', {
          from: aiMove.from,
          to: aiMove.to,
          piece: this.gameState.board[aiMove.from.row][aiMove.from.col],
          target: this.gameState.board[aiMove.to.row][aiMove.to.col],
          currentTurn: this.gameState.currentTurn,
          inCheck: this.gameState.inCheck
        });
        console.log('AI move validation failed, skipping move');
        return;
      }

      // Execute the move (with promotion if needed)
      if (isPromotion) {
        this.executeAIPawnPromotion(aiMove);
      } else {
        this.executeMove(aiMove);
      }
    } else {
      // AI found no valid moves - check if game should end
      console.log('AI found no valid moves, checking if game should end');
      const hasLegalMoves = this.hasLegalMoves(this.gameState.currentTurn);
      console.log('Main game hasLegalMoves check:', hasLegalMoves);
      if (!hasLegalMoves) {
        console.log('Triggering updateCheckStatus to handle checkmate/stalemate');
        this.updateCheckStatus();
      } else {
        console.warn('AI found no moves but main game thinks there are legal moves - validation mismatch!');
      }
    }
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
        if (this.socket) this.socket.emit('resign', {
          gameId: this.currentGameId
        });
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
    const pieces = piece.color === 'white' ? {
      queen: '♕',
      rook: '♖',
      bishop: '♗',
      knight: '♘'
    } : {
      queen: '♛',
      rook: '♜',
      bishop: '♝',
      knight: '♞'
    };
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
  showCheckNotification(color) {
    // Show simple pop-up notification for check
    try {
      const message = document.createElement('div');
      message.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #ff9800;
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        z-index: 10000;
        font-weight: bold;
        font-size: 1.2rem;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        border: 2px solid #f57c00;
      `;
      message.textContent = `${color.toUpperCase()} IN CHECK!`;
      document.body.appendChild(message);
      setTimeout(() => {
        try {
          if (document.body.contains(message)) {
            document.body.removeChild(message);
          }
        } catch (error) {
          // Silently handle removal errors
          console.warn('Error removing check notification:', error);
        }
      }, 3000);
    } catch (error) {
      // Silently handle DOM errors
      console.warn('Error showing check notification:', error);
    }
  }
  showCheckmateNotification(winner, loser) {
    // Show simple pop-up notification for checkmate
    try {
      const message = document.createElement('div');
      message.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #d32f2f;
        color: white;
        padding: 20px 30px;
        border-radius: 10px;
        z-index: 10000;
        font-weight: bold;
        font-size: 1.4rem;
        text-align: center;
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
        border: 3px solid #b71c1c;
      `;
      message.innerHTML = `
        <div style="margin-bottom: 10px;">CHECKMATE!</div>
        <div style="font-size: 1rem;">${winner.toUpperCase()} WINS!</div>
      `;
      document.body.appendChild(message);
      setTimeout(() => {
        try {
          if (document.body.contains(message)) {
            document.body.removeChild(message);
          }
        } catch (error) {
          // Silently handle removal errors
          console.warn('Error removing checkmate notification:', error);
        }
      }, 5000);
    } catch (error) {
      // Silently handle DOM errors
      console.warn('Error showing checkmate notification:', error);
    }
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
    const senderEl = document.createElement('div');
    senderEl.className = 'chat-sender';
    senderEl.textContent = sender;
    const textEl = document.createElement('div');
    textEl.className = 'chat-text';
    textEl.textContent = message;
    messageDiv.appendChild(senderEl);
    messageDiv.appendChild(textEl);
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
      'king': {
        'white': '♔',
        'black': '♚'
      },
      'queen': {
        'white': '♕',
        'black': '♛'
      },
      'rook': {
        'white': '♖',
        'black': '♜'
      },
      'bishop': {
        'white': '♗',
        'black': '♝'
      },
      'knight': {
        'white': '♘',
        'black': '♞'
      },
      'pawn': {
        'white': '♙',
        'black': '♟'
      }
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