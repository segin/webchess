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

    // Initialize required tables
    this.zobristTable = this.initZobrist();
    this.transpositionTable = new Map();
    this.historyTable = Array(64).fill(0).map(() => Array(64).fill(0));

    // Piece-Square Tables (White perspective, flipped for black)
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
  
  initZobrist() {
    const zobrist = {
      pieces: {}, // [pieceType][color][square]
      castling: {}, // [rights]
      enPassant: {}, // [file]
      turn: 0 // Random number for black turn
    };
    
    const pieces = ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king'];
    const colors = ['white', 'black'];
    
    // Initialize piece keys
    pieces.forEach(piece => {
      zobrist.pieces[piece] = { white: [], black: [] };
      for (let i = 0; i < 64; i++) {
        zobrist.pieces[piece].white[i] = this.random32();
        zobrist.pieces[piece].black[i] = this.random32();
      }
    });

    // Castling keys (16 possibilities for 4 bits)
    for (let i = 0; i < 16; i++) {
        zobrist.castling[i] = this.random32();
    }
    
    // En Passant keys (8 files)
    for (let i = 0; i < 8; i++) {
        zobrist.enPassant[i] = this.random32();
    }
    
    zobrist.turn = this.random32();
    return zobrist;
  }
  
  random32() {
    return Math.floor(Math.random() * 0xFFFFFFFF);
  }
  
  computeHash(chessGame) {
    let hash = 0;
    
    // Pieces
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = chessGame.board[row][col];
        if (piece) {
          const squareIndex = row * 8 + col;
          hash ^= this.zobristTable.pieces[piece.type][piece.color][squareIndex];
        }
      }
    }
    
    // Turn
    if (chessGame.currentTurn === 'black') {
      hash ^= this.zobristTable.turn;
    }
    
    // Castling
    let castlingRights = 0;
    if (chessGame.castlingRights.white.kingSide) castlingRights |= 1;
    if (chessGame.castlingRights.white.queenSide) castlingRights |= 2;
    if (chessGame.castlingRights.black.kingSide) castlingRights |= 4;
    if (chessGame.castlingRights.black.queenSide) castlingRights |= 8;
    hash ^= this.zobristTable.castling[castlingRights];
    
    // En Passant
    if (chessGame.enPassantTarget) {
      hash ^= this.zobristTable.enPassant[chessGame.enPassantTarget.col];
    }
    
    return hash;
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
    
    // Initialize Killer Moves table
    this.killerMoves = [];
    for(let i=0; i < this.maxDepth + 1; i++) this.killerMoves.push([null, null]);

    let bestMove = null;
    let alpha = -Infinity;
    let beta = Infinity;
    
    // Iterative Deepening
    // Start at depth 1 and increase up to maxDepth
    // This allows better move ordering at each new depth using results from previous
    const startTime = Date.now();
    const timeLimit = 5000; // 5 seconds soft limit for "Expert" (adjust as needed)
    
    // For 'expert', use iterative deepening. For others, just go straight to depth
    // Or we can use ID for all, but simple AI doesn't need it.
    // Let's use ID for Hard and Expert.
    const useID = (this.difficulty === 'expert' || this.difficulty === 'hard');
    const startDepth = useID ? 1 : this.maxDepth;
    
    for (let currentDepth = startDepth; currentDepth <= this.maxDepth; currentDepth++) {
        
        // Reset Alpha/Beta for new iteration? 
        // Aspiration windows could be used here, but let's keep it simple: -Inf to +Inf
        // But we want to preserve the best move order.
        
        let iterationBestMove = null;
        let iterationBestScore = color === 'white' ? -Infinity : Infinity;
        alpha = -Infinity;
        beta = Infinity;
        
        // Root move ordering using TT (which persists across iterations)
        const rootMoves = this.orderMoves(chessGame, moves, bestMove, currentDepth);

        for (const move of rootMoves) {
            // Check time (only for Expert/Hard)
            if (useID && currentDepth > 1 && (Date.now() - startTime > timeLimit)) {
                break; 
            }

            const score = this.minimax(chessGame, move, currentDepth - 1, !this.isMaximizing(color), alpha, beta);
            
            if (color === 'white') {
                if (score > iterationBestScore) {
                    iterationBestScore = score;
                    iterationBestMove = move;
                }
                alpha = Math.max(alpha, score);
            } else {
                if (score < iterationBestScore) {
                    iterationBestScore = score;
                    iterationBestMove = move;
                }
                beta = Math.min(beta, score);
            }
        }
        
        // If we completed the iteration (didn't timeout loop break handled inside minimax/loops?),
        // update the global best move.
        // Simple timeout check above only breaks the root loop.
        if (iterationBestMove) {
            bestMove = iterationBestMove;
        }
        
        if (useID && (Date.now() - startTime > timeLimit)) {
             break; // Stop deepening
        }
    }
    
    return bestMove;
  }
  
  minimax(chessGame, move, depth, isMaximizing, alpha, beta) {
    if (depth < 0) return this.evaluatePosition(chessGame);
    
    const tempGame = this.cloneGame(chessGame);
    const result = tempGame.makeMove(move, null, null, { silent: true });
    
    if (!result.success) return isMaximizing ? -Infinity : Infinity;

    const hash = this.computeHash(tempGame);
    const ttEntry = this.transpositionTable.get(hash);
    
    if (ttEntry && ttEntry.depth >= depth) {
      if (ttEntry.flag === 'exact') return ttEntry.score;
      if (ttEntry.flag === 'lowerbound') alpha = Math.max(alpha, ttEntry.score);
      if (ttEntry.flag === 'upperbound') beta = Math.min(beta, ttEntry.score);
      if (alpha >= beta) return ttEntry.score;
    }
    
    if (depth === 0 || tempGame.gameStatus !== 'active') {
      if (tempGame.gameStatus !== 'active') return this.evaluatePosition(tempGame);
      // Use Quiescence Search at leaf nodes instead of raw evaluation
      return this.quiescence(tempGame, alpha, beta, isMaximizing, chessGame.currentTurn);
    }
    
    const moves = this.getAllValidMoves(tempGame, tempGame.currentTurn);
    if (moves.length === 0) return this.evaluatePosition(tempGame);
    
    // Order moves: TT move first, then captures/killers
    const bestTTMove = (ttEntry && ttEntry.bestMove) ? ttEntry.bestMove : null;
    const orderedMoves = this.orderMoves(tempGame, moves, bestTTMove, depth);
    
    let bestMove = null;
    let score;
    let originalAlpha = alpha;
    
    if (isMaximizing) {
      let maxScore = -Infinity;
      for (const nextMove of orderedMoves) {
        score = this.minimax(tempGame, nextMove, depth - 1, false, alpha, beta);
        
        if (score > maxScore) {
            maxScore = score;
            bestMove = nextMove;
        }
        
        alpha = Math.max(alpha, score);
        if (beta <= alpha) {
            this.storeKillerMove(nextMove, depth);

            // History Heuristic: Update score for quiet moves
            const toPiece = tempGame.board[nextMove.to.row][nextMove.to.col];
            if (!toPiece) {
                const fromIdx = nextMove.from.row * 8 + nextMove.from.col;
                const toIdx = nextMove.to.row * 8 + nextMove.to.col;
                this.historyTable[fromIdx][toIdx] += depth * depth;
            }

            break;
        }
      }
      
      // Store in Transposition Table
      const flag = maxScore <= originalAlpha ? 'upperbound' : (maxScore >= beta ? 'lowerbound' : 'exact');
      this.transpositionTable.set(hash, {
          depth: depth,
          score: maxScore,
          flag: flag,
          bestMove: bestMove
      });
      
      return maxScore;
    } else {
      let minScore = Infinity;
      for (const nextMove of orderedMoves) {
        score = this.minimax(tempGame, nextMove, depth - 1, true, alpha, beta);
        
        if (score < minScore) {
            minScore = score;
            bestMove = nextMove;
        }

        beta = Math.min(beta, score);
        if (beta <= alpha) {
            this.storeKillerMove(nextMove, depth);

            // History Heuristic: Update score for quiet moves
            const toPiece = tempGame.board[nextMove.to.row][nextMove.to.col];
            if (!toPiece) {
                const fromIdx = nextMove.from.row * 8 + nextMove.from.col;
                const toIdx = nextMove.to.row * 8 + nextMove.to.col;
                this.historyTable[fromIdx][toIdx] += depth * depth;
            }

            break;
        }
      }
      
      // Store in Transposition Table
      const flag = minScore <= originalAlpha ? 'upperbound' : (minScore >= beta ? 'lowerbound' : 'exact');
      this.transpositionTable.set(hash, {
          depth: depth,
          score: minScore,
          flag: flag,
          bestMove: bestMove
      });

      return minScore;
    }
  }

  storeKillerMove(move, depth) {
      if (!this.killerMoves[depth]) this.killerMoves[depth] = [null, null];
      if (!this.isSameMove(move, this.killerMoves[depth][0])) {
          this.killerMoves[depth][1] = this.killerMoves[depth][0];
          this.killerMoves[depth][0] = move;
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
        const result = chessGame.makeMove(move, null, null, { silent: true });
        
        if (result.success) {
           const score = this.quiescence(chessGame, alpha, beta, false, rootColor);
           chessGame.undoMove();
           
           if (score >= beta) return beta;
           alpha = Math.max(alpha, score);
        }
      }
      return alpha;
    } else {
      for (const move of orderedCaptures) {
         const result = chessGame.makeMove(move, null, null, { silent: true });
         
         if (result.success) {
           const score = this.quiescence(chessGame, alpha, beta, true, rootColor);
           chessGame.undoMove();
           
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
    
    // Optimized helper to add move if valid (skips heavy validation)
    const tryAddMove = (toRow, toCol) => {
      // NOTE: Caller must ensure bounds and occupancy checks before calling this
      // to avoid overhead of creating objects for invalid moves.

      const move = {
        from: { row, col },
        to: { row: toRow, col: toCol }
      };

      // Lightweight validation: Only check if move puts own king in check
      // This skips format, turn, piece, and other redundant checks performed by validateMove
      if (!chessGame.wouldBeInCheck(move.from, move.to, piece.color, piece)) {
        moves.push(move);
      }
    };

    switch (piece.type) {
      case 'pawn': {
        const direction = piece.color === 'white' ? -1 : 1;
        const startRow = piece.color === 'white' ? 6 : 1;

        // Forward 1
        const r1 = row + direction;
        if (r1 >= 0 && r1 <= 7) {
            if (!chessGame.board[r1][col]) {
                tryAddMove(r1, col);

                // Forward 2 (only if on start row and forward 1 was empty)
                if (row === startRow) {
                    const r2 = row + 2 * direction;
                    // No need to check r2 bounds as startRow guarantees it
                    if (!chessGame.board[r2][col]) {
                        tryAddMove(r2, col);
                    }
                }
            }
        }

        // Captures
        const captureCols = [col - 1, col + 1];
        for (const c of captureCols) {
            if (c >= 0 && c <= 7) {
                const target = chessGame.board[r1][c]; // r1 is capture row (same as forward 1)
                if (target && target.color !== piece.color) {
                    tryAddMove(r1, c);
                } else if (chessGame.enPassantTarget &&
                           chessGame.enPassantTarget.row === r1 &&
                           chessGame.enPassantTarget.col === c) {
                     // En Passant
                     tryAddMove(r1, c);
                }
            }
        }
        break;
      }

      case 'knight': {
        const offsets = [
          [-2, -1], [-2, 1], [-1, -2], [-1, 2],
          [1, -2], [1, 2], [2, -1], [2, 1]
        ];
        for (const [dr, dc] of offsets) {
          const r = row + dr;
          const c = col + dc;
          if (r >= 0 && r <= 7 && c >= 0 && c <= 7) {
              const target = chessGame.board[r][c];
              if (!target || target.color !== piece.color) {
                  tryAddMove(r, c);
              }
          }
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
        for (const [dr, dc] of offsets) {
          const r = row + dr;
          const c = col + dc;
          if (r >= 0 && r <= 7 && c >= 0 && c <= 7) {
              const target = chessGame.board[r][c];
              if (!target || target.color !== piece.color) {
                  tryAddMove(r, c);
              }
          }
        }
        
        // Castling
        // Only if on starting rank and file
        const startRank = piece.color === 'white' ? 7 : 0;
        if (row === startRank && col === 4) {
            // Kingside
            const kingsideDest = { row, col: 6 };
            if (chessGame.canCastle({ row, col }, kingsideDest, piece.color)) {
                moves.push({ from: { row, col }, to: kingsideDest });
            }

            // Queenside
            const queensideDest = { row, col: 2 };
            if (chessGame.canCastle({ row, col }, queensideDest, piece.color)) {
                moves.push({ from: { row, col }, to: queensideDest });
            }
        }
        break;
      }
    }
    
    return moves;
  }

  orderMoves(chessGame, moves, ttMove, depth) {
    return moves
      .map(move => ({
        move,
        score: this.scoreMove(chessGame, move, ttMove, depth)
      }))
      .sort((a, b) => b.score - a.score)
      .map(item => item.move);
  }

  scoreMove(chessGame, move, ttMove, depth) {
    // 1. PV Move (Best move from previous search/TT)
    if (ttMove && 
        move.from.row === ttMove.from.row && 
        move.from.col === ttMove.from.col &&
        move.to.row === ttMove.to.row &&
        move.to.col === ttMove.to.col) {
        return 20000;
    }

    let score = 0;
    const fromPiece = chessGame.board[move.from.row][move.from.col];
    const toPiece = chessGame.board[move.to.row][move.to.col];

    // 2. Captures (MVV-LVA)
    if (toPiece) {
      score = 10 * this.pieceValues[toPiece.type] - this.pieceValues[fromPiece.type] + 1000;
    }

    // 3. Killer Moves
    if (this.killerMoves && this.killerMoves[depth]) {
        if (this.isSameMove(move, this.killerMoves[depth][0])) score += 900;
        else if (this.isSameMove(move, this.killerMoves[depth][1])) score += 800;
    }

    // 4. Promotion
    if (move.promotion) {
      score += this.pieceValues[move.promotion] + 500;
    }

    // 5. History Heuristic
    if (this.historyTable) {
        const fromIdx = move.from.row * 8 + move.from.col;
        const toIdx = move.to.row * 8 + move.to.col;
        score += this.historyTable[fromIdx][toIdx];
    }

    return score;
  }
  
  isSameMove(move1, move2) {
      if (!move1 || !move2) return false;
      return move1.from.row === move2.from.row && 
             move1.from.col === move2.from.col &&
             move1.to.row === move2.to.row && 
             move1.to.col === move2.to.col;
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