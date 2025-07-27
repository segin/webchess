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
      return {
        success: false,
        message: validation.message,
        errorCode: validation.errorCode,
        errors: validation.errors,
        details: validation.details
      };
    }

    const { from, to, promotion } = move;
    const piece = this.board[from.row][from.col];

    // Store original piece for game state update
    const originalPiece = { ...piece };

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

    // Step 7: Path validation (except for knights)
    if (piece.type !== 'knight') {
      const pathValidation = this.validatePath(from, to);
      if (!pathValidation.isValid) {
        return pathValidation;
      }
    }

    // Step 8: Capture validation
    const captureValidation = this.validateCapture(from, to, piece);
    if (!captureValidation.isValid) {
      return captureValidation;
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
    const errors = [];

    if (!move || typeof move !== 'object') {
      return {
        isValid: false,
        message: 'Move must be an object',
        errorCode: 'MALFORMED_MOVE',
        errors: ['Move parameter is null, undefined, or not an object'],
        details: { formatValid: false }
      };
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
      return {
        isValid: false,
        message: 'Invalid move format',
        errorCode: 'INVALID_FORMAT',
        errors: errors,
        details: { formatValid: false }
      };
    }

    return { isValid: true };
  }

  /**
   * Validate coordinate bounds
   * @param {Object} from - Source square
   * @param {Object} to - Destination square
   * @returns {Object} Validation result
   */
  validateCoordinates(from, to) {
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
      return {
        isValid: false,
        message: 'Invalid coordinates',
        errorCode: 'INVALID_COORDINATES',
        errors: errors,
        details: { coordinatesValid: false }
      };
    }

    return { isValid: true };
  }

  /**
   * Validate current game state allows moves
   * @returns {Object} Validation result
   */
  validateGameState() {
    if (this.gameStatus !== 'active') {
      return {
        isValid: false,
        message: 'Game is not active',
        errorCode: 'GAME_NOT_ACTIVE',
        errors: [`Game status is ${this.gameStatus}, moves are not allowed`],
        details: { gameStateValid: false }
      };
    }

    return { isValid: true };
  }

  /**
   * Validate piece exists at source square
   * @param {Object} from - Source square
   * @returns {Object} Validation result
   */
  validatePieceAtSquare(from) {
    const piece = this.board[from.row][from.col];

    if (!piece) {
      return {
        isValid: false,
        message: 'No piece at source square',
        errorCode: 'NO_PIECE',
        errors: [`No piece found at square row ${from.row}, col ${from.col}`],
        details: { pieceValid: false }
      };
    }

    if (!piece.type || !piece.color) {
      return {
        isValid: false,
        message: 'Invalid piece data',
        errorCode: 'INVALID_PIECE',
        errors: ['Piece missing type or color information'],
        details: { pieceValid: false }
      };
    }

    const validTypes = ['pawn', 'rook', 'knight', 'bishop', 'queen', 'king'];
    const validColors = ['white', 'black'];

    if (!validTypes.includes(piece.type)) {
      return {
        isValid: false,
        message: 'Invalid piece type',
        errorCode: 'INVALID_PIECE_TYPE',
        errors: [`Invalid piece type: ${piece.type}`],
        details: { pieceValid: false }
      };
    }

    if (!validColors.includes(piece.color)) {
      return {
        isValid: false,
        message: 'Invalid piece color',
        errorCode: 'INVALID_PIECE_COLOR',
        errors: [`Invalid piece color: ${piece.color}`],
        details: { pieceValid: false }
      };
    }

    return { isValid: true };
  }

  /**
   * Validate it's the correct player's turn
   * @param {Object} piece - The piece being moved
   * @returns {Object} Validation result
   */
  validateTurn(piece) {
    if (piece.color !== this.currentTurn) {
      return {
        isValid: false,
        message: 'Not your turn',
        errorCode: 'WRONG_TURN',
        errors: [`It's ${this.currentTurn}'s turn, cannot move ${piece.color} piece`],
        details: { turnValid: false }
      };
    }

    return { isValid: true };
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
      if (!this.canCastle(from, to, piece.color)) {
        return {
          isValid: false,
          message: 'Invalid castling',
          errorCode: 'INVALID_CASTLING',
          errors: ['Castling conditions not met'],
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
   * Validate move doesn't put own king in check
   * @param {Object} from - Source square
   * @param {Object} to - Destination square
   * @param {Object} piece - The piece being moved
   * @returns {Object} Validation result
   */
  validateCheckConstraints(from, to, piece) {
    if (this.wouldBeInCheck(from, to, piece.color)) {
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

  isValidQueenMove(from, to) {
    return this.isValidRookMove(from, to) || this.isValidBishopMove(from, to);
  }

  isValidKingMove(from, to, piece) {
    const rowDiff = Math.abs(to.row - from.row);
    const colDiff = Math.abs(to.col - from.col);
    
    // Normal king move
    if (rowDiff <= 1 && colDiff <= 1) {
      return true;
    }
    
    // Castling
    if (rowDiff === 0 && colDiff === 2) {
      return this.canCastle(from, to, piece.color);
    }
    
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

  canCastle(from, to, color) {
    const row = color === 'white' ? 7 : 0;
    const kingside = to.col > from.col;
    
    // Check castling rights
    if (!this.castlingRights[color][kingside ? 'kingside' : 'queenside']) {
      return false;
    }
    
    // Check if king is in check
    if (this.isInCheck(color)) {
      return false;
    }
    
    // Check if path is clear and squares are not under attack
    const rookCol = kingside ? 7 : 0;
    const step = kingside ? 1 : -1;
    
    for (let col = from.col + step; col !== rookCol; col += step) {
      if (this.board[row][col] || this.isSquareUnderAttack(row, col, color)) {
        return false;
      }
    }
    
    // Check if king's destination is under attack
    if (this.isSquareUnderAttack(to.row, to.col, color)) {
      return false;
    }
    
    return true;
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
    
    // Record move in history
    this.moveHistory.push({
      from: { row: from.row, col: from.col },
      to: { row: to.row, col: to.col },
      piece: piece.type,
      color: piece.color,
      captured: capturedPiece ? capturedPiece.type : null,
      promotion: promotionPiece,
      castling: isCastling ? (to.col > from.col ? 'kingside' : 'queenside') : null,
      enPassant: isEnPassant,
      timestamp: Date.now()
    });
  }

  /**
   * Update game state after a move
   * @param {Object} from - Source square
   * @param {Object} to - Destination square
   * @param {Object} piece - The piece that moved
   */
  updateGameState(from, to, piece) {
    // Update en passant target
    if (piece.type === 'pawn' && Math.abs(to.row - from.row) === 2) {
      // Pawn moved two squares, set en passant target
      this.enPassantTarget = {
        row: from.row + (to.row - from.row) / 2,
        col: from.col
      };
    } else {
      // Clear en passant target after any other move
      this.enPassantTarget = null;
    }
    
    // Update castling rights
    if (piece.type === 'king') {
      this.castlingRights[piece.color].kingside = false;
      this.castlingRights[piece.color].queenside = false;
    }
    
    if (piece.type === 'rook') {
      if (from.col === 0) {
        this.castlingRights[piece.color].queenside = false;
      } else if (from.col === 7) {
        this.castlingRights[piece.color].kingside = false;
      }
    }
    
    // Update half-move clock (for 50-move rule)
    if (piece.type === 'pawn' || this.board[to.row][to.col]) {
      this.halfMoveClock = 0; // Reset on pawn move or capture
    } else {
      this.halfMoveClock++;
    }
    
    // Switch turns
    this.currentTurn = this.currentTurn === 'white' ? 'black' : 'white';
    
    // Update full move number (increments after black's move)
    if (this.currentTurn === 'white') {
      this.fullMoveNumber++;
    }
  }

  checkGameEnd() {
    const oppositeColor = this.currentTurn;
    
    if (this.isInCheck(oppositeColor)) {
      if (this.isCheckmate(oppositeColor)) {
        this.gameStatus = 'checkmate';
        this.winner = oppositeColor === 'white' ? 'black' : 'white';
      }
    } else if (this.isStalemate(oppositeColor)) {
      this.gameStatus = 'stalemate';
      this.winner = null;
    }
  }

  isInCheck(color) {
    const kingPos = this.findKing(color);
    return kingPos ? this.isSquareUnderAttack(kingPos.row, kingPos.col, color) : false;
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

  isSquareUnderAttack(row, col, defendingColor) {
    const attackingColor = defendingColor === 'white' ? 'black' : 'white';
    
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = this.board[r][c];
        if (piece && piece.color === attackingColor) {
          if (this.isValidMove({ row: r, col: c }, { row, col }, piece)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  wouldBeInCheck(from, to, color) {
    // Make temporary move
    const originalPiece = this.board[from.row][from.col];
    const capturedPiece = this.board[to.row][to.col];
    
    this.board[to.row][to.col] = originalPiece;
    this.board[from.row][from.col] = null;
    
    const inCheck = this.isInCheck(color);
    
    // Restore board
    this.board[from.row][from.col] = originalPiece;
    this.board[to.row][to.col] = capturedPiece;
    
    return inCheck;
  }

  isCheckmate(color) {
    return this.isInCheck(color) && !this.hasValidMoves(color);
  }

  isStalemate(color) {
    return !this.isInCheck(color) && !this.hasValidMoves(color);
  }

  hasValidMoves(color) {
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = this.board[row][col];
        if (piece && piece.color === color) {
          for (let toRow = 0; toRow < 8; toRow++) {
            for (let toCol = 0; toCol < 8; toCol++) {
              const from = { row, col };
              const to = { row: toRow, col: toCol };
              
              if (this.isValidMove(from, to, piece) && !this.wouldBeInCheck(from, to, color)) {
                return true;
              }
            }
          }
        }
      }
    }
    return false;
  }

  getGameState() {
    return {
      board: this.board,
      currentTurn: this.currentTurn,
      status: this.gameStatus,
      winner: this.winner,
      moveHistory: this.moveHistory,
      inCheck: this.isInCheck(this.currentTurn)
    };
  }
}

module.exports = ChessGame;