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
    this.players = null; // { white: {type, difficulty?}, black: {type, difficulty?} }
    this.chess = null; // Local ChessGame engine (practice mode only)
    this.whiteAIWorker = null;
    this.blackAIWorker = null;
    this.aiPaused = false;
    this.aiMoveDelay = 1000; // 1 second delay for AI moves
    this.pendingPromotionMove = null;
    this.awaitingResume = false;

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
      piece.addEventListener('click', e => this.selectPromotion(e.currentTarget.dataset.piece));
    });
  }

  setupSocketListeners() {
    if (!this.socket) return;
    this.socket.on('game-created', data => {
      this.currentGameId = data.gameId;
      this.playerColor = 'white';
      this.isPracticeMode = false;
      this.saveSessionToStorage();
      this.showHostScreen(data.gameId);
    });
    this.socket.on('game-joined', data => {
      this.currentGameId = data.gameId;
      if (data.color) this.playerColor = data.color;
      this.isPracticeMode = false;
      this.saveSessionToStorage();

      // Sent on rejoin too: if a game state is included, resync the board fully
      if (data.gameState) {
        this.gameState = this.normalizeGameState(data.gameState);
        this.showGameScreen();
        this.updateGameBoard();
        if (this.socket) this.socket.emit('get-chat-history', {
          gameId: this.currentGameId
        });
      }
    });
    this.socket.on('opponent-joined', data => {
      this.showGameScreen();

      // Request chat history when opponent joins
      if (!this.isPracticeMode && this.socket) {
        this.socket.emit('get-chat-history', {
          gameId: this.currentGameId
        });
      }
    });
    this.socket.on('game-start', data => {
      this.gameState = this.normalizeGameState(data.gameState);
      this.showGameScreen();
      this.updateGameBoard();

      // Request chat history for the game
      if (!this.isPracticeMode && this.socket) {
        this.socket.emit('get-chat-history', {
          gameId: this.currentGameId
        });
      }
    });
    this.socket.on('move-made', data => {
      this.gameState = this.normalizeGameState(data.gameState);
      this.clearSelection();
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
    this.socket.on('host-error', data => {
      this.showStatusMessage(data.message || 'Unable to host game', '#ff4444');
      this.showMainMenu();
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
    // Socket.IO v4: 'reconnect' fires on the Manager, not the Socket
    if (this.socket.io && typeof this.socket.io.on === 'function') {
      this.socket.io.on('reconnect', () => {
        this.updateConnectionStatus('connected');
        if (this.currentGameId && !this.isPracticeMode) {
          this.validateSession();
        }
      });
    }
    this.socket.on('opponent-disconnected', () => {
      this.showStatusMessage('Opponent disconnected. Waiting for them to reconnect...', '#ff9800');
    });
    this.socket.on('opponent-reconnected', () => {
      this.showStatusMessage('Opponent reconnected.', '#4caf50');
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
        // Session is invalid: clear it and never leave the UI hanging
        const wasAwaitingResume = this.awaitingResume;
        this.awaitingResume = false;
        this.clearGameSession();
        if (wasAwaitingResume) {
          this.showMainMenu();
        }
        return;
      }

      // Session is valid: resync local state from the server
      if (data.gameId) this.currentGameId = data.gameId;
      if (data.color) this.playerColor = data.color;
      if (data.gameState) this.gameState = this.normalizeGameState(data.gameState);
      this.isPracticeMode = false;
      this.saveSessionToStorage();
      const gameScreen = document.getElementById('game-screen');
      const gameScreenVisible = gameScreen && !gameScreen.classList.contains('hidden');
      if (this.awaitingResume || gameScreenVisible) {
        // Restore the game screen (resume click, mid-game reconnect)
        this.awaitingResume = false;
        this.showGameScreen();
        this.updateGameBoard();
        if (this.socket) this.socket.emit('get-chat-history', {
          gameId: this.currentGameId
        });
      } else {
        // Validated in the background (e.g. page load): offer resume
        this.updateResumeButton();
      }
    });
  }

  normalizeGameState(gameState) {
    if (!gameState) return gameState;
    if (!gameState.status && gameState.gameStatus) {
      gameState.status = gameState.gameStatus;
    }
    if (!Array.isArray(gameState.moveHistory)) {
      gameState.moveHistory = [];
    }
    return gameState;
  }

  // --- Session persistence (multiplayer only; practice games are not persisted) ---

  saveSessionToStorage() {
    if (this.isPracticeMode || !this.currentGameId) return;
    const session = {
      gameId: this.currentGameId,
      color: this.playerColor,
      isPracticeMode: false
    };
    try {
      localStorage.setItem('webchess-session', JSON.stringify(session));
    } catch (error) {
      console.warn('Unable to persist session:', error);
    }
  }

  loadSessionFromStorage() {
    let data = null;
    try {
      const raw = localStorage.getItem('webchess-session');
      if (!raw) return;
      data = JSON.parse(raw);
    } catch (error) {
      console.warn('Discarding corrupt session data:', error);
      this.clearSessionStorage();
      return;
    }
    try {
      if (!data || !data.gameId || data.isPracticeMode || data.gameId === 'practice') {
        // Practice sessions are no longer persisted; drop stale entries
        this.clearSessionStorage();
        return;
      }
      this.currentGameId = data.gameId;
      this.playerColor = data.color || null;
      this.isPracticeMode = false;
      this.updateResumeButton();
      this.validateSession();
    } catch (error) {
      console.warn('Unable to restore session:', error);
      this.clearSessionStorage();
      this.currentGameId = null;
      this.playerColor = null;
    }
  }

  clearSessionStorage() {
    try {
      localStorage.removeItem('webchess-session');
    } catch (error) {
      console.warn('Unable to clear session storage:', error);
    }
  }

  validateSession(requestResume = false) {
    if (!this.socket || !this.currentGameId || this.isPracticeMode) return;
    if (requestResume) this.awaitingResume = true;
    this.socket.emit('validate-session', {
      gameId: this.currentGameId
    });
  }

  rejoinGame() {
    this.validateSession(true);
  }

  // --- Resume / session lifecycle ---

  resumeGame() {
    if (!this.currentGameId) return;
    if (this.isPracticeMode) {
      this.resumePracticeGame();
    } else {
      this.rejoinGame();
    }
  }

  resumePracticeGame() {
    // Practice games only live in memory; resume re-displays the current engine state
    if (!this.isPracticeMode || !this.chess) {
      this.clearGameSession();
      this.showMainMenu();
      return;
    }
    this.gameState = this.normalizeGameState(this.chess.getGameState());
    this.showGameScreen();
    this.updateGameBoard();

    // Continue AI play if needed
    if (this.chess.gameStatus === 'active' && this.players &&
        this.players[this.chess.currentTurn] && this.players[this.chess.currentTurn].type === 'ai') {
      setTimeout(() => this.makeAIMove(), 500);
    }
  }

  updateResumeButton() {
    const resumeSection = document.getElementById('resume-section');
    const resumeInfo = document.getElementById('resume-info');
    const hasMultiplayerSession = this.currentGameId && !this.isPracticeMode && this.currentGameId !== 'practice';
    const hasPracticeSession = this.isPracticeMode && !!this.chess;
    if (hasMultiplayerSession || hasPracticeSession) {
      resumeSection.classList.remove('hidden');
      if (hasPracticeSession) {
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

  terminateAIWorkers() {
    if (this.whiteAIWorker) {
      this.whiteAIWorker.terminate();
      this.whiteAIWorker = null;
    }
    if (this.blackAIWorker) {
      this.blackAIWorker.terminate();
      this.blackAIWorker = null;
    }
  }

  clearGameSession() {
    this.currentGameId = null;
    this.playerColor = null;
    this.gameState = null;
    this.isPracticeMode = false;
    this.practiceMode = 'self';
    this.players = null;
    this.chess = null;
    this.selectedSquare = null;
    this.validMoves = [];
    this.pendingPromotionMove = null;
    this.terminateAIWorkers();
    this.clearSessionStorage();
    this.updateResumeButton();
  }

  // --- Menus / game setup ---

  hostGame() {
    this.resignFromPreviousGame();
    if (!this.socket) return;
    this.socket.emit('host-game');
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
    // Abandon any previous multiplayer session and AI workers
    this.resignFromPreviousGame();
    this.terminateAIWorkers();
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
    this.currentGameId = 'practice';

    // Keep practiceMode/playerColor bookkeeping in sync with the selected mode
    const whiteHuman = this.players.white.type === 'human';
    const blackHuman = this.players.black.type === 'human';
    if (whiteHuman && blackHuman) {
      this.practiceMode = 'self';
      this.playerColor = 'both';
    } else if (whiteHuman) {
      this.practiceMode = 'ai-white';
      this.playerColor = 'white';
    } else if (blackHuman) {
      this.practiceMode = 'ai-black';
      this.playerColor = 'black';
    } else {
      this.practiceMode = 'ai-vs-ai';
      this.playerColor = 'spectator';
    }

    // Reset AI pause state
    this.aiPaused = false;
    const pauseBtn = document.getElementById('pause-ai-btn');
    if (pauseBtn) {
      pauseBtn.textContent = 'Pause';
      pauseBtn.setAttribute('aria-pressed', 'false');
    }

    // Spin up a Web Worker per AI side
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
    this.gameState = this.normalizeGameState(this.chess.getGameState());
    this.selectedSquare = null;
    this.validMoves = [];
    this.pendingPromotionMove = null;
    this.showGameScreen();
    this.updateGameBoard();

    // Trigger first move if White is AI
    if (this.players.white.type === 'ai') {
      setTimeout(() => this.makeAIMove(), 500);
    }
  }

  // --- AI (Web Worker pipeline) ---

  handleAIWorkerMessage(e) {
    const {
      type,
      data,
      error
    } = e.data;
    if (type === 'ERROR') {
      console.error('AI Worker Error:', error);
      return;
    }
    if (type === 'MOVE_CALCULATED') {
      if (!this.isPracticeMode || !this.chess) return;
      const move = data && data.move;
      if (move) {
        // makeMove applies the move and schedules the next AI move if needed
        this.makeMove(move.from, move.to, move.promotion || null);
      }
    }
  }

  makeAIMove(force = false) {
    if (!this.isPracticeMode || !this.chess || this.chess.gameStatus !== 'active') return;
    if (this.aiPaused && !force) return;
    const turn = this.chess.currentTurn;
    if (!this.players || !this.players[turn] || this.players[turn].type !== 'ai') return;
    const worker = turn === 'white' ? this.whiteAIWorker : this.blackAIWorker;
    if (!worker) return;

    // Get FEN position to send to worker
    const fen = this.chess.stateManager.getFENPosition(this.chess.board, this.chess.currentTurn, this.chess.castlingRights, this.chess.enPassantTarget);
    worker.postMessage({
      type: 'CALCULATE_MOVE',
      data: {
        fen: fen
      }
    });
  }

  toggleAIPause() {
    this.aiPaused = !this.aiPaused;
    const btn = document.getElementById('pause-ai-btn');
    if (btn) {
      btn.textContent = this.aiPaused ? 'Resume' : 'Pause';
      btn.setAttribute('aria-pressed', String(this.aiPaused));
    }
    if (!this.aiPaused) {
      this.makeAIMove();
    }
  }

  stepAI() {
    if (this.isPracticeMode && this.practiceMode === 'ai-vs-ai' && this.chess && this.chess.gameStatus === 'active') {
      this.makeAIMove(true);
    }
  }

  // --- Move flow ---

  attemptMove(from, to) {
    if (!this.gameState || !this.gameState.board) return;
    const piece = this.gameState.board[from.row][from.col];
    const isPromotion = piece && piece.type === 'pawn' && (piece.color === 'white' && to.row === 0 || piece.color === 'black' && to.row === 7);
    if (isPromotion) {
      // Ask the player which piece to promote to before sending/applying the move
      this.pendingPromotionMove = {
        from,
        to
      };
      this.showPromotionModal();
      return;
    }
    this.makeMove(from, to);
  }

  makeMove(from, to, promotion = null) {
    if (this.isPracticeMode) {
      if (!this.chess) return;
      const moveResult = this.chess.makeMove({
        from,
        to,
        promotion
      });
      if (!moveResult || !moveResult.success) {
        this.showInvalidMoveMessage();
        return;
      }
      this.gameState = this.normalizeGameState(this.chess.getGameState());
      this.updateGameBoard();
      this.updateGameStatus();
      const history = this.gameState.moveHistory;
      this.addMoveToHistory(history.length ? history[history.length - 1] : {
        from,
        to,
        promotion
      });
      if (this.chess.gameStatus !== 'active' && this.chess.gameStatus !== 'check') {
        this.showGameEndScreen(this.chess.gameStatus, this.chess.winner);
        this.clearGameSession();
        return;
      }

      // If the next player is an AI, trigger its move
      if (this.players && this.players[this.chess.currentTurn] && this.players[this.chess.currentTurn].type === 'ai') {
        setTimeout(() => this.makeAIMove(), this.aiMoveDelay);
      }
      return;
    }

    // Multiplayer: the server is authoritative; state comes back via 'move-made'
    if (!this.socket) return;
    const move = {
      from,
      to
    };
    if (promotion) move.promotion = promotion;
    this.socket.emit('make-move', {
      gameId: this.currentGameId,
      move: move
    });
  }

  // --- Screens ---

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
    document.getElementById('promotion-modal').classList.add('hidden');
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
    this.renderMoveHistory();
  }

  showGameEndScreen(status, winner) {
    const title = document.getElementById('game-end-title');
    const message = document.getElementById('game-end-message');
    const capitalize = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
    const playsOneSide = this.playerColor === 'white' || this.playerColor === 'black';
    const winnerText = winner ? `${capitalize(winner)} wins!` : '';
    switch (status) {
      case 'checkmate':
        title.textContent = 'Checkmate!';
        if (winner && playsOneSide) {
          message.textContent = winner === this.playerColor ? 'You win!' : 'You lose!';
        } else {
          message.textContent = winnerText || 'Game over.';
        }
        break;
      case 'stalemate':
        title.textContent = 'Stalemate!';
        message.textContent = 'The game is a draw.';
        break;
      case 'draw':
        title.textContent = 'Draw!';
        message.textContent = 'The game ended in a draw.';
        break;
      case 'resigned':
        title.textContent = 'Game Over';
        if (winner && playsOneSide) {
          message.textContent = winner === this.playerColor ? 'Your opponent resigned. You win!' : 'You resigned.';
        } else if (winner) {
          message.textContent = `${capitalize(winner)} wins by resignation.`;
        } else {
          message.textContent = 'The game ended by resignation.';
        }
        break;
      case 'abandoned':
        title.textContent = 'Game Abandoned';
        if (winner && playsOneSide) {
          message.textContent = winner === this.playerColor ? 'Your opponent abandoned the game. You win!' : 'You abandoned the game.';
        } else if (winner) {
          message.textContent = winnerText;
        } else {
          message.textContent = 'The game was abandoned.';
        }
        break;
      default:
        title.textContent = 'Game Over';
        message.textContent = winner ? winnerText : 'The game has ended.';
        break;
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
    this.showStatusMessage(message || 'Invalid move', '#ff4444');
  }

  showStatusMessage(text, background = '#2196f3') {
    try {
      const announcer = document.getElementById('game-status-announcer');
      if (announcer) announcer.textContent = text;
      const message = document.createElement('div');
      message.style.cssText = `
        position: fixed;
        top: 20%;
        left: 50%;
        transform: translateX(-50%);
        background: ${background};
        color: white;
        padding: 10px 20px;
        border-radius: 5px;
        z-index: 10000;
        font-weight: bold;
      `;
      message.textContent = text;
      document.body.appendChild(message);
      setTimeout(() => {
        if (document.body.contains(message)) {
          document.body.removeChild(message);
        }
      }, 3000);
    } catch (error) {
      console.warn('Error showing status message:', error);
    }
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
    if (this.isPracticeMode && this.practiceMode === 'ai-vs-ai') {
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

  // --- Board rendering ---

  createChessBoard() {
    const board = document.getElementById('chess-board');
    board.innerHTML = '';

    // Render black's perspective (a1 top-right) when the player is black.
    // dataset.row/col always store logical board coordinates, so click
    // handling needs no extra mapping.
    const flipped = this.playerColor === 'black';
    for (let displayRow = 0; displayRow < 8; displayRow++) {
      for (let displayCol = 0; displayCol < 8; displayCol++) {
        const row = flipped ? 7 - displayRow : displayRow;
        const col = flipped ? 7 - displayCol : displayCol;
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
    if (!this.gameState || !this.gameState.board) return;
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
    if (!this.gameState || !this.gameState.board) return;
    const square = event.currentTarget;
    const row = parseInt(square.dataset.row);
    const col = parseInt(square.dataset.col);

    // Don't allow clicks in AI vs AI mode or when it's not the player's turn
    if (this.isPracticeMode && this.practiceMode === 'ai-vs-ai') {
      return;
    }
    if (!this.canPlayerMove()) {
      return;
    }
    if (this.selectedSquare) {
      if (this.selectedSquare.row === row && this.selectedSquare.col === col) {
        this.clearSelection();
        return;
      }
      if (this.isValidMove(row, col)) {
        const from = this.selectedSquare;
        this.clearSelection();
        this.attemptMove(from, {
          row,
          col
        });
        return;
      }
    }
    const piece = this.gameState.board[row][col];
    if (piece && this.canPlayerMovePiece(piece)) {
      this.selectSquare(row, col);
    }
  }

  canPlayerMove() {
    if (!this.gameState) return false;

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
    if (!this.gameState) return false;

    // Multiplayer mode
    if (!this.isPracticeMode) {
      return piece.color === this.playerColor;
    }

    // Practice mode logic
    if (this.playerColor === 'spectator') return false;
    if (this.playerColor === 'both') return piece.color === this.gameState.currentTurn;
    return piece.color === this.playerColor;
  }

  selectSquare(row, col) {
    this.clearSelection();
    this.selectedSquare = {
      row,
      col
    };
    const square = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    if (square) {
      square.classList.add('selected');
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
    this.validMoves.forEach(move => {
      const square = document.querySelector(`[data-row="${move.row}"][data-col="${move.col}"]`);
      if (square) {
        const isCapture = this.gameState.board[move.row][move.col] !== null;
        square.classList.add(isCapture ? 'capture-move' : 'valid-move');
      }
    });
  }

  getValidMoves(row, col) {
    if (!this.gameState || !this.gameState.board) return [];
    const piece = this.gameState.board[row][col];
    if (!piece || piece.color !== this.gameState.currentTurn) return [];

    // Practice mode: ask the local engine for exact legal moves
    if (this.isPracticeMode && this.chess) {
      const allLegalMoves = this.chess.getAllLegalMoves(piece.color);
      return allLegalMoves.filter(move => move.from.row === row && move.from.col === col).map(move => ({
        row: move.to.row,
        col: move.to.col
      }));
    }

    // Multiplayer: approximate legality locally for highlighting; the server
    // remains authoritative and rejects anything illegal.
    const moves = [];
    for (let toRow = 0; toRow < 8; toRow++) {
      for (let toCol = 0; toCol < 8; toCol++) {
        const move = {
          from: {
            row,
            col
          },
          to: {
            row: toRow,
            col: toCol
          }
        };
        if (this.isValidMoveObject(move)) {
          moves.push({
            row: toRow,
            col: toCol
          });
        }
      }
    }
    return moves;
  }

  isValidMove(row, col) {
    return this.validMoves.some(move => move.row === row && move.col === col);
  }

  // --- Client-side move validation (used for highlighting in multiplayer) ---

  isValidMoveObject(move) {
    if (!move || !move.from || !move.to) return false;
    if (!this.gameState || !this.gameState.board) return false;
    const piece = this.gameState.board[move.from.row][move.from.col];
    if (!piece || piece.color !== this.gameState.currentTurn) return false;

    // Can't capture a king
    const targetSquare = this.gameState.board[move.to.row][move.to.col];
    if (targetSquare && targetSquare.type === 'king') return false;
    if (!this.isValidPieceMove(move, piece)) return false;
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
        return dx === 2 && dy === 1 || dx === 1 && dy === 2;
      case 'king':
        if (dx === 0 && dy === 0) return false;
        // Normal king move (one square in any direction)
        if (dx <= 1 && dy <= 1) return true;
        // Castling move
        if (dy === 0 && dx === 2) {
          return this.isValidCastlingMove(move.from.row, move.from.col, move.to.row, move.to.col);
        }
        return false;
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
      if (dy === 2 * direction && move.from.row === startRow) {
        // Two squares from start; intermediate square must be empty
        const midRow = move.from.row + direction;
        return !this.gameState.board[midRow][move.from.col];
      }
      return false;
    }

    // Diagonal capture
    if (dx === 1 && dy === direction) {
      if (target && target.color !== piece.color) return true;

      // En passant capture
      if (this.gameState.enPassantTarget &&
          move.to.row === this.gameState.enPassantTarget.row &&
          move.to.col === this.gameState.enPassantTarget.col) {
        return true;
      }
      return false;
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

  hasCastlingRight(color, side) {
    const rights = this.gameState && this.gameState.castlingRights;
    if (!rights) return false;

    // Nested shape: { white: { kingside, queenside }, black: { ... } }
    if (rights[color] && typeof rights[color] === 'object') {
      return !!rights[color][side];
    }

    // Flat legacy shape: { whiteKingSide, whiteQueenSide, ... }
    const key = color + (side === 'kingside' ? 'KingSide' : 'QueenSide');
    return !!rights[key];
  }

  isValidCastlingMove(fromRow, fromCol, toRow, toCol) {
    const piece = this.gameState.board[fromRow][fromCol];
    if (!piece || piece.type !== 'king') return false;

    // King must be on starting square
    const startRow = piece.color === 'white' ? 7 : 0;
    if (fromRow !== startRow || fromCol !== 4 || toRow !== startRow) return false;
    const isKingSide = toCol > fromCol;
    if (!this.hasCastlingRight(piece.color, isKingSide ? 'kingside' : 'queenside')) return false;

    // King can't castle out of check
    if (this.isKingInCheck(piece.color)) return false;
    const rookCol = isKingSide ? 7 : 0;
    const direction = isKingSide ? 1 : -1;
    const rook = this.gameState.board[startRow][rookCol];
    if (!rook || rook.type !== 'rook' || rook.color !== piece.color) return false;

    // Squares between king and rook must be empty
    const startCol = Math.min(fromCol, rookCol) + 1;
    const endCol = Math.max(fromCol, rookCol) - 1;
    for (let col = startCol; col <= endCol; col++) {
      if (this.gameState.board[startRow][col] !== null) return false;
    }

    // King can't pass through or land on an attacked square
    for (let col = fromCol + direction; ; col += direction) {
      if (this.wouldKingBeInCheck(piece.color, startRow, col, fromRow, fromCol)) return false;
      if (col === toCol) break;
    }
    return true;
  }

  wouldKingBeInCheck(color, row, col, kingFromRow, kingFromCol) {
    // Temporarily move the king to the position and test for check
    const originalPiece = this.gameState.board[row][col];
    const king = this.gameState.board[kingFromRow][kingFromCol];
    this.gameState.board[kingFromRow][kingFromCol] = null;
    this.gameState.board[row][col] = king;
    const inCheck = this.isKingInCheck(color);
    this.gameState.board[row][col] = originalPiece;
    this.gameState.board[kingFromRow][kingFromCol] = king;
    return inCheck;
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
          const move = {
            from: {
              row,
              col
            },
            to: kingPos
          };
          if (piece.type === 'king') {
            // Avoid castling recursion: only adjacent squares threaten
            const dx = Math.abs(kingPos.col - col);
            const dy = Math.abs(kingPos.row - row);
            if (dx <= 1 && dy <= 1 && (dx || dy)) return true;
          } else if (this.isValidPieceMove(move, piece)) {
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
          return {
            row,
            col
          };
        }
      }
    }
    return null;
  }

  // --- Move history ---

  addMoveToHistory(move) {
    const moveList = document.getElementById('move-list');
    if (!moveList || !move) return;
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

  renderMoveHistory() {
    this.clearMoveHistory();
    const history = this.gameState && Array.isArray(this.gameState.moveHistory) ? this.gameState.moveHistory : [];
    history.forEach(move => this.addMoveToHistory(move));
  }

  formatMove(move) {
    if (!move || !move.from || !move.to) return '';
    let pieceType = move.piece || null;
    if (!pieceType && this.gameState && this.gameState.board) {
      const pieceAtDest = this.gameState.board[move.to.row][move.to.col];
      if (pieceAtDest) pieceType = pieceAtDest.type;
    }
    if (!pieceType) return this.formatSimpleMove(move);

    // Castling
    if (pieceType === 'king' && Math.abs(move.to.col - move.from.col) === 2) {
      return move.to.col > move.from.col ? 'O-O' : 'O-O-O';
    }
    const pieceSymbols = {
      pawn: '',
      knight: 'N',
      bishop: 'B',
      rook: 'R',
      queen: 'Q',
      king: 'K'
    };
    const pieceSymbol = pieceSymbols[pieceType] !== undefined ? pieceSymbols[pieceType] : '';
    const toSquare = String.fromCharCode(97 + move.to.col) + (8 - move.to.row);
    const isCapture = !!move.captured || pieceType === 'pawn' && move.from.col !== move.to.col;
    const captureSymbol = isCapture ? 'x' : '';

    // For pawn captures, include the file
    const fromFile = pieceType === 'pawn' && isCapture ? String.fromCharCode(97 + move.from.col) : '';
    const promotionSymbol = move.promotion ? `=${move.promotion.toUpperCase()[0]}` : '';
    return `${pieceSymbol}${fromFile}${captureSymbol}${toSquare}${promotionSymbol}`;
  }

  formatSimpleMove(move) {
    const fromSquare = String.fromCharCode(97 + move.from.col) + (8 - move.from.row);
    const toSquare = String.fromCharCode(97 + move.to.col) + (8 - move.to.row);
    return `${fromSquare}-${toSquare}`;
  }

  // --- Status / connection ---

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

  // --- Promotion ---

  showPromotionModal() {
    const modal = document.getElementById('promotion-modal');
    const piece = this.gameState.board[this.pendingPromotionMove.from.row][this.pendingPromotionMove.from.col];

    // Update the promotion pieces to show the correct color
    const promotionPieces = document.querySelectorAll('.promotion-piece');
    const pieces = piece && piece.color === 'black' ? {
      queen: '♛',
      rook: '♜',
      bishop: '♝',
      knight: '♞'
    } : {
      queen: '♕',
      rook: '♖',
      bishop: '♗',
      knight: '♘'
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
    const {
      from,
      to
    } = this.pendingPromotionMove;
    this.pendingPromotionMove = null;

    // Send/apply the move with the chosen promotion piece; the engine or
    // server produces the resulting state (no manual board mutation here).
    this.makeMove(from, to, pieceType);
  }

  // --- Notifications ---

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
    message.textContent = this.gameState && this.gameState.inCheck ? 'Must move out of check!' : 'Invalid move!';
    document.body.appendChild(message);
    setTimeout(() => {
      if (document.body.contains(message)) {
        document.body.removeChild(message);
      }
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

  // --- Chat ---

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

  // --- Debugging ---

  debugDumpGameState() {
    if (!this.gameState || !this.gameState.board) {
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
    const moveHistory = Array.isArray(this.gameState.moveHistory) ? this.gameState.moveHistory : [];
    const validMoves = Array.isArray(this.validMoves) ? this.validMoves : [];
    let markdown = '## Current Game State\n\n';
    markdown += `**Turn:** ${this.gameState.currentTurn}\n`;
    markdown += `**Status:** ${this.gameState.status || this.gameState.gameStatus || 'unknown'}\n`;
    markdown += `**Player Color:** ${this.playerColor}\n`;
    markdown += `**Practice Mode:** ${this.isPracticeMode ? this.practiceMode : 'false'}\n`;
    markdown += `**Selected Square:** ${this.selectedSquare ? `${String.fromCharCode(97 + this.selectedSquare.col)}${8 - this.selectedSquare.row}` : 'none'}\n`;
    markdown += `**Valid Moves:** ${validMoves.length}\n`;
    markdown += `**In Check:** ${!!this.gameState.inCheck}\n\n`;
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
    markdown += '\n**Move History:** ' + moveHistory.length + ' moves\n';
    if (moveHistory.length > 0) {
      const lastMove = moveHistory[moveHistory.length - 1];
      markdown += `**Last Move:** ${this.formatMove(lastMove)}\n`;
    }
    console.log(markdown);

    // Copy to clipboard
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(markdown).then(() => {
        alert('Game state copied to clipboard!\n\nAlso check the browser console for the full output.');
      }).catch(() => {
        // Fallback: show in alert (truncated)
        const shortMarkdown = markdown.substring(0, 500) + (markdown.length > 500 ? '...\n\n[Full output in console]' : '');
        alert('Game state (check console for full version):\n\n' + shortMarkdown);
      });
    } else {
      alert('Game state dumped to the browser console.');
    }
  }
}
