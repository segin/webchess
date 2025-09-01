/**
 * Game State Management Module
 * Handles comprehensive game state tracking, validation, and updates
 */

class GameStateManager {
  constructor() {
    this.stateVersion = 1;
    this.gameMetadata = {
      startTime: Date.now(),
      lastMoveTime: Date.now(),
      totalMoves: 0,
      gameId: this.generateGameId(),
      version: '1.0.0'
    };
    this.positionHistory = [];
    this.lastValidatedState = null;
  }

  /**
   * Generate a unique game ID for tracking
   * @returns {string} Unique game identifier
   */
  generateGameId() {
    return 'game_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Get simplified FEN-like position string for position tracking
   * @param {Array} board - Chess board state
   * @param {string} currentTurn - Current player turn
   * @param {Object} castlingRights - Castling rights object
   * @param {Object} enPassantTarget - En passant target square
   * @returns {string} Position string for comparison
   */
  getFENPosition(board, currentTurn, castlingRights, enPassantTarget) {
    let fen = '';
    
    // Board position
    for (let row = 0; row < 8; row++) {
      let emptyCount = 0;
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece) {
          if (emptyCount > 0) {
            fen += emptyCount;
            emptyCount = 0;
          }
          // Use proper chess notation symbols
          const symbolMap = {
            'king': 'k',
            'queen': 'q', 
            'rook': 'r',
            'bishop': 'b',
            'knight': 'n',
            'pawn': 'p'
          };
          const symbol = symbolMap[piece.type] || piece.type[0];
          fen += piece.color === 'white' ? symbol.toUpperCase() : symbol.toLowerCase();
        } else {
          emptyCount++;
        }
      }
      if (emptyCount > 0) {
        fen += emptyCount;
      }
      if (row < 7) fen += '/';
    }
    
    // Active color
    fen += ' ' + (currentTurn === 'white' ? 'w' : 'b');
    
    // Castling rights
    let castling = '';
    if (castlingRights.white.kingside) castling += 'K';
    if (castlingRights.white.queenside) castling += 'Q';
    if (castlingRights.black.kingside) castling += 'k';
    if (castlingRights.black.queenside) castling += 'q';
    fen += ' ' + (castling || '-');
    
    // En passant target
    if (enPassantTarget) {
      const file = String.fromCharCode(97 + enPassantTarget.col);
      const rank = 8 - enPassantTarget.row;
      fen += ' ' + file + rank;
    } else {
      fen += ' -';
    }
    
    return fen;
  }

  /**
   * Enhanced turn alternation validation ensuring proper white/black turn sequence
   * @param {string} currentTurn - Current turn color
   * @param {string} expectedColor - Expected color for current turn
   * @param {Array} moveHistory - Move history array
   * @returns {Object} Validation result with detailed information
   */
  validateTurnSequence(currentTurn, expectedColor, moveHistory) {
    if (!expectedColor || !['white', 'black'].includes(expectedColor)) {
      return {
        success: false,
        message: 'Invalid color specified for turn validation',
        code: 'INVALID_COLOR',
        details: {
          providedColor: expectedColor,
          validColors: ['white', 'black']
        }
      };
    }

    if (currentTurn !== expectedColor) {
      return {
        success: false,
        message: `Turn sequence violation: expected ${expectedColor}, but it's ${currentTurn}'s turn`,
        code: 'TURN_SEQUENCE_VIOLATION',
        details: {
          expectedTurn: expectedColor,
          actualTurn: currentTurn,
          totalMoves: this.gameMetadata.totalMoves
        }
      };
    }

    // Validate turn sequence consistency with move history
    const expectedTurnFromHistory = this.calculateExpectedTurnFromHistory(moveHistory);
    if (currentTurn !== expectedTurnFromHistory) {
      return {
        success: false,
        message: 'Turn sequence inconsistent with move history',
        code: 'TURN_HISTORY_MISMATCH',
        details: {
          currentTurn: currentTurn,
          expectedFromHistory: expectedTurnFromHistory,
          moveHistoryLength: moveHistory.length
        }
      };
    }

    return {
      success: true,
      message: 'Turn sequence is valid',
      details: {
        currentTurn: currentTurn,
        isConsistent: true
      }
    };
  }

  /**
   * Calculate expected turn based on move history
   * @param {Array} moveHistory - Move history array
   * @returns {string} Expected current turn color
   */
  calculateExpectedTurnFromHistory(moveHistory) {
    // White always starts, turns alternate
    return moveHistory.length % 2 === 0 ? 'white' : 'black';
  }

  /**
   * Enhanced game status management with accurate status updates
   * @param {string} currentStatus - Current game status
   * @param {string} newStatus - New game status to set
   * @param {string} winner - Winner if game is ending
   * @returns {Object} Status update result
   */
  updateGameStatus(currentStatus, newStatus, winner = null) {
    const validStatuses = ['active', 'check', 'checkmate', 'stalemate', 'draw'];
    
    if (!validStatuses.includes(newStatus)) {
      return {
        success: false,
        message: 'Invalid game status',
        code: 'INVALID_STATUS',
        details: {
          providedStatus: newStatus,
          validStatuses: validStatuses
        }
      };
    }

    // Validate status transitions
    const transitionValidation = this.validateStatusTransition(currentStatus, newStatus);
    if (!transitionValidation.success) {
      return {
        success: false,
        message: transitionValidation.message,
        code: 'INVALID_STATUS_TRANSITION',
        details: transitionValidation.details
      };
    }

    // Validate winner assignment
    if (['checkmate'].includes(newStatus)) {
      if (!winner || !['white', 'black'].includes(winner)) {
        return {
          success: false,
          message: 'Winner must be specified for checkmate',
          code: 'MISSING_WINNER',
          details: {
            status: newStatus,
            providedWinner: winner
          }
        };
      }
    } else if (['stalemate', 'draw'].includes(newStatus)) {
      if (winner !== null) {
        return {
          success: false,
          message: 'Winner should be null for draw conditions',
          code: 'INVALID_WINNER_FOR_DRAW',
          details: {
            status: newStatus,
            providedWinner: winner
          }
        };
      }
    }

    // Update metadata
    this.gameMetadata.lastMoveTime = Date.now();
    this.stateVersion++;

    return {
      success: true,
      message: `Game status updated from ${currentStatus} to ${newStatus}`,
      details: {
        previousStatus: currentStatus,
        newStatus: newStatus,
        newWinner: winner,
        stateVersion: this.stateVersion
      }
    };
  }

  /**
   * Validate game status transitions
   * @param {string} fromStatus - Current status
   * @param {string} toStatus - Target status
   * @returns {Object} Validation result
   */
  validateStatusTransition(fromStatus, toStatus) {
    // Allow same status (no change)
    if (fromStatus === toStatus) {
      return {
        success: true,
        message: `Status remains ${fromStatus}`,
        details: { fromStatus, toStatus }
      };
    }

    const validTransitions = {
      'active': ['check', 'checkmate', 'stalemate', 'draw'],
      'check': ['active', 'checkmate', 'stalemate', 'draw'],
      'checkmate': [], // Terminal state
      'stalemate': [], // Terminal state
      'draw': [] // Terminal state
    };

    if (!validTransitions[fromStatus]) {
      return {
        success: false,
        message: `Unknown source status: ${fromStatus}`,
        details: { fromStatus, toStatus }
      };
    }

    if (!validTransitions[fromStatus].includes(toStatus)) {
      return {
        success: false,
        message: `Invalid transition from ${fromStatus} to ${toStatus}`,
        details: {
          fromStatus,
          toStatus,
          validTransitions: validTransitions[fromStatus]
        }
      };
    }

    return {
      success: true,
      message: `Valid transition from ${fromStatus} to ${toStatus}`,
      details: { fromStatus, toStatus }
    };
  }

  /**
   * Enhanced move history tracking with complete move information and metadata
   * @param {Array} moveHistory - Current move history
   * @param {Object} moveData - Complete move information
   * @param {number} fullMoveNumber - Current full move number
   * @param {Object} gameState - Current game state for snapshot
   * @returns {Object} Enhanced move record
   */
  addMoveToHistory(moveHistory, moveData, fullMoveNumber, gameState) {
    const enhancedMove = {
      ...moveData,
      moveNumber: fullMoveNumber,
      turnNumber: this.gameMetadata.totalMoves + 1,
      timestamp: Date.now(),
      gameStateSnapshot: {
        inCheck: gameState.inCheck,
        checkDetails: gameState.checkDetails ? { ...gameState.checkDetails } : null,
        castlingRights: JSON.parse(JSON.stringify(gameState.castlingRights)),
        enPassantTarget: gameState.enPassantTarget ? { ...gameState.enPassantTarget } : null,
        halfMoveClock: gameState.halfMoveClock,
        fullMoveNumber: fullMoveNumber
      },
      positionAfterMove: this.getFENPosition(
        gameState.board, 
        gameState.currentTurn, 
        gameState.castlingRights, 
        gameState.enPassantTarget
      )
    };

    moveHistory.push(enhancedMove);
    this.gameMetadata.totalMoves++;
    this.gameMetadata.lastMoveTime = Date.now();
    
    // Update position history for repetition detection
    this.positionHistory.push(enhancedMove.positionAfterMove);
    
    // Keep position history manageable (last 100 positions should be enough)
    if (this.positionHistory.length > 100) {
      this.positionHistory = this.positionHistory.slice(-100);
    }

    return enhancedMove;
  }

  /**
   * Comprehensive game state consistency validation
   * @param {Object} gameState - Complete game state to validate
   * @returns {Object} Detailed validation result
   */
  validateGameStateConsistency(gameState) {
    const errors = [];
    const warnings = [];

    // Validate turn consistency
    const expectedTurn = this.calculateExpectedTurnFromHistory(gameState.moveHistory);
    if (gameState.currentTurn !== expectedTurn) {
      errors.push(`Turn mismatch: current=${gameState.currentTurn}, expected=${expectedTurn}`);
    }

    // Validate move numbers
    if (gameState.fullMoveNumber < 1) {
      errors.push(`Invalid full move number: ${gameState.fullMoveNumber}`);
    }

    if (gameState.halfMoveClock < 0) {
      errors.push(`Invalid half move clock: ${gameState.halfMoveClock}`);
    }

    // Validate game status consistency
    if (gameState.gameStatus === 'checkmate' && !gameState.winner) {
      errors.push('Checkmate status requires a winner');
    }

    if (['stalemate', 'draw'].includes(gameState.gameStatus) && gameState.winner) {
      errors.push(`${gameState.gameStatus} status should not have a winner`);
    }

    // Validate board state
    const kingCount = { white: 0, black: 0 };
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = gameState.board[row][col];
        if (piece && piece.type === 'king') {
          kingCount[piece.color]++;
        }
      }
    }

    if (kingCount.white !== 1) {
      errors.push(`Invalid white king count: ${kingCount.white}`);
    }
    if (kingCount.black !== 1) {
      errors.push(`Invalid black king count: ${kingCount.black}`);
    }

    // Validate castling rights consistency
    if (!this.validateCastlingRightsConsistency(gameState.board, gameState.castlingRights)) {
      warnings.push('Castling rights may be inconsistent with piece positions');
    }

    // Validate position history
    if (this.positionHistory.length === 0) {
      errors.push('Position history is empty');
    }

    const currentPosition = this.getFENPosition(
      gameState.board, 
      gameState.currentTurn, 
      gameState.castlingRights, 
      gameState.enPassantTarget
    );
    const lastRecordedPosition = this.positionHistory[this.positionHistory.length - 1];
    if (currentPosition !== lastRecordedPosition) {
      warnings.push('Current position does not match last recorded position');
    }

    return {
      success: errors.length === 0,
      errors: errors,
      warnings: warnings,
      stateVersion: this.stateVersion,
      validationTimestamp: Date.now(),
      details: {
        turnConsistency: gameState.currentTurn === expectedTurn,
        kingCount: kingCount,
        moveHistoryLength: gameState.moveHistory.length,
        positionHistoryLength: this.positionHistory.length
      }
    };
  }

  /**
   * Validate board consistency (piece placement, king count, etc.)
   * @param {Array} board - Chess board state
   * @returns {Object} Validation result with detailed information
   */
  validateBoardConsistency(board) {
    if (!Array.isArray(board) || board.length !== 8) {
      return {
        isValid: false,
        errors: ['Invalid board structure'],
        details: { expectedRows: 8, actualRows: board ? board.length : 0 }
      };
    }

    const errors = [];
    const kingCount = { white: 0, black: 0 };
    const pieceCount = { white: 0, black: 0 };

    for (let row = 0; row < 8; row++) {
      if (!Array.isArray(board[row]) || board[row].length !== 8) {
        errors.push(`Row ${row} has invalid structure`);
        continue;
      }

      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece) {
          if (!piece.type || !piece.color) {
            errors.push(`Invalid piece at (${row},${col}): missing type or color`);
            continue;
          }

          if (!['white', 'black'].includes(piece.color)) {
            errors.push(`Invalid piece color at (${row},${col}): ${piece.color}`);
          }

          if (!['pawn', 'rook', 'knight', 'bishop', 'queen', 'king'].includes(piece.type)) {
            errors.push(`Invalid piece type at (${row},${col}): ${piece.type}`);
          }

          pieceCount[piece.color]++;
          if (piece.type === 'king') {
            kingCount[piece.color]++;
          }
        }
      }
    }

    // Validate king count
    if (kingCount.white !== 1) {
      errors.push(`Invalid white king count: ${kingCount.white} (expected 1)`);
    }
    if (kingCount.black !== 1) {
      errors.push(`Invalid black king count: ${kingCount.black} (expected 1)`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      details: { kingCount, pieceCount }
    };
  }

  /**
   * Validate king count on the board
   * @param {Array} board - Chess board state
   * @returns {Object} King count validation result
   */
  validateKingCount(board) {
    const kingCount = { white: 0, black: 0 };
    
    if (!Array.isArray(board)) {
      return {
        isValid: false,
        whiteKings: 0,
        blackKings: 0,
        errors: ['Invalid board structure']
      };
    }

    for (let row = 0; row < 8; row++) {
      if (!Array.isArray(board[row])) continue;
      
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece && piece.type === 'king') {
          kingCount[piece.color]++;
        }
      }
    }

    return {
      isValid: kingCount.white === 1 && kingCount.black === 1,
      whiteKings: kingCount.white,
      blackKings: kingCount.black,
      errors: kingCount.white !== 1 || kingCount.black !== 1 ? 
        [`Expected 1 king per color, found white: ${kingCount.white}, black: ${kingCount.black}`] : []
    };
  }

  /**
   * Validate turn consistency
   * @param {Object} gameState - Game state object
   * @returns {Object} Turn validation result
   */
  validateTurnConsistency(gameState) {
    if (!gameState || !gameState.moveHistory) {
      return {
        isValid: false,
        expectedTurn: 'white',
        errors: ['Invalid game state or missing move history']
      };
    }

    const expectedTurn = this.calculateExpectedTurnFromHistory(gameState.moveHistory);
    const isValid = gameState.currentTurn === expectedTurn;

    return {
      isValid,
      expectedTurn,
      actualTurn: gameState.currentTurn,
      errors: isValid ? [] : [`Turn mismatch: expected ${expectedTurn}, got ${gameState.currentTurn}`]
    };
  }

  /**
   * Validate en passant target consistency
   * @param {Object} gameState - Game state object
   * @returns {Object} En passant validation result
   */
  validateEnPassantConsistency(gameState) {
    if (!gameState || !gameState.moveHistory) {
      return {
        isValid: false,
        expectedTarget: null,
        errors: ['Invalid game state or missing move history']
      };
    }

    // En passant is only valid immediately after a pawn two-square move
    const lastMove = gameState.moveHistory[gameState.moveHistory.length - 1];
    let expectedTarget = null;

    if (lastMove && lastMove.piece === 'pawn') {
      const rowDiff = Math.abs(lastMove.to.row - lastMove.from.row);
      if (rowDiff === 2) {
        // Two-square pawn move, en passant target is the square the pawn passed over
        expectedTarget = {
          row: (lastMove.from.row + lastMove.to.row) / 2,
          col: lastMove.to.col
        };
      }
    }

    const actualTarget = gameState.enPassantTarget;
    const isValid = (expectedTarget === null && actualTarget === null) ||
                   (expectedTarget !== null && actualTarget !== null &&
                    expectedTarget.row === actualTarget.row && expectedTarget.col === actualTarget.col);

    return {
      isValid,
      expectedTarget,
      actualTarget,
      errors: isValid ? [] : ['En passant target mismatch']
    };
  }

  /**
   * Track state changes between two game states
   * @param {Object} oldState - Previous game state
   * @param {Object} newState - New game state
   */
  trackStateChange(oldState, newState) {
    if (!oldState || !newState) return;

    // Update state version
    this.stateVersion++;

    // Track position if it's different
    const newPosition = this.getFENPosition(
      newState.board, 
      newState.currentTurn, 
      newState.castlingRights, 
      newState.enPassantTarget
    );

    if (this.positionHistory.length === 0 || 
        this.positionHistory[this.positionHistory.length - 1] !== newPosition) {
      this.addPositionToHistory(newPosition);
    }

    // Update metadata
    this.gameMetadata.lastMoveTime = Date.now();
    if (newState.moveHistory && oldState.moveHistory && 
        newState.moveHistory.length > oldState.moveHistory.length) {
      this.gameMetadata.totalMoves = newState.moveHistory.length;
    }
  }

  /**
   * Update state version
   */
  updateStateVersion() {
    this.stateVersion++;
  }

  /**
   * Add position to history for threefold repetition tracking
   * @param {string} position - FEN-like position string
   */
  addPositionToHistory(position) {
    this.positionHistory.push(position);
    
    // Keep position history manageable
    if (this.positionHistory.length > 100) {
      this.positionHistory = this.positionHistory.slice(-100);
    }
  }

  /**
   * Check for threefold repetition
   * @returns {boolean} True if threefold repetition occurred
   */
  checkThreefoldRepetition() {
    if (this.positionHistory.length < 3) return false;

    const positionCounts = {};
    for (const position of this.positionHistory) {
      positionCounts[position] = (positionCounts[position] || 0) + 1;
      if (positionCounts[position] >= 3) {
        return true;
      }
    }
    return false;
  }

  /**
   * Update game metadata
   * @param {Object} metadata - Metadata updates
   */
  updateGameMetadata(metadata) {
    this.gameMetadata = { ...this.gameMetadata, ...metadata };
  }

  /**
   * Get state snapshot
   * @param {Object} gameState - Current game state
   * @returns {Object} State snapshot
   */
  getStateSnapshot(gameState) {
    return {
      timestamp: Date.now(),
      stateVersion: this.stateVersion,
      gameState: JSON.parse(JSON.stringify(gameState)), // Deep copy
      metadata: { ...this.gameMetadata },
      positionHistory: [...this.positionHistory]
    };
  }

  /**
   * Validate state snapshot
   * @param {Object} snapshot - State snapshot to validate
   * @returns {Object} Validation result
   */
  validateStateSnapshot(snapshot) {
    const errors = [];

    if (!snapshot) {
      errors.push('Snapshot is null or undefined');
      return { isValid: false, errors };
    }

    if (!snapshot.timestamp || typeof snapshot.timestamp !== 'number') {
      errors.push('Invalid or missing timestamp');
    }

    if (!snapshot.stateVersion || typeof snapshot.stateVersion !== 'number') {
      errors.push('Invalid or missing state version');
    }

    if (!snapshot.gameState) {
      errors.push('Missing game state');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Analyze game progression
   * @param {Object} gameState - Current game state
   * @returns {Object} Game progression analysis
   */
  analyzeGameProgression(gameState) {
    const moveCount = gameState.moveHistory ? gameState.moveHistory.length : 0;
    const phase = this.detectGamePhase(gameState);
    
    return {
      phase,
      moveCount,
      characteristics: {
        isEarlyGame: moveCount < 20,
        isMidGame: moveCount >= 20 && moveCount < 60,
        isEndGame: moveCount >= 60,
        hasComplexPosition: this.analyzePositionComplexity(gameState.board)
      }
    };
  }

  /**
   * Detect current game phase
   * @param {Object} gameState - Current game state
   * @returns {string} Game phase (opening, middlegame, endgame)
   */
  detectGamePhase(gameState) {
    const moveCount = gameState.moveHistory ? gameState.moveHistory.length : 0;
    const materialBalance = this.calculateMaterialBalance(gameState.board);
    const totalMaterial = materialBalance.white.total + materialBalance.black.total;

    if (moveCount < 20) {
      return 'opening';
    } else if (totalMaterial < 20 || moveCount > 60) {
      return 'endgame';
    } else {
      return 'middlegame';
    }
  }

  /**
   * Calculate material balance
   * @param {Array} board - Chess board state
   * @returns {Object} Material balance analysis
   */
  calculateMaterialBalance(board) {
    const pieceValues = {
      pawn: 1, knight: 3, bishop: 3, rook: 5, queen: 9, king: 0
    };

    const balance = {
      white: { pawn: 0, knight: 0, bishop: 0, rook: 0, queen: 0, king: 0, total: 0 },
      black: { pawn: 0, knight: 0, bishop: 0, rook: 0, queen: 0, king: 0, total: 0 }
    };

    if (!Array.isArray(board)) {
      return { white: balance.white, black: balance.black, difference: 0 };
    }

    for (let row = 0; row < 8; row++) {
      if (!Array.isArray(board[row])) continue;
      
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece && piece.type && piece.color) {
          balance[piece.color][piece.type]++;
          balance[piece.color].total += pieceValues[piece.type] || 0;
        }
      }
    }

    return {
      white: balance.white,
      black: balance.black,
      difference: balance.white.total - balance.black.total
    };
  }

  /**
   * Analyze piece activity
   * @param {Array} board - Chess board state
   * @param {string} color - Color to analyze
   * @returns {Object} Piece activity analysis
   */
  analyzePieceActivity(board, color) {
    const activePieces = [];
    let totalMobility = 0;

    if (!Array.isArray(board)) {
      return { activePieces: [], totalMobility: 0, averageMobility: 0 };
    }

    for (let row = 0; row < 8; row++) {
      if (!Array.isArray(board[row])) continue;
      
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece && piece.color === color) {
          const mobility = this.calculatePieceMobility(board, row, col, piece);
          activePieces.push({
            type: piece.type,
            position: { row, col },
            mobility
          });
          totalMobility += mobility;
        }
      }
    }

    return {
      activePieces,
      totalMobility,
      averageMobility: activePieces.length > 0 ? totalMobility / activePieces.length : 0
    };
  }

  /**
   * Calculate mobility for a specific piece
   * @param {Array} board - Chess board state
   * @param {number} row - Piece row
   * @param {number} col - Piece column
   * @param {Object} piece - Piece object
   * @returns {number} Number of legal moves
   */
  calculatePieceMobility(board, row, col, piece) {
    // Simplified mobility calculation - count potential moves
    let mobility = 0;
    
    for (let toRow = 0; toRow < 8; toRow++) {
      for (let toCol = 0; toCol < 8; toCol++) {
        if (toRow === row && toCol === col) continue;
        
        // Basic movement pattern check (simplified)
        if (this.isBasicMoveValid(piece.type, row, col, toRow, toCol)) {
          mobility++;
        }
      }
    }
    
    return mobility;
  }

  /**
   * Basic move validation for mobility calculation
   * @param {string} pieceType - Type of piece
   * @param {number} fromRow - Source row
   * @param {number} fromCol - Source column
   * @param {number} toRow - Target row
   * @param {number} toCol - Target column
   * @returns {boolean} True if move pattern is valid
   */
  isBasicMoveValid(pieceType, fromRow, fromCol, toRow, toCol) {
    const rowDiff = Math.abs(toRow - fromRow);
    const colDiff = Math.abs(toCol - fromCol);

    switch (pieceType) {
      case 'pawn':
        return colDiff <= 1 && rowDiff <= 2;
      case 'rook':
        return rowDiff === 0 || colDiff === 0;
      case 'knight':
        return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
      case 'bishop':
        return rowDiff === colDiff;
      case 'queen':
        return rowDiff === 0 || colDiff === 0 || rowDiff === colDiff;
      case 'king':
        return rowDiff <= 1 && colDiff <= 1;
      default:
        return false;
    }
  }

  /**
   * Analyze position complexity
   * @param {Array} board - Chess board state
   * @returns {boolean} True if position is complex
   */
  analyzePositionComplexity(board) {
    if (!Array.isArray(board)) return false;
    
    let pieceCount = 0;
    for (let row = 0; row < 8; row++) {
      if (!Array.isArray(board[row])) continue;
      for (let col = 0; col < 8; col++) {
        if (board[row][col]) pieceCount++;
      }
    }
    
    return pieceCount > 20; // Simplified complexity measure
  }

  /**
   * Serialize game state to string
   * @param {Object} gameState - Game state to serialize
   * @returns {string} Serialized game state
   */
  serializeGameState(gameState) {
    try {
      return JSON.stringify(gameState);
    } catch (error) {
      return null;
    }
  }

  /**
   * Deserialize game state from string
   * @param {string} serialized - Serialized game state
   * @returns {Object|null} Deserialized game state or null if invalid
   */
  deserializeGameState(serialized) {
    try {
      return JSON.parse(serialized);
    } catch (error) {
      return null;
    }
  }

  /**
   * Create state checkpoint
   * @param {Object} gameState - Current game state
   * @returns {Object} Checkpoint object
   */
  createStateCheckpoint(gameState) {
    return {
      id: `checkpoint_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      state: this.serializeGameState(gameState),
      metadata: { ...this.gameMetadata },
      stateVersion: this.stateVersion
    };
  }

  /**
   * Restore from checkpoint
   * @param {Object} checkpoint - Checkpoint to restore from
   * @returns {Object} Restoration result
   */
  restoreFromCheckpoint(checkpoint) {
    if (!checkpoint || !checkpoint.state) {
      return {
        success: false,
        message: 'Invalid checkpoint'
      };
    }

    const gameState = this.deserializeGameState(checkpoint.state);
    if (!gameState) {
      return {
        success: false,
        message: 'Failed to deserialize checkpoint state'
      };
    }

    return {
      success: true,
      gameState,
      metadata: checkpoint.metadata
    };
  }

  /**
   * Compare two game states
   * @param {Object} state1 - First game state
   * @param {Object} state2 - Second game state
   * @returns {Object} Comparison result
   */
  compareGameStates(state1, state2) {
    const differences = [];
    
    if (!state1 || !state2) {
      return {
        identical: false,
        differences: ['One or both states are null/undefined']
      };
    }

    // Compare basic properties
    if (state1.currentTurn !== state2.currentTurn) {
      differences.push(`Current turn: ${state1.currentTurn} vs ${state2.currentTurn}`);
    }

    if (state1.gameStatus !== state2.gameStatus) {
      differences.push(`Game status: ${state1.gameStatus} vs ${state2.gameStatus}`);
    }

    // Compare move history length
    const moves1 = state1.moveHistory || [];
    const moves2 = state2.moveHistory || [];
    if (moves1.length !== moves2.length) {
      differences.push(`Move history length: ${moves1.length} vs ${moves2.length}`);
    }

    return {
      identical: differences.length === 0,
      differences
    };
  }

  /**
   * Detect state changes between two states
   * @param {Object} oldState - Previous state
   * @param {Object} newState - New state
   * @returns {Array} List of changes
   */
  detectStateChanges(oldState, newState) {
    const changes = [];
    
    if (!oldState || !newState) {
      changes.push('State comparison with null/undefined');
      return changes;
    }

    if (oldState.currentTurn !== newState.currentTurn) {
      changes.push({
        type: 'turn_change',
        from: oldState.currentTurn,
        to: newState.currentTurn
      });
    }

    const oldMoves = oldState.moveHistory || [];
    const newMoves = newState.moveHistory || [];
    if (newMoves.length > oldMoves.length) {
      changes.push({
        type: 'move_added',
        move: newMoves[newMoves.length - 1]
      });
    }

    return changes;
  }

  /**
   * Validate state transition
   * @param {Object} fromState - Source state
   * @param {Object} toState - Target state
   * @returns {Object} Validation result
   */
  validateStateTransition(fromState, toState) {
    const errors = [];
    
    if (!fromState || !toState) {
      errors.push('Invalid state objects');
      return { isValid: false, errors };
    }

    // Validate turn progression
    const fromMoves = fromState.moveHistory || [];
    const toMoves = toState.moveHistory || [];
    
    if (toMoves.length < fromMoves.length) {
      errors.push('Move history cannot decrease');
    }

    if (toMoves.length === fromMoves.length + 1) {
      // Single move transition - validate turn change
      if (fromState.currentTurn === toState.currentTurn) {
        errors.push('Turn should change after a move');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Clean up old states
   * @param {number} maxStates - Maximum number of states to keep
   */
  cleanupOldStates(maxStates = 50) {
    if (this.positionHistory.length > maxStates) {
      this.positionHistory = this.positionHistory.slice(-maxStates);
    }
  }

  /**
   * Get memory usage information
   * @returns {Object} Memory usage statistics
   */
  getMemoryUsage() {
    const positionHistorySize = this.positionHistory.length;
    const metadataSize = Object.keys(this.gameMetadata).length;
    
    return {
      positionHistorySize,
      metadataSize,
      totalSize: positionHistorySize + metadataSize,
      estimatedBytes: JSON.stringify(this.positionHistory).length + JSON.stringify(this.gameMetadata).length
    };
  }

  /**
   * Optimize state storage
   */
  optimizeStateStorage() {
    // Remove duplicate positions
    this.positionHistory = [...new Set(this.positionHistory)];
    
    // Clean up old positions
    this.cleanupOldStates();
    
    // Update state version
    this.updateStateVersion();
  }

  /**
   * Validate castling rights consistency with current board state
   * @param {Array} board - Chess board state
   * @param {Object} castlingRights - Castling rights object
   * @returns {boolean} True if castling rights are consistent
   */
  validateCastlingRightsConsistency(board, castlingRights) {
    // Check white king and rooks
    const whiteKing = board[7][4];
    if (!whiteKing || whiteKing.type !== 'king' || whiteKing.color !== 'white') {
      // If king has moved, castling rights should be false
      if (castlingRights.white.kingside || castlingRights.white.queenside) {
        return false;
      }
    }

    const whiteKingsideRook = board[7][7];
    if (!whiteKingsideRook || whiteKingsideRook.type !== 'rook' || whiteKingsideRook.color !== 'white') {
      if (castlingRights.white.kingside) {
        return false;
      }
    }

    const whiteQueensideRook = board[7][0];
    if (!whiteQueensideRook || whiteQueensideRook.type !== 'rook' || whiteQueensideRook.color !== 'white') {
      if (castlingRights.white.queenside) {
        return false;
      }
    }

    // Check black king and rooks
    const blackKing = board[0][4];
    if (!blackKing || blackKing.type !== 'king' || blackKing.color !== 'black') {
      if (castlingRights.black.kingside || castlingRights.black.queenside) {
        return false;
      }
    }

    const blackKingsideRook = board[0][7];
    if (!blackKingsideRook || blackKingsideRook.type !== 'rook' || blackKingsideRook.color !== 'black') {
      if (castlingRights.black.kingside) {
        return false;
      }
    }

    const blackQueensideRook = board[0][0];
    if (!blackQueensideRook || blackQueensideRook.type !== 'rook' || blackQueensideRook.color !== 'black') {
      if (castlingRights.black.queenside) {
        return false;
      }
    }

    return true;
  }
}

module.exports = GameStateManager;