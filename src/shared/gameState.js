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