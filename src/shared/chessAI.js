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
      case 'easy': return 2;
      case 'medium': return 3;
      case 'hard': return 4;
      case 'expert': return 5;
      default: return 3;
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
    
    // Sort moves at root for better alpha-beta pruning efficiency
    // We can use a shallower search depth for ordering if needed, but here we just use static score
    const orderedMoves = this.orderMoves(chessGame, moves);
    
    // Root alpha-beta (we still need to track global best, but we can pass window)
    // Note: Since we are at root, we know who is maximizing/minimizing based on color
    let alpha = -Infinity;
    let beta = Infinity;

    for (const move of orderedMoves) {
      // Use !isMaximizing because we are making a move, so next turn is opponent
      const score = this.minimax(chessGame, move, this.maxDepth - 1, !this.isMaximizing(color), alpha, beta);
      
      if (color === 'white') {
        if (score > bestScore) {
          bestScore = score;
          bestMove = move;
        }
        alpha = Math.max(alpha, score);
      } else {
        if (score < bestScore) {
          bestScore = score;
          bestMove = move;
        }
        beta = Math.min(beta, score);
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
      if (tempGame.gameStatus !== 'active') {
        return this.evaluatePosition(tempGame);
      }
      // Use Quiescence Search at leaf nodes instead of raw evaluation
      return this.quiescence(tempGame, alpha, beta, isMaximizing, chessGame.currentTurn);
    }
    
    const moves = this.getAllValidMoves(tempGame, tempGame.currentTurn);
    if (moves.length === 0) {
      return this.evaluatePosition(tempGame);
    }
    const orderedMoves = this.orderMoves(tempGame, moves);
    
    if (isMaximizing) {
      let maxScore = -Infinity;
      for (const nextMove of orderedMoves) {
        const score = this.minimax(tempGame, nextMove, depth - 1, false, alpha, beta);
        maxScore = Math.max(maxScore, score);
        alpha = Math.max(alpha, score);
        if (beta <= alpha) break;
      }
      return maxScore;
    } else {
      let minScore = Infinity;
      for (const nextMove of orderedMoves) {
        const score = this.minimax(tempGame, nextMove, depth - 1, true, alpha, beta);
        minScore = Math.min(minScore, score);
        beta = Math.min(beta, score);
        if (beta <= alpha) break;
      }
      return minScore;
    }
  }

  // Quiescence Search to avoid horizon effect on captures
  quiescence(chessGame, alpha, beta, isMaximizing, rootColor) {
    const standPat = this.evaluatePosition(chessGame);
    
    if (isMaximizing) {
      if (standPat >= beta) return beta;
      alpha = Math.max(alpha, standPat);
    } else {
      if (standPat <= alpha) return alpha;
      beta = Math.min(beta, standPat);
    }
    
    // Generate only capture moves
    const allMoves = this.getAllValidMoves(chessGame, chessGame.currentTurn);
    const captureMoves = allMoves.filter(move => {
      const target = chessGame.board[move.to.row][move.to.col];
      return target !== null;
    });

    const orderedCaptures = this.orderMoves(chessGame, captureMoves);

    if (isMaximizing) {
      for (const move of orderedCaptures) {
        const tempGame = this.cloneGame(chessGame);
        const result = tempGame.makeMove(move, null, null, { silent: true });
        
        if (result.success) {
           const score = this.quiescence(tempGame, alpha, beta, false, rootColor);
           
           if (score >= beta) return beta;
           alpha = Math.max(alpha, score);
        }
      }
      return alpha;
    } else {
      for (const move of orderedCaptures) {
         const tempGame = this.cloneGame(chessGame);
         const result = tempGame.makeMove(move, null, null, { silent: true });
         
         if (result.success) {
           const score = this.quiescence(tempGame, alpha, beta, true, rootColor);
           
           if (score <= alpha) return alpha;
           beta = Math.min(beta, score);
         }
      }
      return beta;
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
    
    // Mobility (skip for easy mode to save performance)
    if (this.difficulty !== 'easy') {
       // Estimate mobility by checking valid moves for each side
       // This is expensive, so we might want to do it only for higher depths or simpler estimation
       // For now, let's just do a simplified center control bonus for valid moves in center
       
       // Note: true mobility requiring getValidMoves for every piece is O(N^2) relative to board size
       // Instead, let's rely on Quiescence Search + deeper search to find tactics.
       // But we can add a small bonus for Pieces in center 4x4
       
       // Center Control Bonus already covered slightly by position tables, 
       // but let's reinforce it for Knights and Pawns specifically? 
       // Actually, position tables are sufficient for static control.
       
       // Let's implement actual mobility count if we are in 'expert' mode?
       if (this.difficulty === 'expert' || this.difficulty === 'hard') {
           const whiteMoves = this.getAllValidMoves(chessGame, 'white').length;
           const blackMoves = this.getAllValidMoves(chessGame, 'black').length;
           
           // mobility weight: 5 points per available move (1/20th of a pawn)
           score += (whiteMoves - blackMoves) * 5;
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
    
    // Optimization: Use pieceLocations cache if available to avoid scanning empty squares
    if (chessGame.pieceLocations && chessGame.pieceLocations[color]) {
      const locations = chessGame.pieceLocations[color];
      for (const loc of locations) {
        // Double check piece is still there and matches color (safety check)
        const piece = chessGame.board[loc.row][loc.col];
        if (piece && piece.color === color) {
          const pieceMoves = this.getValidMovesForPiece(chessGame, loc.row, loc.col);
          moves.push(...pieceMoves);
        }
      }
    } else {
      // Fallback to full board scan if cache is missing
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          const piece = chessGame.board[row][col];
          if (piece && piece.color === color) {
            const pieceMoves = this.getValidMovesForPiece(chessGame, row, col);
            moves.push(...pieceMoves);
          }
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

  orderMoves(chessGame, moves) {
    return moves
      .map(move => ({
        move,
        score: this.scoreMove(chessGame, move)
      }))
      .sort((a, b) => b.score - a.score)
      .map(item => item.move);
  }

  scoreMove(chessGame, move) {
    let score = 0;
    const fromPiece = chessGame.board[move.from.row][move.from.col];
    const toPiece = chessGame.board[move.to.row][move.to.col];

    // Priority 1: Captures (MVV-LVA)
    if (toPiece) {
      score = 10 * this.pieceValues[toPiece.type] - this.pieceValues[fromPiece.type];
    }

    // Priority 2: Promotion
    if (move.promotion) {
      score += this.pieceValues[move.promotion];
    }

    // Priority 3: Check
    // (Optional: this is expensive to check here, but captures are the most important)

    return score;
  }
  
  cloneGame(chessGame) {
    const newGame = new ChessGame({ isClone: true });
    
    // Copy board state
    newGame.board = chessGame.board.map(row => row.map(piece => piece ? { ...piece } : null));
    
    // Rebuild piece locations cache for the new board
    // Optimize: shallow copy the arrays if they exist on source
    if (chessGame.pieceLocations) {
      newGame.pieceLocations = {
        white: [...chessGame.pieceLocations.white],
        black: [...chessGame.pieceLocations.black]
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