/**
 * Comprehensive Error Handling System for WebChess
 * Provides centralized error management with categorization, codes, and recovery mechanisms
 */

class ChessErrorHandler {
  constructor() {
    this.errorCategories = {
      FORMAT: 'FORMAT_ERROR',
      COORDINATE: 'COORDINATE_ERROR', 
      PIECE: 'PIECE_ERROR',
      MOVEMENT: 'MOVEMENT_ERROR',
      PATH: 'PATH_ERROR',
      RULE: 'RULE_ERROR',
      STATE: 'STATE_ERROR',
      CHECK: 'CHECK_ERROR',
      SYSTEM: 'SYSTEM_ERROR'
    };

    this.errorCodes = {
      // Format errors
      MALFORMED_MOVE: { category: 'FORMAT', severity: 'HIGH', recoverable: false },
      INVALID_FORMAT: { category: 'FORMAT', severity: 'HIGH', recoverable: false },
      MISSING_REQUIRED_FIELD: { category: 'FORMAT', severity: 'HIGH', recoverable: false },
      
      // Coordinate errors
      INVALID_COORDINATES: { category: 'COORDINATE', severity: 'HIGH', recoverable: false },
      OUT_OF_BOUNDS: { category: 'COORDINATE', severity: 'HIGH', recoverable: false },
      SAME_SQUARE: { category: 'COORDINATE', severity: 'MEDIUM', recoverable: false },
      
      // Piece errors
      NO_PIECE: { category: 'PIECE', severity: 'HIGH', recoverable: false },
      INVALID_PIECE: { category: 'PIECE', severity: 'HIGH', recoverable: true },
      INVALID_PIECE_TYPE: { category: 'PIECE', severity: 'HIGH', recoverable: true },
      INVALID_PIECE_COLOR: { category: 'PIECE', severity: 'HIGH', recoverable: true },
      WRONG_TURN: { category: 'PIECE', severity: 'MEDIUM', recoverable: false },
      
      // Movement errors
      INVALID_MOVEMENT: { category: 'MOVEMENT', severity: 'MEDIUM', recoverable: false },
      UNKNOWN_PIECE_TYPE: { category: 'MOVEMENT', severity: 'HIGH', recoverable: true },
      
      // Path errors
      PATH_BLOCKED: { category: 'PATH', severity: 'MEDIUM', recoverable: false },
      
      // Capture errors
      CAPTURE_OWN_PIECE: { category: 'RULE', severity: 'MEDIUM', recoverable: false },
      
      // Special move errors
      INVALID_CASTLING: { category: 'RULE', severity: 'MEDIUM', recoverable: false },
      INVALID_PROMOTION: { category: 'RULE', severity: 'MEDIUM', recoverable: true },
      INVALID_EN_PASSANT: { category: 'RULE', severity: 'MEDIUM', recoverable: false },
      INVALID_EN_PASSANT_TARGET: { category: 'RULE', severity: 'MEDIUM', recoverable: false },
      
      // Check/checkmate errors
      KING_IN_CHECK: { category: 'CHECK', severity: 'HIGH', recoverable: false },
      PINNED_PIECE_INVALID_MOVE: { category: 'CHECK', severity: 'HIGH', recoverable: false },
      DOUBLE_CHECK_KING_ONLY: { category: 'CHECK', severity: 'HIGH', recoverable: false },
      CHECK_NOT_RESOLVED: { category: 'CHECK', severity: 'HIGH', recoverable: false },
      
      // Game state errors
      GAME_NOT_ACTIVE: { category: 'STATE', severity: 'HIGH', recoverable: false },
      INVALID_STATUS: { category: 'STATE', severity: 'HIGH', recoverable: true },
      INVALID_STATUS_TRANSITION: { category: 'STATE', severity: 'HIGH', recoverable: true },
      MISSING_WINNER: { category: 'STATE', severity: 'MEDIUM', recoverable: true },
      INVALID_WINNER_FOR_DRAW: { category: 'STATE', severity: 'MEDIUM', recoverable: true },
      TURN_SEQUENCE_VIOLATION: { category: 'STATE', severity: 'HIGH', recoverable: true },
      TURN_HISTORY_MISMATCH: { category: 'STATE', severity: 'HIGH', recoverable: true },
      INVALID_COLOR: { category: 'STATE', severity: 'MEDIUM', recoverable: true },
      
      // System errors
      SYSTEM_ERROR: { category: 'SYSTEM', severity: 'CRITICAL', recoverable: true },
      VALIDATION_FAILURE: { category: 'SYSTEM', severity: 'HIGH', recoverable: true },
      STATE_CORRUPTION: { category: 'SYSTEM', severity: 'CRITICAL', recoverable: true }
    };

    this.userFriendlyMessages = {
      MALFORMED_MOVE: "Move must be an object",
      INVALID_FORMAT: "Move format is incorrect. Check your move structure.",
      MISSING_REQUIRED_FIELD: "Required move information is missing.",
      
      INVALID_COORDINATES: "Invalid coordinates",
      OUT_OF_BOUNDS: "Move goes outside the chess board.",
      SAME_SQUARE: "Source and destination squares cannot be the same.",
      
      NO_PIECE: "No piece at source square",
      INVALID_PIECE: "Invalid piece data detected.",
      INVALID_PIECE_TYPE: "Unknown piece type.",
      INVALID_PIECE_COLOR: "Invalid piece color.",
      WRONG_TURN: "Not your turn",
      
      INVALID_MOVEMENT: "This piece cannot move in that pattern.",
      UNKNOWN_PIECE_TYPE: "Unknown piece type encountered.",
      
      PATH_BLOCKED: "The path is blocked by other pieces.",
      
      CAPTURE_OWN_PIECE: "You cannot capture your own pieces.",
      
      INVALID_CASTLING: "Castling is not allowed in this position.",
      INVALID_PROMOTION: "Invalid pawn promotion piece selected.",
      INVALID_EN_PASSANT: "En passant capture is not valid here.",
      INVALID_EN_PASSANT_TARGET: "No valid piece to capture via en passant.",
      
      KING_IN_CHECK: "This move would put your king in check.",
      PINNED_PIECE_INVALID_MOVE: "This piece is pinned and cannot move there.",
      DOUBLE_CHECK_KING_ONLY: "In double check, only the king can move.",
      CHECK_NOT_RESOLVED: "This move does not resolve the check.",
      
      GAME_NOT_ACTIVE: "Game is not active",
      INVALID_STATUS: "Invalid game status.",
      INVALID_STATUS_TRANSITION: "Invalid game status change.",
      MISSING_WINNER: "Winner must be specified for this game ending.",
      INVALID_WINNER_FOR_DRAW: "Draw games should not have a winner.",
      TURN_SEQUENCE_VIOLATION: "Turn sequence is incorrect.",
      TURN_HISTORY_MISMATCH: "Turn does not match move history.",
      INVALID_COLOR: "Invalid player color specified.",
      
      SYSTEM_ERROR: "A system error occurred. Please try again.",
      VALIDATION_FAILURE: "Move validation failed unexpectedly.",
      STATE_CORRUPTION: "Game state corruption detected."
    };

    this.recoverySuggestions = {
      MALFORMED_MOVE: ["Ensure move has 'from' and 'to' properties with row/col coordinates"],
      INVALID_FORMAT: ["Check that coordinates are numbers", "Verify promotion piece is valid"],
      MISSING_REQUIRED_FIELD: ["Include both 'from' and 'to' squares", "Ensure coordinates have row and col"],
      
      INVALID_COORDINATES: ["Use coordinates between 0-7", "Check for typos in row/col values"],
      OUT_OF_BOUNDS: ["Verify coordinates are within 0-7 range"],
      SAME_SQUARE: ["Choose a different destination square"],
      
      NO_PIECE: ["Select a square that contains one of your pieces"],
      INVALID_PIECE: ["Refresh the game if piece data seems corrupted"],
      INVALID_PIECE_TYPE: ["Report this error - it may indicate a bug"],
      INVALID_PIECE_COLOR: ["Report this error - it may indicate a bug"],
      WRONG_TURN: ["Wait for your turn", "Check whose turn it is"],
      
      INVALID_MOVEMENT: ["Review how this piece can move", "Choose a valid destination"],
      UNKNOWN_PIECE_TYPE: ["Report this error - it indicates a system issue"],
      
      PATH_BLOCKED: ["Clear the path by moving blocking pieces first"],
      
      CAPTURE_OWN_PIECE: ["Target an opponent's piece or an empty square"],
      
      INVALID_CASTLING: ["Ensure king and rook haven't moved", "Check that path is clear", "Make sure you're not in check"],
      INVALID_PROMOTION: ["Choose queen, rook, bishop, or knight for promotion"],
      INVALID_EN_PASSANT: ["En passant must be played immediately after opponent's two-square pawn move"],
      INVALID_EN_PASSANT_TARGET: ["Verify the opponent pawn moved two squares last turn"],
      
      KING_IN_CHECK: ["Move the king to safety", "Block the attack", "Capture the attacking piece"],
      PINNED_PIECE_INVALID_MOVE: ["Move along the pin line", "Capture the pinning piece"],
      DOUBLE_CHECK_KING_ONLY: ["Only the king can move in double check"],
      CHECK_NOT_RESOLVED: ["Block the check", "Capture the attacking piece", "Move the king"],
      
      GAME_NOT_ACTIVE: ["Start a new game to continue playing"],
      INVALID_STATUS: ["Report this error - it indicates a system issue"],
      INVALID_STATUS_TRANSITION: ["Report this error - it indicates a system issue"],
      MISSING_WINNER: ["Report this error - it indicates a system issue"],
      INVALID_WINNER_FOR_DRAW: ["Report this error - it indicates a system issue"],
      TURN_SEQUENCE_VIOLATION: ["Refresh the game to sync state"],
      TURN_HISTORY_MISMATCH: ["Refresh the game to sync state"],
      INVALID_COLOR: ["Use 'white' or 'black' for player color"],
      
      SYSTEM_ERROR: ["Refresh the page", "Try the move again", "Report persistent issues"],
      VALIDATION_FAILURE: ["Try the move again", "Report if problem persists"],
      STATE_CORRUPTION: ["Refresh the game", "Report this critical error"]
    };

    this.errorStats = {
      totalErrors: 0,
      errorsByCategory: {},
      errorsByCode: {},
      recoveryAttempts: 0,
      successfulRecoveries: 0
    };
  }

  /**
   * Create a standardized error response
   * @param {string} errorCode - Error code from this.errorCodes
   * @param {string} customMessage - Optional custom message
   * @param {Array} errors - Array of specific error details
   * @param {Object} details - Additional error details
   * @param {Object} context - Context information for debugging
   * @returns {Object} Standardized error response
   */
  createError(errorCode, customMessage = null, errors = [], details = {}, context = {}) {
    if (!this.errorCodes[errorCode]) {
      console.warn(`Unknown error code: ${errorCode}`);
      errorCode = 'SYSTEM_ERROR';
    }

    const errorInfo = this.errorCodes[errorCode];
    const message = customMessage || this.userFriendlyMessages[errorCode] || 'An error occurred';
    
    // Update statistics
    this.updateErrorStats(errorCode, errorInfo.category);

    const errorResponse = {
      success: false,
      isValid: false,
      message: message,
      errorCode: errorCode,
      category: errorInfo.category,
      severity: errorInfo.severity,
      recoverable: errorInfo.recoverable,
      errors: Array.isArray(errors) ? errors : [errors].filter(Boolean),
      suggestions: this.recoverySuggestions[errorCode] || [],
      details: {
        ...details,
        timestamp: Date.now(),
        errorId: this.generateErrorId()
      },
      context: context,
      recovery: errorInfo.recoverable ? this.getRecoveryOptions(errorCode) : null
    };

    // Log error for debugging
    this.logError(errorResponse);

    return errorResponse;
  }

  /**
   * Create a success response
   * @param {string} message - Success message
   * @param {Object} data - Additional data
   * @param {Object} details - Additional details
   * @returns {Object} Standardized success response
   */
  createSuccess(message = 'Operation successful', data = {}, details = {}) {
    return {
      success: true,
      isValid: true,
      message: message,
      errorCode: null,
      category: null,
      severity: null,
      recoverable: null,
      errors: [],
      suggestions: [],
      details: {
        ...details,
        timestamp: Date.now()
      },
      data: data,
      recovery: null
    };
  }

  /**
   * Attempt to recover from an error
   * @param {string} errorCode - Error code to recover from
   * @param {Object} context - Context for recovery
   * @returns {Object} Recovery result
   */
  attemptRecovery(errorCode, context = {}) {
    this.errorStats.recoveryAttempts++;

    if (!this.errorCodes[errorCode] || !this.errorCodes[errorCode].recoverable) {
      return {
        success: false,
        message: 'Error is not recoverable',
        action: null
      };
    }

    const recoveryAction = this.getRecoveryAction(errorCode, context);
    
    if (recoveryAction.success) {
      this.errorStats.successfulRecoveries++;
    }

    return recoveryAction;
  }

  /**
   * Get recovery options for an error
   * @param {string} errorCode - Error code
   * @returns {Object} Recovery options
   */
  getRecoveryOptions(errorCode) {
    const suggestions = this.recoverySuggestions[errorCode] || [];
    
    return {
      automatic: this.canAutoRecover(errorCode),
      suggestions: suggestions,
      actions: this.getRecoveryActions(errorCode)
    };
  }

  /**
   * Get specific recovery actions for an error
   * @param {string} errorCode - Error code
   * @returns {Array} Array of recovery actions
   */
  getRecoveryActions(errorCode) {
    const actions = {
      INVALID_PIECE: ['refresh_board', 'reset_piece_data'],
      INVALID_PIECE_TYPE: ['validate_piece_data', 'reset_board'],
      INVALID_PIECE_COLOR: ['validate_piece_data', 'reset_board'],
      INVALID_STATUS: ['reset_game_status', 'validate_state'],
      INVALID_STATUS_TRANSITION: ['revert_status', 'validate_transition'],
      MISSING_WINNER: ['set_default_winner', 'validate_game_end'],
      INVALID_WINNER_FOR_DRAW: ['clear_winner', 'set_draw_status'],
      TURN_SEQUENCE_VIOLATION: ['recalculate_turn', 'sync_with_history'],
      TURN_HISTORY_MISMATCH: ['rebuild_turn_from_history', 'validate_history'],
      INVALID_COLOR: ['set_default_color', 'validate_color'],
      SYSTEM_ERROR: ['reset_state', 'reload_game'],
      VALIDATION_FAILURE: ['retry_validation', 'reset_validator'],
      STATE_CORRUPTION: ['restore_backup_state', 'reset_game']
    };

    return actions[errorCode] || ['manual_intervention'];
  }

  /**
   * Perform recovery action
   * @param {string} errorCode - Error code
   * @param {Object} context - Recovery context
   * @returns {Object} Recovery result
   */
  getRecoveryAction(errorCode, context) {
    switch (errorCode) {
      case 'INVALID_PIECE':
      case 'INVALID_PIECE_TYPE':
      case 'INVALID_PIECE_COLOR':
        return this.recoverPieceData(context);
        
      case 'INVALID_STATUS':
      case 'INVALID_STATUS_TRANSITION':
        return this.recoverGameStatus(context);
        
      case 'MISSING_WINNER':
      case 'INVALID_WINNER_FOR_DRAW':
        return this.recoverWinnerData(context);
        
      case 'TURN_SEQUENCE_VIOLATION':
      case 'TURN_HISTORY_MISMATCH':
        return this.recoverTurnSequence(context);
        
      case 'INVALID_COLOR':
        return this.recoverColorData(context);
        
      default:
        return {
          success: false,
          message: 'No specific recovery action available',
          action: 'manual_intervention'
        };
    }
  }

  /**
   * Recover piece data
   * @param {Object} context - Recovery context
   * @returns {Object} Recovery result
   */
  recoverPieceData(context) {
    if (context.piece && context.position) {
      // Attempt to restore valid piece data
      const validTypes = ['pawn', 'rook', 'knight', 'bishop', 'queen', 'king'];
      const validColors = ['white', 'black'];
      
      let recovered = { ...context.piece };
      
      if (!validTypes.includes(recovered.type)) {
        recovered.type = 'pawn'; // Default to pawn
      }
      
      if (!validColors.includes(recovered.color)) {
        recovered.color = 'white'; // Default to white
      }
      
      return {
        success: true,
        message: 'Piece data recovered with defaults',
        action: 'piece_data_restored',
        recoveredData: recovered
      };
    }
    
    return {
      success: false,
      message: 'Insufficient context for piece recovery',
      action: 'manual_intervention'
    };
  }

  /**
   * Recover game status
   * @param {Object} context - Recovery context
   * @returns {Object} Recovery result
   */
  recoverGameStatus(context) {
    const validStatuses = ['active', 'check', 'checkmate', 'stalemate', 'draw'];
    
    if (context.currentStatus && !validStatuses.includes(context.currentStatus)) {
      return {
        success: true,
        message: 'Game status reset to active',
        action: 'status_reset',
        recoveredData: { status: 'active', winner: null }
      };
    }
    
    return {
      success: false,
      message: 'Cannot recover game status',
      action: 'manual_intervention'
    };
  }

  /**
   * Recover winner data
   * @param {Object} context - Recovery context
   * @returns {Object} Recovery result
   */
  recoverWinnerData(context) {
    if (context.gameStatus === 'checkmate' && !context.winner) {
      // Determine winner based on current turn (opposite of current turn wins)
      const winner = context.currentTurn === 'white' ? 'black' : 'white';
      return {
        success: true,
        message: 'Winner determined from game context',
        action: 'winner_set',
        recoveredData: { winner: winner }
      };
    }
    
    if (['stalemate', 'draw'].includes(context.gameStatus) && context.winner) {
      return {
        success: true,
        message: 'Winner cleared for draw condition',
        action: 'winner_cleared',
        recoveredData: { winner: null }
      };
    }
    
    return {
      success: false,
      message: 'Cannot recover winner data',
      action: 'manual_intervention'
    };
  }

  /**
   * Recover turn sequence
   * @param {Object} context - Recovery context
   * @returns {Object} Recovery result
   */
  recoverTurnSequence(context) {
    if (context.moveHistory) {
      const expectedTurn = context.moveHistory.length % 2 === 0 ? 'white' : 'black';
      return {
        success: true,
        message: 'Turn recalculated from move history',
        action: 'turn_recalculated',
        recoveredData: { currentTurn: expectedTurn }
      };
    }
    
    return {
      success: false,
      message: 'Cannot recover turn sequence without move history',
      action: 'manual_intervention'
    };
  }

  /**
   * Recover color data
   * @param {Object} context - Recovery context
   * @returns {Object} Recovery result
   */
  recoverColorData(context) {
    const validColors = ['white', 'black'];
    
    if (context.color && !validColors.includes(context.color)) {
      return {
        success: true,
        message: 'Color reset to white (default)',
        action: 'color_reset',
        recoveredData: { color: 'white' }
      };
    }
    
    return {
      success: false,
      message: 'Cannot recover color data',
      action: 'manual_intervention'
    };
  }

  /**
   * Check if error can be automatically recovered
   * @param {string} errorCode - Error code
   * @returns {boolean} True if auto-recoverable
   */
  canAutoRecover(errorCode) {
    const autoRecoverableCodes = [
      'INVALID_PIECE', 'INVALID_PIECE_TYPE', 'INVALID_PIECE_COLOR',
      'INVALID_STATUS', 'MISSING_WINNER', 'INVALID_WINNER_FOR_DRAW',
      'TURN_SEQUENCE_VIOLATION', 'TURN_HISTORY_MISMATCH', 'INVALID_COLOR'
    ];
    
    return autoRecoverableCodes.includes(errorCode);
  }

  /**
   * Update error statistics
   * @param {string} errorCode - Error code
   * @param {string} category - Error category
   */
  updateErrorStats(errorCode, category) {
    this.errorStats.totalErrors++;
    
    if (!this.errorStats.errorsByCategory[category]) {
      this.errorStats.errorsByCategory[category] = 0;
    }
    this.errorStats.errorsByCategory[category]++;
    
    if (!this.errorStats.errorsByCode[errorCode]) {
      this.errorStats.errorsByCode[errorCode] = 0;
    }
    this.errorStats.errorsByCode[errorCode]++;
  }

  /**
   * Generate unique error ID
   * @returns {string} Unique error identifier
   */
  generateErrorId() {
    return 'err_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
  }

  /**
   * Log error for debugging
   * @param {Object} errorResponse - Error response object
   */
  logError(errorResponse) {
    if (errorResponse.severity === 'CRITICAL') {
      console.error('CRITICAL ERROR:', errorResponse);
    } else if (errorResponse.severity === 'HIGH') {
      console.warn('HIGH SEVERITY ERROR:', errorResponse.errorCode, errorResponse.message);
    } else {
      console.log('Error:', errorResponse.errorCode, errorResponse.message);
    }
  }

  /**
   * Get error statistics
   * @returns {Object} Error statistics
   */
  getErrorStats() {
    return {
      ...this.errorStats,
      recoveryRate: this.errorStats.recoveryAttempts > 0 
        ? (this.errorStats.successfulRecoveries / this.errorStats.recoveryAttempts * 100).toFixed(2) + '%'
        : '0%'
    };
  }

  /**
   * Reset error statistics
   */
  resetErrorStats() {
    this.errorStats = {
      totalErrors: 0,
      errorsByCategory: {},
      errorsByCode: {},
      recoveryAttempts: 0,
      successfulRecoveries: 0
    };
  }

  /**
   * Validate error response structure
   * @param {Object} errorResponse - Error response to validate
   * @returns {boolean} True if valid structure
   */
  validateErrorResponse(errorResponse) {
    const requiredFields = ['success', 'isValid', 'message', 'errorCode', 'category', 'severity', 'recoverable', 'errors', 'suggestions', 'details'];
    
    return requiredFields.every(field => errorResponse.hasOwnProperty(field));
  }
}

module.exports = ChessErrorHandler;