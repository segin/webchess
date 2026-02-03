const ChessGame = require('./chessGame');

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
    
    this.positionValues = {
      pawn: [
        [0,  0,  0,  0,  0,  0,  0,  0],
        [50, 50, 50, 50, 50, 50, 50, 50],
        [10, 10, 20, 30, 30, 20, 10, 10],
        [5,  5, 10, 25, 25, 10,  5,  5],
        [0,  0,  0, 20, 20,  0,  0,  0],
        [5, -5,-10,  0,  0,-10, -5,  5],
        [5, 10, 10,-20,-20, 10, 10,  5],
        [0,  0,  0,  0,  0,  0,  0,  0]
      ],
      knight: [
        [-50,-40,-30,-30,-30,-30,-40,-50],
        [-40,-20,  0,  0,  0,  0,-20,-40],
        [-30,  0, 10, 15, 15, 10,  0,-30],
        [-30,  5, 15, 20, 20, 15,  5,-30],
        [-30,  0, 15, 20, 20, 15,  0,-30],
        [-30,  5, 10, 15, 15, 10,  5,-30],
        [-40,-20,  0,  5,  5,  0,-20,-40],
        [-50,-40,-30,-30,-30,-30,-40,-50]
      ],
      bishop: [
        [-20,-10,-10,-10,-10,-10,-10,-20],
        [-10,  0,  0,  0,  0,  0,  0,-10],
        [-10,  0,  5, 10, 10,  5,  0,-10],
        [-10,  5,  5, 10, 10,  5,  5,-10],
        [-10,  0, 10, 10, 10, 10,  0,-10],
        [-10, 10, 10, 10, 10, 10, 10,-10],
        [-10,  5,  0,  0,  0,  0,  5,-10],
        [-20,-10,-10,-10,-10,-10,-10,-20]
      ],
      rook: [
        [0,  0,  0,  0,  0,  0,  0,  0],
        [5, 10, 10, 10, 10, 10, 10,  5],
        [-5,  0,  0,  0,  0,  0,  0, -5],
        [-5,  0,  0,  0,  0,  0,  0, -5],
        [-5,  0,  0,  0,  0,  0,  0, -5],
        [-5,  0,  0,  0,  0,  0,  0, -5],
        [-5,  0,  0,  0,  0,  0,  0, -5],
        [0,  0,  0,  5,  5,  0,  0,  0]
      ],
      queen: [
        [-20,-10,-10, -5, -5,-10,-10,-20],
        [-10,  0,  0,  0,  0,  0,  0,-10],
        [-10,  0,  5,  5,  5,  5,  0,-10],
        [-5,  0,  5,  5,  5,  5,  0, -5],
        [0,  0,  5,  5,  5,  5,  0, -5],
        [-10,  5,  5,  5,  5,  5,  0,-10],
        [-10,  0,  5,  0,  0,  0,  0,-10],
        [-20,-10,-10, -5, -5,-10,-10,-20]
      ],
      king: [
        [-30,-40,-40,-50,-50,-40,-40,-30],
        [-30,-40,-40,-50,-50,-40,-40,-30],
        [-30,-40,-40,-50,-50,-40,-40,-30],
        [-30,-40,-40,-50,-50,-40,-40,-30],
        [-20,-30,-30,-40,-40,-30,-30,-20],
        [-10,-20,-20,-20,-20,-20,-20,-10],
        [20, 20,  0,  0,  0,  0, 20, 20],
        [20, 30, 10,  0,  0, 10, 30, 20]
      ]
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
  
  getBestMove(chessGame) {
    if (!chessGame || !chessGame.currentTurn) {
      return null;
    }
    
    const color = chessGame.currentTurn;
    const moves = this.getAllValidMoves(chessGame, color);
    
    if (moves.length === 0) return null;
    
    if (this.difficulty === 'easy' && Math.random() < 0.3) {
      return moves[Math.floor(Math.random() * moves.length)];
    }
    
    let bestMove = null;
    let bestScore = color === 'white' ? -Infinity : Infinity;
    
    for (const move of moves) {
      const score = this.minimax(chessGame, move, this.maxDepth - 1, !this.isMaximizing(color), -Infinity, Infinity);
      
      if (color === 'white' && score > bestScore) {
        bestScore = score;
        bestMove = move;
      } else if (color === 'black' && score < bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }
    
    return bestMove;
  }
  
  minimax(chessGame, move, depth, isMaximizing, alpha, beta) {
    // Safety check: prevent infinite recursion
    if (depth < 0) {
      return this.evaluatePosition(chessGame);
    }
    
    const tempGame = this.cloneGame(chessGame);
    const result = tempGame.makeMove(move, null, null, { silent: true });
    
    if (!result.success) return isMaximizing ? -Infinity : Infinity;
    
    if (depth === 0 || tempGame.gameStatus !== 'active') {
      return this.evaluatePosition(tempGame);
    }
    
    const moves = this.getAllValidMoves(tempGame, tempGame.currentTurn);
    
    // Safety check: limit number of moves to prevent infinite loops
    if (moves.length === 0) {
      return this.evaluatePosition(tempGame);
    }
    
    // Limit moves to first 20 to prevent performance issues in tests
    const limitedMoves = moves.slice(0, 20);
    
    if (isMaximizing) {
      let maxScore = -Infinity;
      for (const nextMove of limitedMoves) {
        const score = this.minimax(tempGame, nextMove, depth - 1, false, alpha, beta);
        maxScore = Math.max(maxScore, score);
        alpha = Math.max(alpha, score);
        if (beta <= alpha) break;
      }
      return maxScore;
    } else {
      let minScore = Infinity;
      for (const nextMove of limitedMoves) {
        const score = this.minimax(tempGame, nextMove, depth - 1, true, alpha, beta);
        minScore = Math.min(minScore, score);
        beta = Math.min(beta, score);
        if (beta <= alpha) break;
      }
      return minScore;
    }
  }
  
  evaluatePosition(chessGame) {
    if (chessGame.gameStatus === 'checkmate') {
      return chessGame.winner === 'white' ? 10000 : -10000;
    }
    
    if (chessGame.gameStatus === 'stalemate') {
      return 0;
    }
    
    let score = 0;
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = chessGame.board[row][col];
        if (piece) {
          const pieceValue = this.pieceValues[piece.type];
          const positionValue = this.getPositionValue(piece, row, col);
          const totalValue = pieceValue + positionValue;
          
          score += piece.color === 'white' ? totalValue : -totalValue;
        }
      }
    }
    
    return score;
  }
  
  getPositionValue(piece, row, col) {
    const table = this.positionValues[piece.type];
    if (!table) return 0;
    
    const adjustedRow = piece.color === 'white' ? 7 - row : row;
    return table[adjustedRow][col];
  }
  
  getAllValidMoves(chessGame, color) {
    const moves = [];
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = chessGame.board[row][col];
        if (piece && piece.color === color) {
          const pieceMoves = this.getValidMovesForPiece(chessGame, row, col);
          moves.push(...pieceMoves);
        }
      }
    }
    
    return moves;
  }
  
  getValidMovesForPiece(chessGame, row, col) {
    const moves = [];
    const piece = chessGame.board[row][col];
    
    if (!piece) return moves;
    
    // Helper to add move if valid
    const tryAddMove = (toRow, toCol) => {
      // Basic bounds check first
      if (toRow < 0 || toRow > 7 || toCol < 0 || toCol > 7) return;

      const move = {
        from: { row, col },
        to: { row: toRow, col: toCol }
      };

      // Use comprehensive validation instead of lower-level methods
      const validation = chessGame.validateMove(move);
      if (validation.success && validation.isValid) {
        moves.push(move);
      }
    };

    switch (piece.type) {
      case 'pawn': {
        const direction = piece.color === 'white' ? -1 : 1;
        const startRow = piece.color === 'white' ? 6 : 1;

        // Forward 1
        tryAddMove(row + direction, col);

        // Forward 2 (only if on start row)
        if (row === startRow) {
          tryAddMove(row + 2 * direction, col);
        }

        // Captures
        tryAddMove(row + direction, col - 1);
        tryAddMove(row + direction, col + 1);
        break;
      }

      case 'knight': {
        const offsets = [
          [-2, -1], [-2, 1], [-1, -2], [-1, 2],
          [1, -2], [1, 2], [2, -1], [2, 1]
        ];
        for (const [r, c] of offsets) {
          tryAddMove(row + r, col + c);
        }
        break;
      }

      case 'bishop':
      case 'rook':
      case 'queen': {
        const directions = [];
        if (piece.type !== 'bishop') { // Rook or Queen
          directions.push([0, 1], [0, -1], [1, 0], [-1, 0]);
        }
        if (piece.type !== 'rook') { // Bishop or Queen
          directions.push([1, 1], [1, -1], [-1, 1], [-1, -1]);
        }

        for (const [dr, dc] of directions) {
          for (let i = 1; i < 8; i++) {
            const toRow = row + i * dr;
            const toCol = col + i * dc;

            if (toRow < 0 || toRow > 7 || toCol < 0 || toCol > 7) break;

            const target = chessGame.board[toRow][toCol];

            if (!target) {
              // Empty square
              tryAddMove(toRow, toCol);
            } else {
              // Occupied
              if (target.color !== piece.color) {
                // Capture enemy
                tryAddMove(toRow, toCol);
              }
              // Blocked (whether friend or foe), stop ray
              break;
            }
          }
        }
        break;
      }

      case 'king': {
        const offsets = [
          [-1, -1], [-1, 0], [-1, 1],
          [0, -1],           [0, 1],
          [1, -1], [1, 0], [1, 1]
        ];
        for (const [r, c] of offsets) {
          tryAddMove(row + r, col + c);
        }
        
        // Castling squares
        // Only if on starting rank and file
        const startRank = piece.color === 'white' ? 7 : 0;
        if (row === startRank && col === 4) {
          tryAddMove(row, col + 2); // Kingside
          tryAddMove(row, col - 2); // Queenside
        }
        break;
      }
    }
    
    return moves;
  }
  
  cloneGame(chessGame) {
    const newGame = new ChessGame({ isClone: true });
    
    // Copy board state
    newGame.board = chessGame.board.map(row => row.map(piece => piece ? { ...piece } : null));
    
    // Copy piece locations cache directly to avoid scanning the board
    if (chessGame.pieceLocations) {
      newGame.pieceLocations = {
        white: chessGame.pieceLocations.white.map(l => ({ row: l.row, col: l.col })),
        black: chessGame.pieceLocations.black.map(l => ({ row: l.row, col: l.col }))
      };
    } else {
      newGame._rebuildPieceLocations();
    }
    
    // Copy game state
    newGame.currentTurn = chessGame.currentTurn;
    newGame.gameStatus = chessGame.gameStatus;
    newGame.winner = chessGame.winner;
    newGame.inCheck = chessGame.inCheck;
    
    // Copy move history (shallow copy to prevent deep recursion)
    newGame.moveHistory = [...chessGame.moveHistory];
    
    // Copy castling rights - use shallow copy for performance instead of JSON.parse/stringify
    newGame.castlingRights = {
      white: { ...chessGame.castlingRights.white },
      black: { ...chessGame.castlingRights.black }
    };
    
    // Copy en passant target
    newGame.enPassantTarget = chessGame.enPassantTarget ? { ...chessGame.enPassantTarget } : null;
    
    // Copy move counters
    newGame.halfMoveClock = chessGame.halfMoveClock;
    newGame.fullMoveNumber = chessGame.fullMoveNumber;
    
    // Copy additional state if it exists
    if (chessGame.checkDetails) {
      newGame.checkDetails = { ...chessGame.checkDetails };
    }
    
    return newGame;
  }
  
  isMaximizing(color) {
    return color === 'white';
  }
}

module.exports = ChessAI;