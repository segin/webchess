const GameStateManager = require('./gameState');
const ChessErrorHandler = require('./errorHandler');

class ChessGame {
  constructor() {
    this.board = this.initializeBoard();
    this.currentTurn = 'white';
    this.gameStatus = 'active';
    this.winner = null;
    this.moveHistory = [];
    this.castlingRights = {
      white: { kingside: true, queenside: true },
      black: { kingside: true, queenside: true }
    };
    this.enPassantTarget = null;
    this.halfMoveClock = 0;
    this.fullMoveNumber = 1;
    this.inCheck = false; // Track check status
    this.checkDetails = null; // Store detailed check information
    
    // Initialize game state manager
    this.stateManager = new GameStateManager();
    
    // Initialize error handler
    this.errorHandler = new ChessErrorHandler();
    
    // Enhanced game state tracking with metadata
    this.gameMetadata = this.stateManager.gameMetadata;
    
    // Position history for threefold repetition detection
    this.positionHistory = this.stateManager.positionHistory;
    this.positionHistory.push(this.stateManager.getFENPosition(
      this.board, this.currentTurn, this.castlingRights, this.enPassantTarget
    ));
    
    // Game state consistency tracking
    this.stateVersion = this.stateManager.stateVersion;
    this.lastValidatedState = null;
  }

  initializeBoard() {
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

  makeMove(move) {
    // Enhanced validation with detailed error reporting
    const validation = this.validateMove(move);
    if (!validation.isValid) {
      return validation; // Return the full error structure from error handler
    }

    const { from, to, promotion } = move;
    const piece = this.board[from.row][from.col];

    // Store original piece for game state update
    const originalPiece = { ...piece };

    // Update castling rights BEFORE executing the move (so we can check captured pieces)
    this.updateCastlingRights(from, to, originalPiece);
    
    // Execute the move
    this.executeMoveOnBoard(from, to, piece, promotion);
    
    // Update game state (pass original piece since board has changed)
    this.updateGameState(from, to, originalPiece);
    
    // Check for game end conditions
    this.checkGameEnd();
    
    return { success: true };
  }

  /**
   * Comprehensive move validation with detailed error reporting
   * @param {Object} move - The move to validate
   * @returns {Object} Validation result with detailed information
   */
  validateMove(move) {
    // Step 1: Format validation
    const formatValidation = this.validateMoveFormat(move);
    if (!formatValidation.isValid) {
      return formatValidation;
    }

    const { from, to, promotion } = move;

    // Step 2: Coordinate validation
    const coordinateValidation = this.validateCoordinates(from, to);
    if (!coordinateValidation.isValid) {
      return coordinateValidation;
    }

    // Step 3: Game state validation
    const gameStateValidation = this.validateGameState();
    if (!gameStateValidation.isValid) {
      return gameStateValidation;
    }

    // Step 4: Piece validation
    const pieceValidation = this.validatePieceAtSquare(from);
    if (!pieceValidation.isValid) {
      return pieceValidation;
    }

    const piece = this.board[from.row][from.col];

    // Step 5: Turn validation
    const turnValidation = this.validateTurn(piece);
    if (!turnValidation.isValid) {
      return turnValidation;
    }

    // Step 6: Movement pattern validation
    const movementValidation = this.validateMovementPattern(from, to, piece);
    if (!movementValidation.isValid) {
      return movementValidation;
    }

    // Step 7: Path validation (except for knights and castling)
    const isCastlingAttempt = piece.type === 'king' && Math.abs(to.col - from.col) === 2;
    if (piece.type !== 'knight' && !isCastlingAttempt) {
      const pathValidation = this.validatePath(from, to);
      if (!pathValidation.isValid) {
        return pathValidation;
      }
    }

    // Step 8: Capture validation (except for castling)
    if (!isCastlingAttempt) {
      const captureValidation = this.validateCapture(from, to, piece);
      if (!captureValidation.isValid) {
        return captureValidation;
      }
    }

    // Step 9: Special move validation
    const specialMoveValidation = this.validateSpecialMoves(from, to, piece, promotion);
    if (!specialMoveValidation.isValid) {
      return specialMoveValidation;
    }

    // Step 10: Check constraint validation
    const checkValidation = this.validateCheckConstraints(from, to, piece);
    if (!checkValidation.isValid) {
      return checkValidation;
    }

    return {
      isValid: true,
      message: 'Valid move',
      errorCode: null,
      errors: [],
      details: {
        formatValid: true,
        coordinatesValid: true,
        gameStateValid: true,
        pieceValid: true,
        turnValid: true,
        movementValid: true,
        pathValid: piece.type === 'knight' ? true : true,
        captureValid: true,
        specialRulesValid: true,
        checkValid: true
      }
    };
  }

  /**
   * Validate move format and structure
   * @param {Object} move - The move to validate
   * @returns {Object} Validation result
   */
  validateMoveFormat(move) {
    try {
      const errors = [];

      if (!move || typeof move !== 'object') {
        return this.errorHandler.createError(
          'MALFORMED_MOVE',
          null,
          ['Move parameter is null, undefined, or not an object'],
          { formatValid: false },
          { move: move }
        );
      }

      if (!move.from || typeof move.from !== 'object') {
        errors.push('Move must have a valid "from" square object');
      }

      if (!move.to || typeof move.to !== 'object') {
        errors.push('Move must have a valid "to" square object');
      }

      if (move.from && (typeof move.from.row !== 'number' || typeof move.from.col !== 'number')) {
        errors.push('From square must have numeric row and col properties');
      }

      if (move.to && (typeof move.to.row !== 'number' || typeof move.to.col !== 'number')) {
        errors.push('To square must have numeric row and col properties');
      }

      if (move.promotion && typeof move.promotion !== 'string') {
        errors.push('Promotion must be a string if provided');
      }

      if (move.promotion && !['queen', 'rook', 'bishop', 'knight'].includes(move.promotion)) {
        errors.push('Promotion must be one of: queen, rook, bishop, knight');
      }

      if (errors.length > 0) {
        return this.errorHandler.createError(
          'INVALID_FORMAT',
          null,
          errors,
          { formatValid: false },
          { move: move }
        );
      }

      return this.errorHandler.createSuccess('Move format is valid', {}, { formatValid: true });
    } catch (error) {
      return this.errorHandler.createError(
        'SYSTEM_ERROR',
        'Error during move format validation: ' + error.message,
        [error.message],
        { formatValid: false },
        { move: move, error: error.stack }
      );
    }
  }

  /**
   * Validate coordinate bounds
   * @param {Object} from - Source square
   * @param {Object} to - Destination square
   * @returns {Object} Validation result
   */
  validateCoordinates(from, to) {
    try {
      const errors = [];

      if (!this.isValidSquare(from)) {
        errors.push(`Invalid source coordinates: row ${from.row}, col ${from.col}`);
      }

      if (!this.isValidSquare(to)) {
        errors.push(`Invalid destination coordinates: row ${to.row}, col ${to.col}`);
      }

      if (from.row === to.row && from.col === to.col) {
        errors.push('Source and destination squares cannot be the same');
      }

      if (errors.length > 0) {
        return this.errorHandler.createError(
          'INVALID_COORDINATES',
          null,
          errors,
          { coordinatesValid: false },
          { from: from, to: to }
        );
      }

      return this.errorHandler.createSuccess('Coordinates are valid', {}, { coordinatesValid: true });
    } catch (error) {
      return this.errorHandler.createError(
        'SYSTEM_ERROR',
        'Error during coordinate validation: ' + error.message,
        [error.message],
        { coordinatesValid: false },
        { from: from, to: to, error: error.stack }
      );
    }
  }

  /**
   * Validate current game state allows moves
   * @returns {Object} Validation result
   */
  validateGameState() {
    try {
      if (this.gameStatus !== 'active') {
        return this.errorHandler.createError(
          'GAME_NOT_ACTIVE',
          null,
          [`Game status is ${this.gameStatus}, moves are not allowed`],
          { gameStateValid: false },
          { currentStatus: this.gameStatus }
        );
      }

      return this.errorHandler.createSuccess('Game state is valid', {}, { gameStateValid: true });
    } catch (error) {
      return this.errorHandler.createError(
        'SYSTEM_ERROR',
        'Error during game state validation: ' + error.message,
        [error.message],
        { gameStateValid: false },
        { gameStatus: this.gameStatus, error: error.stack }
      );
    }
  }

  /**
   * Validate piece exists at source square
   * @param {Object} from - Source square
   * @returns {Object} Validation result
   */
  validatePieceAtSquare(from) {
    try {
      const piece = this.board[from.row][from.col];

      if (!piece) {
        return this.errorHandler.createError(
          'NO_PIECE',
          null,
          [`No piece found at square row ${from.row}, col ${from.col}`],
          { pieceValid: false },
          { from: from, boardSquare: piece }
        );
      }

      if (!piece.type || !piece.color) {
        // Attempt recovery for corrupted piece data
        const recoveryResult = this.errorHandler.attemptRecovery('INVALID_PIECE', {
          piece: piece,
          position: from
        });

        if (recoveryResult.success) {
          // Apply recovered piece data
          this.board[from.row][from.col] = recoveryResult.recoveredData;
          console.log('Recovered piece data:', recoveryResult.recoveredData);
        }

        return this.errorHandler.createError(
          'INVALID_PIECE',
          null,
          ['Piece missing type or color information'],
          { pieceValid: false, recovery: recoveryResult },
          { from: from, piece: piece }
        );
      }

      const validTypes = ['pawn', 'rook', 'knight', 'bishop', 'queen', 'king'];
      const validColors = ['white', 'black'];

      if (!validTypes.includes(piece.type)) {
        // Attempt recovery for invalid piece type
        const recoveryResult = this.errorHandler.attemptRecovery('INVALID_PIECE_TYPE', {
          piece: piece,
          position: from
        });

        return this.errorHandler.createError(
          'INVALID_PIECE_TYPE',
          null,
          [`Invalid piece type: ${piece.type}`],
          { pieceValid: false, recovery: recoveryResult },
          { from: from, piece: piece, validTypes: validTypes }
        );
      }

      if (!validColors.includes(piece.color)) {
        // Attempt recovery for invalid piece color
        const recoveryResult = this.errorHandler.attemptRecovery('INVALID_PIECE_COLOR', {
          piece: piece,
          position: from
        });

        return this.errorHandler.createError(
          'INVALID_PIECE_COLOR',
          null,
          [`Invalid piece color: ${piece.color}`],
          { pieceValid: false, recovery: recoveryResult },
          { from: from, piece: piece, validColors: validColors }
        );
      }

      return this.errorHandler.createSuccess('Piece is valid', { piece: piece }, { pieceValid: true });
    } catch (error) {
      return this.errorHandler.createError(
        'SYSTEM_ERROR',
        'Error during piece validation: ' + error.message,
        [error.message],
        { pieceValid: false },
        { from: from, error: error.stack }
      );
    }
  }

  /**
   * Validate it's the correct player's turn
   * @param {Object} piece - The piece being moved
   * @returns {Object} Validation result
   */
  validateTurn(piece) {
    try {
      if (piece.color !== this.currentTurn) {
        return this.errorHandler.createError(
          'WRONG_TURN',
          null,
          [`It's ${this.currentTurn}'s turn, cannot move ${piece.color} piece`],
          { turnValid: false },
          { 
            pieceColor: piece.color, 
            currentTurn: this.currentTurn,
            moveHistory: this.moveHistory.length 
          }
        );
      }

      return this.errorHandler.createSuccess('Turn is valid', {}, { turnValid: true });
    } catch (error) {
      return this.errorHandler.createError(
        'SYSTEM_ERROR',
        'Error during turn validation: ' + error.message,
        [error.message],
        { turnValid: false },
        { piece: piece, currentTurn: this.currentTurn, error: error.stack }
      );
    }
  }

  /**
   * Validate piece movement pattern
   * @param {Object} from - Source square
   * @param {Object} to - Destination square
   * @param {Object} piece - The piece being moved
   * @returns {Object} Validation result
   */
  validateMovementPattern(from, to, piece) {
    let isValidMovement = false;

    switch (piece.type) {
      case 'pawn':
        isValidMovement = this.isValidPawnMove(from, to, piece);
        break;
      case 'rook':
        isValidMovement = this.isValidRookMove(from, to);
        break;
      case 'knight':
        isValidMovement = this.isValidKnightMove(from, to);
        break;
      case 'bishop':
        isValidMovement = this.isValidBishopMove(from, to);
        break;
      case 'queen':
        isValidMovement = this.isValidQueenMove(from, to);
        break;
      case 'king':
        isValidMovement = this.isValidKingMove(from, to, piece);
        break;
      default:
        return {
          isValid: false,
          message: 'Unknown piece type',
          errorCode: 'UNKNOWN_PIECE_TYPE',
          errors: [`Unknown piece type: ${piece.type}`],
          details: { movementValid: false }
        };
    }

    if (!isValidMovement) {
      return {
        isValid: false,
        message: `Invalid ${piece.type} movement`,
        errorCode: 'INVALID_MOVEMENT',
        errors: [`${piece.type} cannot move from row ${from.row}, col ${from.col} to row ${to.row}, col ${to.col}`],
        details: { movementValid: false }
      };
    }

    return { isValid: true };
  }

  /**
   * Validate path is clear for sliding pieces
   * @param {Object} from - Source square
   * @param {Object} to - Destination square
   * @returns {Object} Validation result
   */
  validatePath(from, to) {
    if (!this.isPathClear(from, to)) {
      return {
        isValid: false,
        message: 'Path is blocked',
        errorCode: 'PATH_BLOCKED',
        errors: ['There are pieces blocking the path between source and destination'],
        details: { pathValid: false }
      };
    }

    return { isValid: true };
  }

  /**
   * Validate capture rules
   * @param {Object} from - Source square
   * @param {Object} to - Destination square
   * @param {Object} piece - The piece being moved
   * @returns {Object} Validation result
   */
  validateCapture(from, to, piece) {
    const target = this.board[to.row][to.col];

    if (target && target.color === piece.color) {
      return {
        isValid: false,
        message: 'Cannot capture own piece',
        errorCode: 'CAPTURE_OWN_PIECE',
        errors: [`Cannot capture your own ${target.type} at row ${to.row}, col ${to.col}`],
        details: { captureValid: false }
      };
    }

    return { isValid: true };
  }

  /**
   * Validate special moves (castling, en passant, promotion)
   * @param {Object} from - Source square
   * @param {Object} to - Destination square
   * @param {Object} piece - The piece being moved
   * @param {string} promotion - Promotion piece type
   * @returns {Object} Validation result
   */
  validateSpecialMoves(from, to, piece, promotion) {
    // Castling validation
    if (piece.type === 'king' && Math.abs(to.col - from.col) === 2) {
      const castlingValidation = this.validateCastling(from, to, piece.color);
      if (!castlingValidation.isValid) {
        return {
          isValid: false,
          message: castlingValidation.message,
          errorCode: 'INVALID_CASTLING',
          errors: castlingValidation.errors,
          details: { specialRulesValid: false }
        };
      }
    }

    // Pawn promotion validation
    if (piece.type === 'pawn') {
      const promotionRow = piece.color === 'white' ? 0 : 7;
      
      // Check if pawn is moving to promotion row
      if (to.row === promotionRow) {
        if (promotion) {
          // Validate promotion piece type
          const validPromotions = ['queen', 'rook', 'bishop', 'knight'];
          if (!validPromotions.includes(promotion)) {
            return {
              isValid: false,
              message: 'Invalid promotion piece',
              errorCode: 'INVALID_PROMOTION',
              errors: [`Invalid promotion piece: ${promotion}. Must be one of: ${validPromotions.join(', ')}`],
              details: { specialRulesValid: false }
            };
          }
        }
        // If no promotion specified, it will default to queen in executeMoveOnBoard
      }
      
      // Validate en passant capture
      if (this.enPassantTarget && 
          to.row === this.enPassantTarget.row && 
          to.col === this.enPassantTarget.col) {
        // Ensure the move is a valid diagonal capture pattern
        const rowDiff = to.row - from.row;
        const colDiff = Math.abs(to.col - from.col);
        const direction = piece.color === 'white' ? -1 : 1;
        
        if (rowDiff !== direction || colDiff !== 1) {
          return {
            isValid: false,
            message: 'Invalid en passant capture',
            errorCode: 'INVALID_EN_PASSANT',
            errors: ['En passant capture must be a diagonal move to the en passant target square'],
            details: { specialRulesValid: false }
          };
        }
        
        // Verify there's an enemy pawn to capture
        const capturedPawnRow = from.row;
        const capturedPawnCol = to.col;
        const capturedPawn = this.board[capturedPawnRow][capturedPawnCol];
        
        if (!capturedPawn || 
            capturedPawn.type !== 'pawn' || 
            capturedPawn.color === piece.color) {
          return {
            isValid: false,
            message: 'Invalid en passant target',
            errorCode: 'INVALID_EN_PASSANT_TARGET',
            errors: ['No valid enemy pawn to capture via en passant'],
            details: { specialRulesValid: false }
          };
        }
      }
    }

    return { isValid: true };
  }

  /**
   * Enhanced check constraint validation with comprehensive self-check prevention
   * Validates that moves don't put own king in check and handles pinned pieces correctly
   * @param {Object} from - Source square
   * @param {Object} to - Destination square
   * @param {Object} piece - The piece being moved
   * @returns {Object} Validation result
   */
  validateCheckConstraints(from, to, piece) {
    const currentlyInCheck = this.isInCheck(piece.color);
    
    // If currently in check, validate that the move resolves the check FIRST
    // This handles special cases like double check before general check validation
    if (currentlyInCheck) {
      const resolutionValidation = this.validateCheckResolution(from, to, piece);
      if (!resolutionValidation.isValid) {
        return resolutionValidation;
      }
    }
    
    // Check if piece is pinned and validate pinned piece movement
    const pinInfo = this.isPiecePinned(from, piece.color);
    if (pinInfo.isPinned) {
      // Validate that pinned piece move is legal (stays on pin line or captures pinning piece)
      if (!this.isPinnedPieceMoveValid(from, to, pinInfo)) {
        return {
          isValid: false,
          message: 'Pinned piece cannot move without exposing king',
          errorCode: 'PINNED_PIECE_INVALID_MOVE',
          errors: [
            `This ${piece.type} is pinned by the enemy ${pinInfo.pinningPiece.type} and cannot move to this square`,
            `Pinned pieces can only move along the pin line or capture the pinning piece`
          ],
          details: { 
            checkValid: false,
            pinned: true,
            pinDirection: pinInfo.pinDirection,
            pinningPiece: pinInfo.pinningPiece
          }
        };
      }
    }
    
    // Check if move would put own king in check (comprehensive simulation)
    // Pass promotion info for pawn promotion moves
    const promotion = this.extractPromotionFromMove(from, to, piece);
    if (this.wouldBeInCheck(from, to, piece.color, piece, promotion)) {
      return {
        isValid: false,
        message: 'Move would put king in check',
        errorCode: 'KING_IN_CHECK',
        errors: ['This move would put your king in check'],
        details: { checkValid: false }
      };
    }

    return { isValid: true };
  }

  /**
   * Extract promotion information from a move for validation purposes
   * @param {Object} from - Source square
   * @param {Object} to - Destination square
   * @param {Object} piece - The piece being moved
   * @returns {string|null} Promotion piece type or null
   */
  extractPromotionFromMove(from, to, piece) {
    if (piece.type === 'pawn') {
      const promotionRow = piece.color === 'white' ? 0 : 7;
      if (to.row === promotionRow) {
        // For validation purposes, assume queen promotion if not specified
        // The actual promotion will be handled in the move execution
        return 'queen';
      }
    }
    return null;
  }

  /**
   * Validate that a move resolves check through blocking, capturing, or king movement
   * @param {Object} from - Source square
   * @param {Object} to - Destination square
   * @param {Object} piece - The piece being moved
   * @returns {Object} Validation result
   */
  validateCheckResolution(from, to, piece) {
    if (!this.checkDetails) {
      return { isValid: true }; // No check to resolve
    }
    
    const { attackingPieces, isDoubleCheck } = this.checkDetails;
    
    // In double check, only king moves are allowed
    if (isDoubleCheck && piece.type !== 'king') {
      return {
        isValid: false,
        message: 'Only king can move in double check',
        errorCode: 'DOUBLE_CHECK_KING_ONLY',
        errors: ['In double check, only the king can move'],
        details: { checkValid: false }
      };
    }
    
    // For single check, validate resolution method
    if (!isDoubleCheck && attackingPieces.length === 1) {
      const attacker = attackingPieces[0];
      const resolutionType = this.getCheckResolutionType(from, to, piece, attacker);
      
      if (resolutionType === 'invalid') {
        return {
          isValid: false,
          message: 'Move does not resolve check',
          errorCode: 'CHECK_NOT_RESOLVED',
          errors: ['This move does not resolve the check by capturing, blocking, or moving the king'],
          details: { checkValid: false }
        };
      }
    }
    
    return { isValid: true };
  }

  /**
   * Determine how a move resolves check (capture, block, or king move)
   * @param {Object} from - Source square
   * @param {Object} to - Destination square
   * @param {Object} piece - The piece being moved
   * @param {Object} attacker - The attacking piece details
   * @returns {string} Type of check resolution
   */
  getCheckResolutionType(from, to, piece, attacker) {
    const kingPos = this.findKing(piece.color);
    
    // King move - always valid if it gets out of check
    if (piece.type === 'king') {
      return 'king_move';
    }
    
    // Capture attacking piece
    if (to.row === attacker.position.row && to.col === attacker.position.col) {
      return 'capture_attacker';
    }
    
    // Block attack (only possible for sliding pieces: rook, bishop, queen)
    if (['rook', 'bishop', 'queen'].includes(attacker.piece.type)) {
      if (this.isBlockingSquare(to, attacker.position, kingPos)) {
        return 'block_attack';
      }
    }
    
    return 'invalid';
  }

  /**
   * Check if a square blocks an attack between attacker and king
   * @param {Object} blockSquare - Square to check for blocking
   * @param {Object} attackerPos - Position of attacking piece
   * @param {Object} kingPos - Position of king
   * @returns {boolean} True if square blocks the attack
   */
  isBlockingSquare(blockSquare, attackerPos, kingPos) {
    // Get the direction vector from attacker to king
    const rowDir = kingPos.row - attackerPos.row;
    const colDir = kingPos.col - attackerPos.col;
    
    // Normalize direction (get unit vector)
    const distance = Math.max(Math.abs(rowDir), Math.abs(colDir));
    if (distance === 0) return false;
    
    const rowStep = rowDir / distance;
    const colStep = colDir / distance;
    
    // Check if block square is on the attack path
    let currentRow = attackerPos.row + rowStep;
    let currentCol = attackerPos.col + colStep;
    
    while (currentRow !== kingPos.row || currentCol !== kingPos.col) {
      if (Math.round(currentRow) === blockSquare.row && Math.round(currentCol) === blockSquare.col) {
        return true;
      }
      currentRow += rowStep;
      currentCol += colStep;
    }
    
    return false;
  }

  isValidSquare(pos) {
    return pos && 
           typeof pos.row === 'number' && 
           typeof pos.col === 'number' &&
           Number.isInteger(pos.row) &&
           Number.isInteger(pos.col) &&
           pos.row >= 0 && pos.row < 8 && 
           pos.col >= 0 && pos.col < 8;
  }

  isValidMove(from, to, piece) {
    const target = this.board[to.row][to.col];
    
    // Cannot capture own piece
    if (target && target.color === piece.color) {
      return false;
    }

    switch (piece.type) {
      case 'pawn':
        return this.isValidPawnMove(from, to, piece);
      case 'rook':
        return this.isValidRookMove(from, to);
      case 'knight':
        return this.isValidKnightMove(from, to);
      case 'bishop':
        return this.isValidBishopMove(from, to);
      case 'queen':
        return this.isValidQueenMove(from, to);
      case 'king':
        return this.isValidKingMove(from, to, piece);
      default:
        return false;
    }
  }

  /**
   * Enhanced FIDE-compliant pawn movement validation
   * @param {Object} from - Source square
   * @param {Object} to - Destination square
   * @param {Object} piece - The pawn piece
   * @returns {boolean} True if the move is valid
   */
  isValidPawnMove(from, to, piece) {
    const direction = piece.color === 'white' ? -1 : 1;
    const startRow = piece.color === 'white' ? 6 : 1;
    const rowDiff = to.row - from.row;
    const colDiff = to.col - from.col;
    const absColDiff = Math.abs(colDiff);
    
    // Validate direction - pawns cannot move backward
    // White pawns move from higher row numbers to lower (6->5->4->3->2->1->0)
    // Black pawns move from lower row numbers to higher (1->2->3->4->5->6->7)
    if ((piece.color === 'white' && rowDiff > 0) || (piece.color === 'black' && rowDiff < 0)) {
      return false;
    }
    
    // Validate row movement is in correct direction
    if (rowDiff !== direction && rowDiff !== 2 * direction) {
      return false;
    }
    
    // Forward moves (no column change)
    if (colDiff === 0) {
      // Single square forward move
      if (rowDiff === direction) {
        return !this.board[to.row][to.col]; // Square must be empty
      }
      
      // Initial two-square move
      if (rowDiff === 2 * direction && from.row === startRow) {
        // Both squares must be empty
        return !this.board[from.row + direction][from.col] && !this.board[to.row][to.col];
      }
      
      return false;
    }
    
    // Diagonal moves (captures)
    if (absColDiff === 1 && rowDiff === direction) {
      const target = this.board[to.row][to.col];
      
      // Regular diagonal capture
      if (target && target.color !== piece.color) {
        return true;
      }
      
      // En passant capture
      if (this.enPassantTarget && 
          to.row === this.enPassantTarget.row && 
          to.col === this.enPassantTarget.col) {
        return true;
      }
      
      return false;
    }
    
    // Invalid move patterns
    return false;
  }

  /**
   * Enhanced FIDE-compliant rook movement validation
   * Rooks move horizontally and vertically only (path validation handled separately)
   * @param {Object} from - Source square
   * @param {Object} to - Destination square
   * @returns {boolean} True if the move pattern is valid
   */
  isValidRookMove(from, to) {
    // Validate coordinates are within bounds (should already be validated, but double-check)
    if (!this.isValidSquare(from) || !this.isValidSquare(to)) {
      return false;
    }
    
    // Rook moves only horizontally (same row) or vertically (same column)
    const isHorizontal = from.row === to.row && from.col !== to.col;
    const isVertical = from.col === to.col && from.row !== to.row;
    
    return isHorizontal || isVertical;
  }

  /**
   * Enhanced FIDE-compliant knight movement validation
   * Knights move in an L-shape: 2 squares in one direction and 1 square perpendicular
   * Knights can jump over other pieces
   * @param {Object} from - Source square
   * @param {Object} to - Destination square
   * @returns {boolean} True if the move is valid
   */
  isValidKnightMove(from, to) {
    // Validate coordinates are within bounds (should already be validated, but double-check)
    if (!this.isValidSquare(from) || !this.isValidSquare(to)) {
      return false;
    }
    
    const rowDiff = Math.abs(to.row - from.row);
    const colDiff = Math.abs(to.col - from.col);
    
    // Knight moves in L-shape: (2,1) or (1,2) pattern
    // Valid combinations: 2+1, 1+2 in any direction
    const isValidLShape = (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
    
    if (!isValidLShape) {
      return false;
    }
    
    // Knights can jump over pieces, so no path validation needed
    // Only need to check that destination is not occupied by own piece
    // (this is handled by validateCapture in the main validation pipeline)
    
    return true;
  }

  /**
   * Enhanced FIDE-compliant bishop movement validation
   * Bishops move diagonally only with proper slope calculation and path clearing
   * @param {Object} from - Source square
   * @param {Object} to - Destination square
   * @returns {boolean} True if the move pattern is valid
   */
  isValidBishopMove(from, to) {
    // Validate coordinates are within bounds (should already be validated, but double-check)
    if (!this.isValidSquare(from) || !this.isValidSquare(to)) {
      return false;
    }
    
    const rowDiff = Math.abs(to.row - from.row);
    const colDiff = Math.abs(to.col - from.col);
    
    // Bishop moves only diagonally - row and column differences must be equal
    // This ensures the move is along a diagonal line with slope of ±1
    if (rowDiff !== colDiff) {
      return false;
    }
    
    // Prevent zero movement (should already be caught by coordinate validation)
    if (rowDiff === 0) {
      return false;
    }
    
    // Path clearing validation is handled separately in the main validation pipeline
    // This method only validates the movement pattern
    return true;
  }

  /**
   * Enhanced FIDE-compliant queen movement validation
   * Queens combine both rook (horizontal/vertical) and bishop (diagonal) movement patterns
   * @param {Object} from - Source square
   * @param {Object} to - Destination square
   * @returns {boolean} True if the move pattern is valid
   */
  isValidQueenMove(from, to) {
    // Validate coordinates are within bounds (should already be validated, but double-check)
    if (!this.isValidSquare(from) || !this.isValidSquare(to)) {
      return false;
    }
    
    // Queen combines rook and bishop movement patterns
    // Valid if it's either a valid rook move OR a valid bishop move
    const isValidRookPattern = this.isValidRookMove(from, to);
    const isValidBishopPattern = this.isValidBishopMove(from, to);
    
    // Queen can move like a rook (horizontal/vertical) or like a bishop (diagonal)
    return isValidRookPattern || isValidBishopPattern;
  }

  /**
   * Enhanced FIDE-compliant king movement validation
   * Kings move one square in any of the eight directions (horizontal, vertical, diagonal)
   * Kings cannot move into check or out of bounds
   * @param {Object} from - Source square
   * @param {Object} to - Destination square
   * @param {Object} piece - The king piece
   * @returns {boolean} True if the move pattern is valid
   */
  isValidKingMove(from, to, piece) {
    // Validate coordinates are within bounds (should already be validated, but double-check)
    if (!this.isValidSquare(from) || !this.isValidSquare(to)) {
      return false;
    }
    
    const rowDiff = Math.abs(to.row - from.row);
    const colDiff = Math.abs(to.col - from.col);
    
    // Castling move (king moves 2 squares horizontally)
    // Always allow castling attempts to proceed to special moves validation
    // where detailed castling validation and error reporting occurs
    if (rowDiff === 0 && colDiff === 2) {
      return true; // Let special moves validation handle the detailed castling checks
    }
    
    // Normal king move - single square in any of the 8 directions
    // King can move one square horizontally, vertically, or diagonally
    if (rowDiff <= 1 && colDiff <= 1) {
      // Prevent zero movement (should already be caught by coordinate validation)
      if (rowDiff === 0 && colDiff === 0) {
        return false;
      }
      
      // King safety validation is handled separately in validateCheckConstraints
      // This method only validates the movement pattern
      return true;
    }
    
    // Invalid king move - more than one square in any direction
    return false;
  }

  isPathClear(from, to) {
    const rowStep = to.row === from.row ? 0 : (to.row - from.row) / Math.abs(to.row - from.row);
    const colStep = to.col === from.col ? 0 : (to.col - from.col) / Math.abs(to.col - from.col);
    
    let row = from.row + rowStep;
    let col = from.col + colStep;
    
    while (row !== to.row || col !== to.col) {
      if (this.board[row][col]) {
        return false;
      }
      row += rowStep;
      col += colStep;
    }
    
    return true;
  }

  /**
   * Comprehensive FIDE-compliant castling validation
   * Validates all castling requirements including rights, path clearing, and check constraints
   * @param {Object} from - King's source square
   * @param {Object} to - King's destination square
   * @param {string} color - Color of the king attempting to castle
   * @returns {boolean} True if castling is valid
   */
  canCastle(from, to, color) {
    // Validate basic parameters
    if (!this.isValidSquare(from) || !this.isValidSquare(to) || !color) {
      return false;
    }
    
    const row = color === 'white' ? 7 : 0;
    const kingside = to.col > from.col;
    
    // Validate king is on correct starting square
    if (from.row !== row || from.col !== 4) {
      return false;
    }
    
    // Validate king destination is correct for castling
    const expectedKingDestination = kingside ? 6 : 2;
    if (to.row !== row || to.col !== expectedKingDestination) {
      return false;
    }
    
    // Check castling rights - king and rook must not have moved
    if (!this.castlingRights[color][kingside ? 'kingside' : 'queenside']) {
      return false;
    }
    
    // Verify rook is still in correct position
    const rookCol = kingside ? 7 : 0;
    const rook = this.board[row][rookCol];
    if (!rook || rook.type !== 'rook' || rook.color !== color) {
      return false;
    }
    
    // Check if king is currently in check (cannot castle while in check)
    if (this.isInCheck(color)) {
      return false;
    }
    
    // Check if path between king and rook is clear
    const step = kingside ? 1 : -1;
    const pathStart = from.col + step;
    const pathEnd = rookCol;
    
    for (let col = pathStart; col !== pathEnd; col += step) {
      if (this.board[row][col]) {
        return false; // Path is blocked
      }
    }
    
    // Check if king passes through or ends up in check
    // King must not pass through check or end up in check
    const squaresToCheck = kingside ? [5, 6] : [2, 3]; // Squares king passes through/ends on
    
    for (const col of squaresToCheck) {
      if (this.isSquareUnderAttack(row, col, color)) {
        return false; // King would pass through or end up in check
      }
    }
    
    return true;
  }

  /**
   * Enhanced castling validation with detailed error reporting
   * Provides specific reasons why castling is invalid
   * @param {Object} from - King's source square
   * @param {Object} to - King's destination square
   * @param {string} color - Color of the king attempting to castle
   * @returns {Object} Detailed validation result
   */
  validateCastling(from, to, color) {
    const errors = [];
    
    // Validate basic parameters
    if (!this.isValidSquare(from) || !this.isValidSquare(to) || !color) {
      return {
        isValid: false,
        message: 'Invalid castling parameters',
        errors: ['Invalid coordinates or color for castling']
      };
    }
    
    const row = color === 'white' ? 7 : 0;
    const kingside = to.col > from.col;
    const castlingSide = kingside ? 'kingside' : 'queenside';
    
    // Validate king is on correct starting square
    if (from.row !== row || from.col !== 4) {
      errors.push(`King must be on starting square (row ${row}, col 4) to castle`);
    }
    
    // Validate king destination is correct for castling
    const expectedKingDestination = kingside ? 6 : 2;
    if (to.row !== row || to.col !== expectedKingDestination) {
      errors.push(`Invalid king destination for ${castlingSide} castling`);
    }
    
    // Check castling rights
    if (!this.castlingRights[color][castlingSide]) {
      if (castlingSide === 'kingside') {
        errors.push('Kingside castling rights lost (king or kingside rook has moved)');
      } else {
        errors.push('Queenside castling rights lost (king or queenside rook has moved)');
      }
    }
    
    // Verify rook is still in correct position
    const rookCol = kingside ? 7 : 0;
    const rook = this.board[row][rookCol];
    if (!rook || rook.type !== 'rook' || rook.color !== color) {
      errors.push(`${castlingSide} rook is missing or has been moved`);
    }
    
    // Check if king is currently in check
    if (this.isInCheck(color)) {
      errors.push('Cannot castle while in check');
    }
    
    // Check if path between king and rook is clear
    const step = kingside ? 1 : -1;
    const pathStart = from.col + step;
    const pathEnd = rookCol;
    
    for (let col = pathStart; col !== pathEnd; col += step) {
      if (this.board[row][col]) {
        errors.push(`Path blocked by piece at row ${row}, col ${col}`);
        break; // Only report first blocking piece
      }
    }
    
    // Check if king passes through or ends up in check
    const squaresToCheck = kingside ? [5, 6] : [2, 3];
    
    for (const col of squaresToCheck) {
      if (this.isSquareUnderAttack(row, col, color)) {
        if (col === to.col) {
          errors.push(`King would be in check at destination square (row ${row}, col ${col})`);
        } else {
          errors.push(`King would pass through check at square (row ${row}, col ${col})`);
        }
      }
    }
    
    if (errors.length > 0) {
      return {
        isValid: false,
        message: `Invalid ${castlingSide} castling`,
        errors: errors
      };
    }
    
    return {
      isValid: true,
      message: `Valid ${castlingSide} castling`,
      errors: []
    };
  }

  /**
   * Execute the move on the board
   * @param {Object} from - Source square
   * @param {Object} to - Destination square
   * @param {Object} piece - The piece being moved
   * @param {string} promotion - Promotion piece type (for pawn promotion)
   */
  executeMoveOnBoard(from, to, piece, promotion) {
    const target = this.board[to.row][to.col];
    let capturedPiece = target;
    let isEnPassant = false;
    let isCastling = false;
    
    // Handle en passant capture
    if (piece.type === 'pawn' && this.enPassantTarget && 
        to.row === this.enPassantTarget.row && to.col === this.enPassantTarget.col) {
      // Remove the captured pawn (which is on the same row as the moving pawn)
      const capturedPawnRow = from.row;
      const capturedPawnCol = to.col;
      capturedPiece = this.board[capturedPawnRow][capturedPawnCol];
      this.board[capturedPawnRow][capturedPawnCol] = null;
      isEnPassant = true;
    }
    
    // Handle castling
    if (piece.type === 'king' && Math.abs(to.col - from.col) === 2) {
      const rookFromCol = to.col > from.col ? 7 : 0;
      const rookToCol = to.col > from.col ? 5 : 3;
      const rook = this.board[from.row][rookFromCol];
      this.board[from.row][rookToCol] = rook;
      this.board[from.row][rookFromCol] = null;
      isCastling = true;
    }
    
    // Execute the basic move
    this.board[to.row][to.col] = piece;
    this.board[from.row][from.col] = null;
    
    // Handle pawn promotion
    let promotionPiece = null;
    if (piece.type === 'pawn') {
      const promotionRow = piece.color === 'white' ? 0 : 7;
      if (to.row === promotionRow) {
        // Default to queen if no promotion specified
        promotionPiece = promotion || 'queen';
        
        // Validate promotion piece (should already be validated, but double-check)
        const validPromotions = ['queen', 'rook', 'bishop', 'knight'];
        if (!validPromotions.includes(promotionPiece)) {
          promotionPiece = 'queen'; // Fallback to queen
        }
        
        // Replace pawn with promoted piece
        this.board[to.row][to.col] = {
          type: promotionPiece,
          color: piece.color
        };
      }
    }
    
    // Record move in history with enhanced tracking
    const moveData = {
      from: { row: from.row, col: from.col },
      to: { row: to.row, col: to.col },
      piece: piece.type,
      color: piece.color,
      captured: capturedPiece ? capturedPiece.type : null,
      promotion: promotionPiece,
      castling: isCastling ? (to.col > from.col ? 'kingside' : 'queenside') : null,
      enPassant: isEnPassant,
      timestamp: Date.now()
    };
    
    // Use state manager to add enhanced move to history
    this.stateManager.addMoveToHistory(
      this.moveHistory, 
      moveData, 
      this.fullMoveNumber, 
      this.getGameStateForSnapshot()
    );
  }

  /**
   * Comprehensive castling rights management system
   * Updates castling rights when king or rooks move, or when rooks are captured
   * @param {Object} from - Source square
   * @param {Object} to - Destination square
   * @param {Object} piece - The piece that moved
   */
  /**
   * Enhanced castling rights management system with comprehensive tracking
   * Updates castling rights automatically when king or rooks move or are captured
   * @param {Object} from - Source square
   * @param {Object} to - Destination square
   * @param {Object} piece - The piece that moved
   */
  updateCastlingRights(from, to, piece) {
    // Store original rights for comparison
    const originalRights = JSON.parse(JSON.stringify(this.castlingRights));
    
    // Check if a rook was captured BEFORE the move (affects opponent's castling rights)
    const capturedPiece = this.board[to.row][to.col];
    if (capturedPiece && capturedPiece.type === 'rook') {
      this.updateCastlingRightsForCapturedRook(to, capturedPiece);
    }
    
    // If king moves, lose all castling rights for that color
    if (piece.type === 'king') {
      this.updateCastlingRightsForKingMove(piece.color);
      return;
    }
    
    // If rook moves from starting position, lose castling rights for that side
    if (piece.type === 'rook') {
      this.updateCastlingRightsForRookMove(from, piece);
    }
    
    // Track castling rights changes for debugging and validation
    this.trackCastlingRightsChanges(originalRights, this.castlingRights, { from, to, piece });
  }

  /**
   * Update castling rights when a rook is captured
   * @param {Object} captureSquare - Square where rook was captured
   * @param {Object} capturedRook - The captured rook piece
   */
  updateCastlingRightsForCapturedRook(captureSquare, capturedRook) {
    const capturedColor = capturedRook.color;
    const rookStartingRow = capturedColor === 'white' ? 7 : 0;
    
    // Only lose castling rights if rook was captured on its starting square
    if (captureSquare.row === rookStartingRow) {
      if (captureSquare.col === 0) {
        // Queenside rook captured
        this.castlingRights[capturedColor].queenside = false;
      } else if (captureSquare.col === 7) {
        // Kingside rook captured
        this.castlingRights[capturedColor].kingside = false;
      }
    }
  }

  /**
   * Update castling rights when king moves
   * @param {string} color - Color of the king that moved
   */
  updateCastlingRightsForKingMove(color) {
    // King moving loses all castling rights for that color
    this.castlingRights[color].kingside = false;
    this.castlingRights[color].queenside = false;
  }

  /**
   * Update castling rights when rook moves
   * @param {Object} from - Source square of rook move
   * @param {Object} rook - The rook piece that moved
   */
  updateCastlingRightsForRookMove(from, rook) {
    const startingRow = rook.color === 'white' ? 7 : 0;
    
    // Only lose castling rights if rook is moving FROM its starting position
    if (from.row === startingRow) {
      if (from.col === 0) {
        // Queenside rook moved from starting position
        this.castlingRights[rook.color].queenside = false;
      } else if (from.col === 7) {
        // Kingside rook moved from starting position
        this.castlingRights[rook.color].kingside = false;
      }
    }
  }

  /**
   * Track castling rights changes for debugging and validation
   * @param {Object} originalRights - Rights before the move
   * @param {Object} newRights - Rights after the move
   * @param {Object} moveInfo - Information about the move
   */
  trackCastlingRightsChanges(originalRights, newRights, moveInfo) {
    // Only log if there were actual changes
    const hasChanges = JSON.stringify(originalRights) !== JSON.stringify(newRights);
    
    if (hasChanges && this.debugMode) {
      console.log('Castling rights updated:', {
        move: moveInfo,
        before: originalRights,
        after: newRights
      });
    }
  }

  /**
   * Validate castling rights for both kingside and queenside castling
   * @param {string} color - Color to validate castling rights for
   * @param {string} side - 'kingside' or 'queenside'
   * @returns {Object} Validation result with detailed information
   */
  validateCastlingRightsForSide(color, side) {
    if (!['kingside', 'queenside'].includes(side)) {
      return {
        isValid: false,
        message: 'Invalid castling side',
        errors: [`Side must be 'kingside' or 'queenside', got: ${side}`]
      };
    }

    if (!['white', 'black'].includes(color)) {
      return {
        isValid: false,
        message: 'Invalid color',
        errors: [`Color must be 'white' or 'black', got: ${color}`]
      };
    }

    const hasRights = this.castlingRights[color][side];
    const errors = [];
    
    if (!hasRights) {
      errors.push(`${color} has lost ${side} castling rights`);
    }

    // Validate that king and rook are in correct positions
    const row = color === 'white' ? 7 : 0;
    const king = this.board[row][4];
    
    if (!king || king.type !== 'king' || king.color !== color) {
      errors.push(`${color} king is not on starting square`);
    }

    const rookCol = side === 'kingside' ? 7 : 0;
    const rook = this.board[row][rookCol];
    
    if (!rook || rook.type !== 'rook' || rook.color !== color) {
      errors.push(`${color} ${side} rook is not on starting square`);
    }

    return {
      isValid: errors.length === 0,
      message: errors.length === 0 ? `${color} ${side} castling rights are valid` : `${color} ${side} castling rights validation failed`,
      errors: errors,
      hasRights: hasRights,
      kingInPosition: king && king.type === 'king' && king.color === color,
      rookInPosition: rook && rook.type === 'rook' && rook.color === color
    };
  }

  /**
   * Get comprehensive castling rights status for both colors
   * @returns {Object} Complete castling rights information
   */
  getCastlingRightsStatus() {
    return {
      white: {
        kingside: {
          hasRights: this.castlingRights.white.kingside,
          validation: this.validateCastlingRightsForSide('white', 'kingside')
        },
        queenside: {
          hasRights: this.castlingRights.white.queenside,
          validation: this.validateCastlingRightsForSide('white', 'queenside')
        }
      },
      black: {
        kingside: {
          hasRights: this.castlingRights.black.kingside,
          validation: this.validateCastlingRightsForSide('black', 'kingside')
        },
        queenside: {
          hasRights: this.castlingRights.black.queenside,
          validation: this.validateCastlingRightsForSide('black', 'queenside')
        }
      }
    };
  }

  /**
   * Get current game state for snapshot purposes
   * @returns {Object} Game state snapshot
   */
  /**
   * Get current game state for snapshot purposes with proper serialization
   * @returns {Object} Game state snapshot with castling rights persistence
   */
  getGameStateForSnapshot() {
    return {
      board: this.board,
      currentTurn: this.currentTurn,
      gameStatus: this.gameStatus,
      winner: this.winner,
      inCheck: this.inCheck,
      checkDetails: this.checkDetails,
      castlingRights: this.serializeCastlingRights(),
      enPassantTarget: this.enPassantTarget,
      halfMoveClock: this.halfMoveClock,
      fullMoveNumber: this.fullMoveNumber,
      moveHistory: this.moveHistory
    };
  }

  /**
   * Serialize castling rights with proper structure for persistence
   * @returns {Object} Serialized castling rights
   */
  serializeCastlingRights() {
    return {
      white: {
        kingside: Boolean(this.castlingRights.white.kingside),
        queenside: Boolean(this.castlingRights.white.queenside)
      },
      black: {
        kingside: Boolean(this.castlingRights.black.kingside),
        queenside: Boolean(this.castlingRights.black.queenside)
      }
    };
  }

  /**
   * Enhanced game state update after a move with comprehensive tracking
   * @param {Object} from - Source square
   * @param {Object} to - Destination square
   * @param {Object} piece - The piece that moved
   */
  updateGameState(from, to, piece) {
    // Validate turn sequence before updating - piece.color should match current turn
    if (this.currentTurn !== piece.color) {
      throw new Error(`Turn sequence validation failed: expected ${piece.color}, but it's ${this.currentTurn}'s turn`);
    }

    // Update en passant target
    if (piece.type === 'pawn' && Math.abs(to.row - from.row) === 2) {
      // Check if pawn moved two squares from starting position
      const startingRow = piece.color === 'white' ? 6 : 1;
      if (from.row === startingRow) {
        // Pawn moved two squares from starting position, set en passant target
        this.enPassantTarget = {
          row: from.row + (to.row - from.row) / 2,
          col: from.col
        };
      } else {
        // Pawn moved two squares but not from starting position, clear target
        this.enPassantTarget = null;
      }
    } else {
      // Clear en passant target after any other move
      this.enPassantTarget = null;
    }
    
    // Castling rights are now updated before move execution in makeMove
    
    // Update half-move clock (for 50-move rule)
    const capturedPiece = this.board[to.row][to.col];
    if (piece.type === 'pawn' || capturedPiece) {
      this.halfMoveClock = 0; // Reset on pawn move or capture
    } else {
      this.halfMoveClock++;
    }
    
    // Switch turns with validation
    const previousTurn = this.currentTurn;
    this.currentTurn = this.currentTurn === 'white' ? 'black' : 'white';
    
    // Update full move number (increments after black's move)
    if (this.currentTurn === 'white') {
      this.fullMoveNumber++;
    }
    
    // Update state version for consistency tracking
    this.stateManager.stateVersion++;
    this.stateVersion = this.stateManager.stateVersion;
    
    // Validate state consistency after update
    const consistencyCheck = this.stateManager.validateGameStateConsistency(this.getGameStateForSnapshot());
    if (!consistencyCheck.success) {
      // Log warnings but don't throw errors for warnings
      if (consistencyCheck.errors.length > 0) {
        console.warn('Game state consistency errors after move:', consistencyCheck.errors);
      }
      if (consistencyCheck.warnings.length > 0) {
        console.warn('Game state consistency warnings after move:', consistencyCheck.warnings);
      }
    }
  }

  /**
   * Enhanced game end detection with comprehensive check status tracking
   * Updates game status and winner based on check, checkmate, and stalemate conditions
   */
  checkGameEnd() {
    const currentColor = this.currentTurn;
    
    // Check if current player is in check
    const inCheck = this.isInCheck(currentColor);
    
    // Update check status in game state
    this.inCheck = inCheck;
    
    let newStatus = 'active';
    let winner = null;
    
    if (inCheck) {
      // Player is in check - check for checkmate (without calling isInCheck again)
      if (this.isCheckmateGivenCheckStatus(currentColor, inCheck)) {
        newStatus = 'checkmate';
        winner = currentColor === 'white' ? 'black' : 'white';
      } else {
        // If not checkmate, game continues in check status
        newStatus = 'check';
      }
    } else {
      // Player is not in check - check for stalemate (without calling isInCheck again)
      if (this.isStalemateGivenCheckStatus(currentColor, inCheck)) {
        newStatus = 'stalemate';
        winner = null;
      } else {
        // Game continues normally
        newStatus = 'active';
      }
    }
    
    // Use state manager to update status with validation
    const statusUpdate = this.stateManager.updateGameStatus(this.gameStatus, newStatus, winner);
    if (statusUpdate.success) {
      this.gameStatus = newStatus;
      this.winner = winner;
    } else {
      console.warn('Failed to update game status:', statusUpdate.message);
    }
  }

  /**
   * Enhanced checkmate detection with comprehensive legal move generation
   * Identifies when a king is in check with no legal escape moves
   * @param {string} color - Color to check for checkmate
   * @returns {boolean} True if checkmate
   */
  isCheckmate(color) {
    return this.isInCheck(color) && !this.hasValidMoves(color);
  }

  /**
   * Enhanced stalemate detection
   * Identifies when a player has no legal moves but is not in check
   * @param {string} color - Color to check for stalemate
   * @returns {boolean} True if stalemate
   */
  isStalemate(color) {
    return !this.isInCheck(color) && !this.hasValidMoves(color);
  }

  /**
   * Check for checkmate without calling isInCheck again (to preserve check details)
   * @param {string} color - Color to check for checkmate
   * @param {boolean} inCheck - Whether the color is currently in check
   * @returns {boolean} True if checkmate
   */
  isCheckmateGivenCheckStatus(color, inCheck) {
    return inCheck && !this.hasValidMoves(color);
  }

  /**
   * Check for stalemate without calling isInCheck again (to preserve check details)
   * @param {string} color - Color to check for stalemate
   * @param {boolean} inCheck - Whether the color is currently in check
   * @returns {boolean} True if stalemate
   */
  isStalemateGivenCheckStatus(color, inCheck) {
    return !inCheck && !this.hasValidMoves(color);
  }

  /**
   * Comprehensive stalemate detection with detailed analysis
   * Provides detailed information about why a position is or isn't stalemate
   * @param {string} color - Color to check for stalemate
   * @returns {Object} Detailed stalemate analysis
   */
  analyzeStalematePosition(color) {
    const inCheck = this.isInCheck(color);
    const legalMoves = this.getAllLegalMoves(color);
    
    return {
      isStalemate: !inCheck && legalMoves.length === 0,
      inCheck: inCheck,
      legalMovesCount: legalMoves.length,
      legalMoves: legalMoves,
      analysis: {
        kingPosition: this.findKing(color),
        kingMoves: this.getKingLegalMoves(color),
        pieceMoves: this.getPieceLegalMoves(color),
        blockedByCheck: inCheck,
        hasEscapeMoves: legalMoves.length > 0
      }
    };
  }

  /**
   * Get all legal moves for a color
   * @param {string} color - Color to get moves for
   * @returns {Array} Array of legal move objects
   */
  getAllLegalMoves(color) {
    const legalMoves = [];
    
    // Iterate through all squares to find pieces of the given color
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = this.board[row][col];
        
        // Skip empty squares and opponent pieces
        if (!piece || piece.color !== color) {
          continue;
        }
        
        // Check all possible destination squares for this piece
        for (let toRow = 0; toRow < 8; toRow++) {
          for (let toCol = 0; toCol < 8; toCol++) {
            const from = { row, col };
            const to = { row: toRow, col: toCol };
            
            // Skip same square
            if (row === toRow && col === toCol) {
              continue;
            }
            
            // Check if this move is valid using the comprehensive validation
            const move = { from, to };
            const validation = this.validateMove(move);
            
            if (validation.isValid) {
              legalMoves.push({
                from: from,
                to: to,
                piece: piece.type,
                color: piece.color,
                isCapture: this.board[toRow][toCol] !== null,
                notation: this.getMoveNotation(from, to, piece)
              });
            }
          }
        }
      }
    }
    
    return legalMoves;
  }

  /**
   * Get legal moves specifically for the king
   * @param {string} color - Color of the king
   * @returns {Array} Array of legal king moves
   */
  getKingLegalMoves(color) {
    const kingPos = this.findKing(color);
    if (!kingPos) return [];
    
    const legalMoves = [];
    const directions = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1],  [1, 0],  [1, 1]
    ];
    
    for (const [rowDir, colDir] of directions) {
      const to = {
        row: kingPos.row + rowDir,
        col: kingPos.col + colDir
      };
      
      if (this.isValidSquare(to)) {
        const move = { from: kingPos, to };
        const validation = this.validateMove(move);
        
        if (validation.isValid) {
          legalMoves.push({
            from: kingPos,
            to: to,
            piece: 'king',
            color: color,
            isCapture: this.board[to.row][to.col] !== null
          });
        }
      }
    }
    
    // Check castling moves
    if (!this.isInCheck(color)) {
      // Kingside castling
      const kingsideTo = { row: kingPos.row, col: kingPos.col + 2 };
      const kingsideMove = { from: kingPos, to: kingsideTo };
      if (this.validateMove(kingsideMove).isValid) {
        legalMoves.push({
          from: kingPos,
          to: kingsideTo,
          piece: 'king',
          color: color,
          isCastling: true,
          castlingSide: 'kingside'
        });
      }
      
      // Queenside castling
      const queensideTo = { row: kingPos.row, col: kingPos.col - 2 };
      const queensideMove = { from: kingPos, to: queensideTo };
      if (this.validateMove(queensideMove).isValid) {
        legalMoves.push({
          from: kingPos,
          to: queensideTo,
          piece: 'king',
          color: color,
          isCastling: true,
          castlingSide: 'queenside'
        });
      }
    }
    
    return legalMoves;
  }

  /**
   * Get legal moves for all non-king pieces
   * @param {string} color - Color to get moves for
   * @returns {Array} Array of legal moves for non-king pieces
   */
  getPieceLegalMoves(color) {
    const legalMoves = [];
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = this.board[row][col];
        
        // Skip empty squares, opponent pieces, and kings
        if (!piece || piece.color !== color || piece.type === 'king') {
          continue;
        }
        
        // Check all possible destination squares for this piece
        for (let toRow = 0; toRow < 8; toRow++) {
          for (let toCol = 0; toCol < 8; toCol++) {
            const from = { row, col };
            const to = { row: toRow, col: toCol };
            
            // Skip same square
            if (row === toRow && col === toCol) {
              continue;
            }
            
            const move = { from, to };
            const validation = this.validateMove(move);
            
            if (validation.isValid) {
              legalMoves.push({
                from: from,
                to: to,
                piece: piece.type,
                color: piece.color,
                isCapture: this.board[toRow][toCol] !== null
              });
            }
          }
        }
      }
    }
    
    return legalMoves;
  }

  /**
   * Check if a position is a classic stalemate pattern
   * @param {string} color - Color to check
   * @returns {Object} Information about stalemate pattern
   */
  identifyStalematePattern(color) {
    const analysis = this.analyzeStalematePosition(color);
    
    if (!analysis.isStalemate) {
      return { isClassicPattern: false, pattern: null };
    }
    
    const kingPos = analysis.analysis.kingPosition;
    const opponentColor = color === 'white' ? 'black' : 'white';
    
    // Check for corner stalemate patterns
    if (this.isKingInCorner(kingPos)) {
      return {
        isClassicPattern: true,
        pattern: 'corner_stalemate',
        description: 'King trapped in corner with no escape squares'
      };
    }
    
    // Check for edge stalemate patterns
    if (this.isKingOnEdge(kingPos)) {
      return {
        isClassicPattern: true,
        pattern: 'edge_stalemate',
        description: 'King trapped on edge with no escape squares'
      };
    }
    
    // Check for pawn stalemate patterns
    if (this.isPawnStalematePattern(color)) {
      return {
        isClassicPattern: true,
        pattern: 'pawn_stalemate',
        description: 'King blocked by pawns with no legal moves'
      };
    }
    
    return {
      isClassicPattern: false,
      pattern: 'complex_stalemate',
      description: 'Complex stalemate position with multiple pieces involved'
    };
  }

  /**
   * Check if king is in a corner
   * @param {Object} kingPos - King position
   * @returns {boolean} True if king is in corner
   */
  isKingInCorner(kingPos) {
    if (!kingPos) return false;
    
    const corners = [
      { row: 0, col: 0 }, // a8
      { row: 0, col: 7 }, // h8
      { row: 7, col: 0 }, // a1
      { row: 7, col: 7 }  // h1
    ];
    
    return corners.some(corner => 
      corner.row === kingPos.row && corner.col === kingPos.col
    );
  }

  /**
   * Check if king is on an edge
   * @param {Object} kingPos - King position
   * @returns {boolean} True if king is on edge
   */
  isKingOnEdge(kingPos) {
    if (!kingPos) return false;
    
    return kingPos.row === 0 || kingPos.row === 7 || 
           kingPos.col === 0 || kingPos.col === 7;
  }

  /**
   * Check if position is a pawn stalemate pattern
   * @param {string} color - Color to check
   * @returns {boolean} True if it's a pawn stalemate pattern
   */
  isPawnStalematePattern(color) {
    const kingPos = this.findKing(color);
    if (!kingPos) return false;
    
    // Count pawns around the king
    let blockingPawns = 0;
    const directions = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1],  [1, 0],  [1, 1]
    ];
    
    for (const [rowDir, colDir] of directions) {
      const checkPos = {
        row: kingPos.row + rowDir,
        col: kingPos.col + colDir
      };
      
      if (this.isValidSquare(checkPos)) {
        const piece = this.board[checkPos.row][checkPos.col];
        if (piece && piece.type === 'pawn') {
          blockingPawns++;
        }
      }
    }
    
    return blockingPawns >= 2; // At least 2 pawns involved in blocking
  }

  /**
   * Generate simple move notation for debugging
   * @param {Object} from - Source square
   * @param {Object} to - Destination square
   * @param {Object} piece - Piece being moved
   * @returns {string} Simple move notation
   */
  getMoveNotation(from, to, piece) {
    const fromSquare = String.fromCharCode(97 + from.col) + (8 - from.row);
    const toSquare = String.fromCharCode(97 + to.col) + (8 - to.row);
    const pieceSymbol = piece.type === 'pawn' ? '' : piece.type[0].toUpperCase();
    
    return pieceSymbol + fromSquare + '-' + toSquare;
  }

  /**
   * Enhanced draw declaration logic for stalemate
   * Updates game state and provides detailed information
   * @param {string} color - Color that is stalemated
   * @returns {Object} Draw declaration result
   */
  declareStalemateDraw(color) {
    const analysis = this.analyzeStalematePosition(color);
    
    if (!analysis.isStalemate) {
      return {
        success: false,
        message: 'Position is not stalemate',
        reason: analysis.inCheck ? 'Player is in check' : 'Player has legal moves'
      };
    }
    
    // Update game state
    this.gameStatus = 'stalemate';
    this.winner = null;
    
    const pattern = this.identifyStalematePattern(color);
    
    return {
      success: true,
      message: 'Game drawn by stalemate',
      gameStatus: 'stalemate',
      winner: null,
      analysis: analysis,
      pattern: pattern,
      finalPosition: this.getBoardState()
    };
  }

  /**
   * Get current board state for analysis
   * @returns {Object} Current board state
   */
  getBoardState() {
    return {
      board: this.board.map(row => row.map(piece => piece ? { ...piece } : null)),
      currentTurn: this.currentTurn,
      gameStatus: this.gameStatus,
      winner: this.winner,
      moveHistory: [...this.moveHistory],
      castlingRights: { ...this.castlingRights },
      enPassantTarget: this.enPassantTarget ? { ...this.enPassantTarget } : null
    };
  }

  /**
   * Enhanced legal move generation for checkmate validation
   * Comprehensively checks all possible moves for a color
   * @param {string} color - Color to check for valid moves
   * @returns {boolean} True if the color has any valid moves
   */
  hasValidMoves(color) {
    // Iterate through all squares to find pieces of the given color
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = this.board[row][col];
        
        // Skip empty squares and opponent pieces
        if (!piece || piece.color !== color) {
          continue;
        }
        
        // Check all possible destination squares for this piece
        for (let toRow = 0; toRow < 8; toRow++) {
          for (let toCol = 0; toCol < 8; toCol++) {
            const from = { row, col };
            const to = { row: toRow, col: toCol };
            
            // Skip same square
            if (row === toRow && col === toCol) {
              continue;
            }
            
            // Use a simplified validation that doesn't trigger game end checking
            if (this.isValidMoveSimple(from, to, piece)) {
              return true; // Found at least one valid move
            }
          }
        }
      }
    }
    
    return false; // No valid moves found
  }

  /**
   * Simplified move validation for hasValidMoves to prevent infinite recursion
   * This version doesn't call checkGameEnd or other functions that might call hasValidMoves
   * @param {Object} from - Source square
   * @param {Object} to - Destination square  
   * @param {Object} piece - Piece being moved
   * @returns {boolean} True if move is valid
   */
  isValidMoveSimple(from, to, piece) {
    // Basic coordinate validation
    if (!this.isValidSquare(from) || !this.isValidSquare(to)) {
      return false;
    }
    
    // Can't move to same square
    if (from.row === to.row && from.col === to.col) {
      return false;
    }
    
    // Check piece-specific movement patterns
    let isValidMovement = false;
    switch (piece.type) {
      case 'pawn':
        isValidMovement = this.isValidPawnMove(from, to, piece);
        break;
      case 'rook':
        isValidMovement = this.isValidRookMove(from, to) && this.isPathClear(from, to);
        break;
      case 'knight':
        isValidMovement = this.isValidKnightMove(from, to);
        break;
      case 'bishop':
        isValidMovement = this.isValidBishopMove(from, to) && this.isPathClear(from, to);
        break;
      case 'queen':
        isValidMovement = this.isValidQueenMove(from, to) && this.isPathClear(from, to);
        break;
      case 'king':
        // For king, check both regular moves and castling
        if (Math.abs(to.col - from.col) === 2) {
          // Castling attempt - simplified check
          isValidMovement = this.canCastle(from, to, piece.color);
        } else {
          isValidMovement = this.isValidKingMove(from, to, piece);
        }
        break;
      default:
        return false;
    }
    
    if (!isValidMovement) {
      return false;
    }
    
    // Check if destination square can be captured or is empty
    const targetPiece = this.board[to.row][to.col];
    if (targetPiece && targetPiece.color === piece.color) {
      return false; // Can't capture own piece
    }
    
    // Check if move would put own king in check (this is the critical check)
    return !this.wouldBeInCheck(from, to, piece.color, piece);
  }

  /**
   * Enhanced check detection that identifies when any king is under attack
   * @param {string} color - Color of the king to check
   * @returns {boolean} True if the king is in check
   */
  isInCheck(color) {
    const kingPos = this.findKing(color);
    if (!kingPos) {
      return false; // No king found (shouldn't happen in normal game)
    }
    
    const attackDetails = this.getAttackDetails(kingPos.row, kingPos.col, color);
    
    // Store detailed check information for debugging and UI
    if (attackDetails.isUnderAttack) {
      this.checkDetails = {
        kingPosition: kingPos,
        attackingPieces: attackDetails.attackingPieces,
        attackingSquares: attackDetails.attackingSquares,
        isDoubleCheck: attackDetails.attackingPieces.length > 1,
        checkType: this.categorizeCheck(attackDetails.attackingPieces)
      };
    } else {
      this.checkDetails = null;
    }
    
    return attackDetails.isUnderAttack;
  }

  findKing(color) {
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = this.board[row][col];
        if (piece && piece.type === 'king' && piece.color === color) {
          return { row, col };
        }
      }
    }
    return null;
  }

  /**
   * Get detailed attack information for a square
   * @param {number} row - Row of the square to check
   * @param {number} col - Column of the square to check
   * @param {string} defendingColor - Color of the defending side
   * @returns {Object} Detailed attack information
   */
  getAttackDetails(row, col, defendingColor) {
    const attackingPieces = [];
    const attackingSquares = [];
    const attackingColor = defendingColor === 'white' ? 'black' : 'white';
    
    // Check all squares for attacking pieces
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = this.board[r][c];
        
        // Skip empty squares and pieces of the defending color
        if (!piece || piece.color !== attackingColor) {
          continue;
        }
        
        // Check if this piece can attack the target square
        if (this.canPieceAttackSquare({ row: r, col: c }, { row, col }, piece)) {
          attackingPieces.push({
            piece: piece,
            position: { row: r, col: c },
            attackType: this.getAttackType(piece, { row: r, col: c }, { row, col })
          });
          attackingSquares.push({ row: r, col: c });
        }
      }
    }
    
    return {
      isUnderAttack: attackingPieces.length > 0,
      attackingPieces: attackingPieces,
      attackingSquares: attackingSquares,
      attackCount: attackingPieces.length
    };
  }

  /**
   * Categorize the type of check based on attacking pieces
   * @param {Array} attackingPieces - Array of attacking piece details
   * @returns {string} Type of check
   */
  categorizeCheck(attackingPieces) {
    if (attackingPieces.length === 0) {
      return 'none';
    } else if (attackingPieces.length === 1) {
      const piece = attackingPieces[0].piece;
      return `${piece.type}_check`;
    } else {
      return 'double_check';
    }
  }

  /**
   * Get the type of attack a piece is making
   * @param {Object} piece - The attacking piece
   * @param {Object} from - Source square
   * @param {Object} to - Target square
   * @returns {string} Type of attack
   */
  getAttackType(piece, from, to) {
    switch (piece.type) {
      case 'pawn':
        return 'diagonal_attack';
      case 'rook':
        return from.row === to.row ? 'horizontal_attack' : 'vertical_attack';
      case 'bishop':
        return 'diagonal_attack';
      case 'queen':
        if (from.row === to.row || from.col === to.col) {
          return from.row === to.row ? 'horizontal_attack' : 'vertical_attack';
        } else {
          return 'diagonal_attack';
        }
      case 'knight':
        return 'knight_attack';
      case 'king':
        return 'adjacent_attack';
      default:
        return 'unknown_attack';
    }
  }

  /**
   * Enhanced square attack detection for king safety validation
   * Determines if a square is under attack by the opposing color
   * @param {number} row - Row of the square to check
   * @param {number} col - Column of the square to check
   * @param {string} defendingColor - Color of the defending side
   * @returns {boolean} True if the square is under attack
   */
  isSquareUnderAttack(row, col, defendingColor) {
    // Validate input parameters
    if (!this.isValidSquare({ row, col }) || !defendingColor) {
      return false;
    }
    
    const attackingColor = defendingColor === 'white' ? 'black' : 'white';
    
    // Check all squares for attacking pieces
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = this.board[r][c];
        
        // Skip empty squares and pieces of the defending color
        if (!piece || piece.color !== attackingColor) {
          continue;
        }
        
        // Check if this piece can attack the target square
        // Use basic movement validation without check constraints to avoid infinite recursion
        if (this.canPieceAttackSquare({ row: r, col: c }, { row, col }, piece)) {
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Check if a piece can attack a specific square (used for king safety)
   * This is similar to isValidMove but without check constraints to avoid recursion
   * @param {Object} from - Source square
   * @param {Object} to - Target square
   * @param {Object} piece - The attacking piece
   * @returns {boolean} True if the piece can attack the square
   */
  canPieceAttackSquare(from, to, piece) {
    // Basic coordinate validation
    if (!this.isValidSquare(from) || !this.isValidSquare(to)) {
      return false;
    }
    
    // Cannot attack own square
    if (from.row === to.row && from.col === to.col) {
      return false;
    }
    
    // Check piece-specific movement patterns
    let canAttack = false;
    
    switch (piece.type) {
      case 'pawn':
        canAttack = this.canPawnAttackSquare(from, to, piece);
        break;
      case 'rook':
        canAttack = this.isValidRookMove(from, to) && this.isPathClear(from, to);
        break;
      case 'knight':
        canAttack = this.isValidKnightMove(from, to);
        break;
      case 'bishop':
        canAttack = this.isValidBishopMove(from, to) && this.isPathClear(from, to);
        break;
      case 'queen':
        canAttack = this.isValidQueenMove(from, to) && this.isPathClear(from, to);
        break;
      case 'king':
        canAttack = this.canKingAttackSquare(from, to);
        break;
      default:
        canAttack = false;
    }
    
    return canAttack;
  }

  /**
   * Check if a pawn can attack a specific square
   * @param {Object} from - Source square
   * @param {Object} to - Target square
   * @param {Object} piece - The pawn piece
   * @returns {boolean} True if the pawn can attack the square
   */
  canPawnAttackSquare(from, to, piece) {
    const direction = piece.color === 'white' ? -1 : 1;
    const rowDiff = to.row - from.row;
    const colDiff = Math.abs(to.col - from.col);
    
    // Pawn attacks diagonally one square forward
    return rowDiff === direction && colDiff === 1;
  }

  /**
   * Check if a king can attack a specific square (for attack detection)
   * @param {Object} from - Source square
   * @param {Object} to - Target square
   * @returns {boolean} True if the king can attack the square
   */
  canKingAttackSquare(from, to) {
    const rowDiff = Math.abs(to.row - from.row);
    const colDiff = Math.abs(to.col - from.col);
    
    // King attacks one square in any direction
    return rowDiff <= 1 && colDiff <= 1 && !(rowDiff === 0 && colDiff === 0);
  }

  /**
   * Enhanced move legality validation preventing self-check
   * Simulates a move temporarily to test if it would put the player's own king in check
   * Handles special moves like castling and en passant correctly
   * @param {Object} from - Source square
   * @param {Object} to - Destination square
   * @param {string} color - Color of the player making the move
   * @param {Object} piece - The piece being moved (optional, will be retrieved if not provided)
   * @param {string} promotion - Promotion piece type for pawn promotion (optional)
   * @returns {boolean} True if the move would put own king in check
   */
  wouldBeInCheck(from, to, color, piece = null, promotion = null) {
    // Validate input parameters
    if (!this.isValidSquare(from) || !this.isValidSquare(to) || !color) {
      return true; // Conservative approach - reject invalid inputs
    }
    
    // Get the piece if not provided
    if (!piece) {
      piece = this.board[from.row][from.col];
      if (!piece) {
        return true; // No piece to move
      }
    }
    
    // Save current game state to restore later
    const savedCheckDetails = this.checkDetails;
    const savedEnPassantTarget = this.enPassantTarget;
    
    // Store original board state
    const originalPiece = this.board[from.row][from.col];
    const capturedPiece = this.board[to.row][to.col];
    let enPassantCapturedPiece = null;
    let enPassantCaptureSquare = null;
    let castlingRookMove = null;
    
    try {
      // Handle special moves during simulation
      
      // Handle en passant capture
      if (piece.type === 'pawn' && this.enPassantTarget && 
          to.row === this.enPassantTarget.row && to.col === this.enPassantTarget.col) {
        // Remove the captured pawn (which is on the same row as the moving pawn)
        enPassantCaptureSquare = { row: from.row, col: to.col };
        enPassantCapturedPiece = this.board[enPassantCaptureSquare.row][enPassantCaptureSquare.col];
        this.board[enPassantCaptureSquare.row][enPassantCaptureSquare.col] = null;
      }
      
      // Handle castling
      if (piece.type === 'king' && Math.abs(to.col - from.col) === 2) {
        const rookFromCol = to.col > from.col ? 7 : 0;
        const rookToCol = to.col > from.col ? 5 : 3;
        const rook = this.board[from.row][rookFromCol];
        
        if (rook && rook.type === 'rook' && rook.color === color) {
          // Move rook for castling simulation
          castlingRookMove = {
            from: { row: from.row, col: rookFromCol },
            to: { row: from.row, col: rookToCol },
            piece: rook
          };
          this.board[from.row][rookToCol] = rook;
          this.board[from.row][rookFromCol] = null;
        }
      }
      
      // Execute the main move
      let movingPiece = { ...piece };
      
      // Handle pawn promotion
      if (piece.type === 'pawn') {
        const promotionRow = piece.color === 'white' ? 0 : 7;
        if (to.row === promotionRow) {
          const promotionPiece = promotion || 'queen';
          const validPromotions = ['queen', 'rook', 'bishop', 'knight'];
          if (validPromotions.includes(promotionPiece)) {
            movingPiece = { type: promotionPiece, color: piece.color };
          }
        }
      }
      
      this.board[to.row][to.col] = movingPiece;
      this.board[from.row][from.col] = null;
      
      // Check if this move puts own king in check
      const inCheck = this.isInCheck(color);
      
      return inCheck;
      
    } finally {
      // Always restore board state, even if an error occurs
      
      // Restore main move
      this.board[from.row][from.col] = originalPiece;
      this.board[to.row][to.col] = capturedPiece;
      
      // Restore en passant capture
      if (enPassantCapturedPiece && enPassantCaptureSquare) {
        this.board[enPassantCaptureSquare.row][enPassantCaptureSquare.col] = enPassantCapturedPiece;
      }
      
      // Restore castling rook move
      if (castlingRookMove) {
        this.board[castlingRookMove.from.row][castlingRookMove.from.col] = castlingRookMove.piece;
        this.board[castlingRookMove.to.row][castlingRookMove.to.col] = null;
      }
      
      // Restore game state
      this.checkDetails = savedCheckDetails;
      this.enPassantTarget = savedEnPassantTarget;
    }
  }

  /**
   * Check if a piece is pinned and cannot move without exposing the king
   * A piece is pinned if it's on the same line (rank, file, or diagonal) between
   * the king and an enemy sliding piece (rook, bishop, or queen)
   * @param {Object} piecePos - Position of the piece to check
   * @param {string} color - Color of the piece
   * @returns {Object} Pin information including whether piece is pinned and pin direction
   */
  isPiecePinned(piecePos, color) {
    if (!this.isValidSquare(piecePos) || !color) {
      return { isPinned: false, pinDirection: null, pinningPiece: null };
    }
    
    const kingPos = this.findKing(color);
    if (!kingPos) {
      return { isPinned: false, pinDirection: null, pinningPiece: null };
    }
    
    // Check if piece is on the same line as the king
    const rowDiff = piecePos.row - kingPos.row;
    const colDiff = piecePos.col - kingPos.col;
    
    // Determine if piece is on a line with the king
    let direction = null;
    let rowStep = 0;
    let colStep = 0;
    
    if (rowDiff === 0 && colDiff !== 0) {
      // Same rank (horizontal)
      direction = 'horizontal';
      rowStep = 0;
      colStep = colDiff > 0 ? 1 : -1;
    } else if (colDiff === 0 && rowDiff !== 0) {
      // Same file (vertical)
      direction = 'vertical';
      rowStep = rowDiff > 0 ? 1 : -1;
      colStep = 0;
    } else if (Math.abs(rowDiff) === Math.abs(colDiff) && rowDiff !== 0) {
      // Same diagonal
      direction = 'diagonal';
      rowStep = rowDiff > 0 ? 1 : -1;
      colStep = colDiff > 0 ? 1 : -1;
    } else {
      // Not on any line with the king
      return { isPinned: false, pinDirection: null, pinningPiece: null };
    }
    
    // Look for a pinning piece beyond the piece in question
    let currentRow = piecePos.row + rowStep;
    let currentCol = piecePos.col + colStep;
    
    while (this.isValidSquare({ row: currentRow, col: currentCol })) {
      const piece = this.board[currentRow][currentCol];
      
      if (piece) {
        // Found a piece - check if it's an enemy piece that can pin
        if (piece.color !== color) {
          const canPin = this.canPiecePin(piece, direction);
          if (canPin) {
            // Verify the path between king and piece is clear (except for the potentially pinned piece)
            if (this.isPathClearForPin(kingPos, { row: currentRow, col: currentCol }, piecePos)) {
              return {
                isPinned: true,
                pinDirection: direction,
                pinningPiece: {
                  type: piece.type,
                  color: piece.color,
                  position: { row: currentRow, col: currentCol }
                }
              };
            }
          }
        }
        // Any piece (friendly or enemy) blocks further search
        break;
      }
      
      currentRow += rowStep;
      currentCol += colStep;
    }
    
    return { isPinned: false, pinDirection: null, pinningPiece: null };
  }

  /**
   * Check if a piece can create a pin in a given direction
   * @param {Object} piece - The piece to check
   * @param {string} direction - Direction of potential pin ('horizontal', 'vertical', 'diagonal')
   * @returns {boolean} True if piece can pin in that direction
   */
  canPiecePin(piece, direction) {
    switch (piece.type) {
      case 'rook':
        return direction === 'horizontal' || direction === 'vertical';
      case 'bishop':
        return direction === 'diagonal';
      case 'queen':
        return true; // Queen can pin in any direction
      default:
        return false; // Only sliding pieces can create pins
    }
  }

  /**
   * Check if the path between king and pinning piece is clear except for one piece
   * @param {Object} kingPos - Position of the king
   * @param {Object} pinningPos - Position of the pinning piece
   * @param {Object} excludePos - Position to exclude from path check (the potentially pinned piece)
   * @returns {boolean} True if path is clear except for excluded position
   */
  isPathClearForPin(kingPos, pinningPos, excludePos) {
    const rowStep = pinningPos.row === kingPos.row ? 0 : (pinningPos.row - kingPos.row) / Math.abs(pinningPos.row - kingPos.row);
    const colStep = pinningPos.col === kingPos.col ? 0 : (pinningPos.col - kingPos.col) / Math.abs(pinningPos.col - kingPos.col);
    
    let currentRow = kingPos.row + rowStep;
    let currentCol = kingPos.col + colStep;
    
    while (currentRow !== pinningPos.row || currentCol !== pinningPos.col) {
      // Skip the excluded position (the potentially pinned piece)
      if (currentRow !== excludePos.row || currentCol !== excludePos.col) {
        if (this.board[currentRow][currentCol]) {
          return false; // Path is blocked by another piece
        }
      }
      
      currentRow += rowStep;
      currentCol += colStep;
    }
    
    return true;
  }

  /**
   * Validate that a pinned piece move is legal (stays on pin line or captures pinning piece)
   * @param {Object} from - Source square
   * @param {Object} to - Destination square
   * @param {Object} pinInfo - Pin information from isPiecePinned
   * @returns {boolean} True if the pinned piece move is legal
   */
  isPinnedPieceMoveValid(from, to, pinInfo) {
    if (!pinInfo.isPinned) {
      return true; // Not pinned, any move is valid from pin perspective
    }
    
    const kingPos = this.findKing(this.board[from.row][from.col].color);
    if (!kingPos) {
      return false;
    }
    
    // Check if move is capturing the pinning piece
    if (to.row === pinInfo.pinningPiece.position.row && to.col === pinInfo.pinningPiece.position.col) {
      return true; // Capturing the pinning piece is always valid
    }
    
    // Check if move stays on the pin line
    switch (pinInfo.pinDirection) {
      case 'horizontal':
        // Must stay on same rank and between king and pinning piece
        if (to.row !== kingPos.row) return false;
        const minCol = Math.min(kingPos.col, pinInfo.pinningPiece.position.col);
        const maxCol = Math.max(kingPos.col, pinInfo.pinningPiece.position.col);
        return to.col >= minCol && to.col <= maxCol;
        
      case 'vertical':
        // Must stay on same file and between king and pinning piece
        if (to.col !== kingPos.col) return false;
        const minRow = Math.min(kingPos.row, pinInfo.pinningPiece.position.row);
        const maxRow = Math.max(kingPos.row, pinInfo.pinningPiece.position.row);
        return to.row >= minRow && to.row <= maxRow;
        
      case 'diagonal':
        // Must stay on same diagonal and between king and pinning piece
        const kingRowDiff = to.row - kingPos.row;
        const kingColDiff = to.col - kingPos.col;
        
        // Check if destination is on the same diagonal as king
        if (Math.abs(kingRowDiff) !== Math.abs(kingColDiff)) return false;
        
        // Check if destination is between king and pinning piece
        const pinRowDiff = pinInfo.pinningPiece.position.row - kingPos.row;
        const pinColDiff = pinInfo.pinningPiece.position.col - kingPos.col;
        
        // Must be in the same diagonal direction
        const sameRowDirection = (kingRowDiff > 0) === (pinRowDiff > 0) || kingRowDiff === 0;
        const sameColDirection = (kingColDiff > 0) === (pinColDiff > 0) || kingColDiff === 0;
        
        if (!sameRowDirection || !sameColDirection) return false;
        
        // Must be within the bounds of the pin line
        const maxRowDist = Math.abs(pinRowDiff);
        const maxColDist = Math.abs(pinColDiff);
        
        return Math.abs(kingRowDiff) <= maxRowDist && Math.abs(kingColDiff) <= maxColDist;
        
      default:
        return false;
    }
  }









  /**
   * Get all valid moves for a given color
   * @param {string} color - Color to get moves for ('white' or 'black')
   * @returns {Array} Array of valid move objects
   */
  getAllValidMoves(color) {
    const validMoves = [];
    
    // Iterate through all squares on the board
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = this.board[row][col];
        
        // Skip if no piece or wrong color
        if (!piece || piece.color !== color) continue;
        
        const from = { row, col };
        
        // Generate all possible moves for this piece
        const possibleMoves = this.generatePossibleMoves(from, piece);
        
        // Validate each possible move
        for (const to of possibleMoves) {
          const move = { from, to };
          const validation = this.validateMove(move);
          
          if (validation.isValid) {
            validMoves.push(move);
          }
        }
      }
    }
    
    return validMoves;
  }

  /**
   * Generate all possible moves for a piece (before validation)
   * @param {Object} from - Source square
   * @param {Object} piece - Piece to generate moves for
   * @returns {Array} Array of possible destination squares
   */
  generatePossibleMoves(from, piece) {
    const moves = [];
    
    switch (piece.type) {
      case 'pawn':
        moves.push(...this.generatePawnMoves(from, piece));
        break;
      case 'rook':
        moves.push(...this.generateRookMoves(from));
        break;
      case 'knight':
        moves.push(...this.generateKnightMoves(from));
        break;
      case 'bishop':
        moves.push(...this.generateBishopMoves(from));
        break;
      case 'queen':
        moves.push(...this.generateQueenMoves(from));
        break;
      case 'king':
        moves.push(...this.generateKingMoves(from));
        break;
    }
    
    return moves;
  }

  /**
   * Generate possible pawn moves
   * @param {Object} from - Source square
   * @param {Object} piece - Pawn piece
   * @returns {Array} Array of possible moves
   */
  generatePawnMoves(from, piece) {
    const moves = [];
    const direction = piece.color === 'white' ? -1 : 1;
    const startRow = piece.color === 'white' ? 6 : 1;
    
    // Forward moves
    const oneForward = { row: from.row + direction, col: from.col };
    if (this.isValidSquare(oneForward)) {
      moves.push(oneForward);
      
      // Two squares forward from starting position
      if (from.row === startRow) {
        const twoForward = { row: from.row + 2 * direction, col: from.col };
        if (this.isValidSquare(twoForward)) {
          moves.push(twoForward);
        }
      }
    }
    
    // Diagonal captures
    const captureLeft = { row: from.row + direction, col: from.col - 1 };
    const captureRight = { row: from.row + direction, col: from.col + 1 };
    
    if (this.isValidSquare(captureLeft)) moves.push(captureLeft);
    if (this.isValidSquare(captureRight)) moves.push(captureRight);
    
    return moves;
  }

  /**
   * Generate possible rook moves
   * @param {Object} from - Source square
   * @returns {Array} Array of possible moves
   */
  generateRookMoves(from) {
    const moves = [];
    const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
    
    for (const [rowDir, colDir] of directions) {
      for (let i = 1; i < 8; i++) {
        const to = { row: from.row + i * rowDir, col: from.col + i * colDir };
        if (!this.isValidSquare(to)) break;
        moves.push(to);
      }
    }
    
    return moves;
  }

  /**
   * Generate possible knight moves
   * @param {Object} from - Source square
   * @returns {Array} Array of possible moves
   */
  generateKnightMoves(from) {
    const moves = [];
    const knightMoves = [
      [-2, -1], [-2, 1], [-1, -2], [-1, 2],
      [1, -2], [1, 2], [2, -1], [2, 1]
    ];
    
    for (const [rowOffset, colOffset] of knightMoves) {
      const to = { row: from.row + rowOffset, col: from.col + colOffset };
      if (this.isValidSquare(to)) {
        moves.push(to);
      }
    }
    
    return moves;
  }

  /**
   * Generate possible bishop moves
   * @param {Object} from - Source square
   * @returns {Array} Array of possible moves
   */
  generateBishopMoves(from) {
    const moves = [];
    const directions = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
    
    for (const [rowDir, colDir] of directions) {
      for (let i = 1; i < 8; i++) {
        const to = { row: from.row + i * rowDir, col: from.col + i * colDir };
        if (!this.isValidSquare(to)) break;
        moves.push(to);
      }
    }
    
    return moves;
  }

  /**
   * Generate possible queen moves
   * @param {Object} from - Source square
   * @returns {Array} Array of possible moves
   */
  generateQueenMoves(from) {
    return [
      ...this.generateRookMoves(from),
      ...this.generateBishopMoves(from)
    ];
  }

  /**
   * Generate possible king moves
   * @param {Object} from - Source square
   * @returns {Array} Array of possible moves
   */
  generateKingMoves(from) {
    const moves = [];
    const directions = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1],  [1, 0],  [1, 1]
    ];
    
    for (const [rowDir, colDir] of directions) {
      const to = { row: from.row + rowDir, col: from.col + colDir };
      if (this.isValidSquare(to)) {
        moves.push(to);
      }
    }
    
    // Add castling moves
    if (from.row === (this.currentTurn === 'white' ? 7 : 0) && from.col === 4) {
      // Kingside castling
      moves.push({ row: from.row, col: 6 });
      // Queenside castling
      moves.push({ row: from.row, col: 2 });
    }
    
    return moves;
  }

  /**
   * Reset the game to initial state
   */
  resetGame() {
    this.board = this.initializeBoard();
    this.currentTurn = 'white';
    this.gameStatus = 'active';
    this.winner = null;
    this.moveHistory = [];
    this.castlingRights = {
      white: { kingside: true, queenside: true },
      black: { kingside: true, queenside: true }
    };
    this.enPassantTarget = null;
    this.halfMoveClock = 0;
    this.fullMoveNumber = 1;
    this.inCheck = false;
    this.checkDetails = null;
    
    // Reset state manager
    this.stateManager = new GameStateManager();
    this.gameMetadata = this.stateManager.gameMetadata;
    this.positionHistory = this.stateManager.positionHistory;
    this.positionHistory.push(this.stateManager.getFENPosition(
      this.board, this.currentTurn, this.castlingRights, this.enPassantTarget
    ));
    this.stateVersion = this.stateManager.stateVersion;
    this.lastValidatedState = null;
  }

  /**
   * Get comprehensive game state with enhanced tracking and metadata
   * @returns {Object} Complete game state information
   */
  getGameState() {
    const gameStateSnapshot = this.getGameStateForSnapshot();
    
    return {
      // Core game state
      board: this.board,
      currentTurn: this.currentTurn,
      gameStatus: this.gameStatus,
      winner: this.winner,
      moveHistory: this.moveHistory,
      
      // Check and game end information
      inCheck: this.inCheck,
      checkDetails: this.checkDetails,
      
      // Special move tracking
      castlingRights: this.castlingRights,
      enPassantTarget: this.enPassantTarget,
      
      // Move counting
      halfMoveClock: this.halfMoveClock,
      fullMoveNumber: this.fullMoveNumber,
      
      // Enhanced metadata
      gameMetadata: this.stateManager.gameMetadata,
      positionHistory: this.stateManager.positionHistory,
      stateVersion: this.stateManager.stateVersion,
      
      // Current position
      currentPosition: this.stateManager.getFENPosition(
        this.board, this.currentTurn, this.castlingRights, this.enPassantTarget
      ),
      
      // State validation
      stateConsistency: this.stateManager.validateGameStateConsistency(gameStateSnapshot)
    };
  }
}

module.exports = ChessGame;