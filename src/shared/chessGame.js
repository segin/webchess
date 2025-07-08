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
    const { from, to, promotion } = move;
    
    if (!this.isValidSquare(from) || !this.isValidSquare(to)) {
      return { success: false, message: 'Invalid square' };
    }

    const piece = this.board[from.row][from.col];
    if (!piece || piece.color !== this.currentTurn) {
      return { success: false, message: 'No piece or wrong color' };
    }

    if (!this.isValidMove(from, to, piece)) {
      return { success: false, message: 'Invalid move' };
    }

    // Check if move puts own king in check
    if (this.wouldBeInCheck(from, to, this.currentTurn)) {
      return { success: false, message: 'Move would put king in check' };
    }

    // Execute the move
    this.executeMoveOnBoard(from, to, piece, promotion);
    
    // Update game state
    this.updateGameState(from, to, piece);
    
    // Check for game end conditions
    this.checkGameEnd();
    
    return { success: true };
  }

  isValidSquare(pos) {
    return pos.row >= 0 && pos.row < 8 && pos.col >= 0 && pos.col < 8;
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

  isValidPawnMove(from, to, piece) {
    const direction = piece.color === 'white' ? -1 : 1;
    const startRow = piece.color === 'white' ? 6 : 1;
    const rowDiff = to.row - from.row;
    const colDiff = Math.abs(to.col - from.col);
    
    // Forward move
    if (colDiff === 0) {
      if (rowDiff === direction && !this.board[to.row][to.col]) {
        return true;
      }
      if (from.row === startRow && rowDiff === 2 * direction && !this.board[to.row][to.col]) {
        return true;
      }
    }
    
    // Diagonal capture
    if (colDiff === 1 && rowDiff === direction) {
      const target = this.board[to.row][to.col];
      if (target && target.color !== piece.color) {
        return true;
      }
      // En passant
      if (this.enPassantTarget && to.row === this.enPassantTarget.row && to.col === this.enPassantTarget.col) {
        return true;
      }
    }
    
    return false;
  }

  isValidRookMove(from, to) {
    return (from.row === to.row || from.col === to.col) && this.isPathClear(from, to);
  }

  isValidKnightMove(from, to) {
    const rowDiff = Math.abs(to.row - from.row);
    const colDiff = Math.abs(to.col - from.col);
    return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
  }

  isValidBishopMove(from, to) {
    const rowDiff = Math.abs(to.row - from.row);
    const colDiff = Math.abs(to.col - from.col);
    return rowDiff === colDiff && this.isPathClear(from, to);
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

  executeMoveOnBoard(from, to, piece, promotion) {
    const target = this.board[to.row][to.col];
    
    // Handle en passant capture
    if (piece.type === 'pawn' && this.enPassantTarget && 
        to.row === this.enPassantTarget.row && to.col === this.enPassantTarget.col) {
      this.board[from.row][to.col] = null;
    }
    
    // Handle castling
    if (piece.type === 'king' && Math.abs(to.col - from.col) === 2) {
      const rookFromCol = to.col > from.col ? 7 : 0;
      const rookToCol = to.col > from.col ? 5 : 3;
      const rook = this.board[from.row][rookFromCol];
      this.board[from.row][rookToCol] = rook;
      this.board[from.row][rookFromCol] = null;
    }
    
    // Execute the move
    this.board[to.row][to.col] = piece;
    this.board[from.row][from.col] = null;
    
    // Handle pawn promotion
    if (piece.type === 'pawn' && (to.row === 0 || to.row === 7)) {
      this.board[to.row][to.col] = {
        type: promotion || 'queen',
        color: piece.color
      };
    }
    
    // Record move
    this.moveHistory.push({
      from,
      to,
      piece: piece.type,
      color: piece.color,
      captured: target ? target.type : null,
      promotion: promotion || null
    });
  }

  updateGameState(from, to, piece) {
    // Update en passant target
    if (piece.type === 'pawn' && Math.abs(to.row - from.row) === 2) {
      this.enPassantTarget = {
        row: from.row + (to.row - from.row) / 2,
        col: from.col
      };
    } else {
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
    
    // Switch turns
    this.currentTurn = this.currentTurn === 'white' ? 'black' : 'white';
    
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