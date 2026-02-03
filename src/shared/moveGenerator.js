/**
 * MoveGenerator - Handles chess move generation and piece-specific validation
 */
class MoveGenerator {
  constructor(game) {
    this.game = game;
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
    const target = this.game.board[to.row][to.col];

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
    const colDiff = to.col - from.col;
    const absColDiff = Math.abs(colDiff);

    if ((piece.color === 'white' && rowDiff > 0) || (piece.color === 'black' && rowDiff < 0)) {
      return false;
    }

    if (rowDiff !== direction && rowDiff !== 2 * direction) {
      return false;
    }

    if (colDiff === 0) {
      if (rowDiff === direction) {
        return !this.game.board[to.row][to.col];
      }
      if (rowDiff === 2 * direction && from.row === startRow) {
        const pathClear = !this.game.board[from.row + direction][from.col] && !this.game.board[to.row][to.col];
        if (!pathClear) {
          console.log(`DEBUG: Pawn 2-square move blocked at ${from.row + direction},${from.col} or ${to.row},${to.col}`);
        }
        return pathClear;
      }
      return false;
    }

    if (absColDiff === 1 && rowDiff === direction) {
      const target = this.game.board[to.row][to.col];
      if (target && target.color !== piece.color) {
        return true;
      }
      if (this.game.enPassantTarget &&
        to.row === this.game.enPassantTarget.row &&
        to.col === this.game.enPassantTarget.col) {
        return true;
      }
      return false;
    }

    return false;
  }

  isValidRookMove(from, to) {
    if (!this.isValidSquare(from) || !this.isValidSquare(to)) {
      return false;
    }
    const isHorizontal = from.row === to.row && from.col !== to.col;
    const isVertical = from.col === to.col && from.row !== to.row;
    return isHorizontal || isVertical;
  }

  isValidKnightMove(from, to) {
    if (!this.isValidSquare(from) || !this.isValidSquare(to)) {
      return false;
    }
    const rowDiff = Math.abs(to.row - from.row);
    const colDiff = Math.abs(to.col - from.col);
    return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
  }

  isValidBishopMove(from, to) {
    if (!this.isValidSquare(from) || !this.isValidSquare(to)) {
      return false;
    }
    return Math.abs(to.row - from.row) === Math.abs(to.col - from.col) && from.row !== to.row;
  }

  isValidQueenMove(from, to) {
    return this.isValidRookMove(from, to) || this.isValidBishopMove(from, to);
  }

  isValidKingMove(from, to, piece) {
    if (!this.isValidSquare(from) || !this.isValidSquare(to)) {
      return false;
    }
    const rowDiff = Math.abs(to.row - from.row);
    const colDiff = Math.abs(to.col - from.col);
    return rowDiff <= 1 && colDiff <= 1 && (rowDiff > 0 || colDiff > 0);
  }

  isPathClear(from, to) {
    const rowStep = Math.sign(to.row - from.row);
    const colStep = Math.sign(to.col - from.col);
    
    let currentRow = from.row + rowStep;
    let currentCol = from.col + colStep;
    
    while (currentRow !== to.row || currentCol !== to.col) {
      if (this.game.board[currentRow][currentCol]) {
        return false;
      }
      currentRow += rowStep;
      currentCol += colStep;
    }
    
    return true;
  }

  isBlockingSquare(blockSquare, attackerPos, kingPos) {
    const rowDir = kingPos.row - attackerPos.row;
    const colDir = kingPos.col - attackerPos.col;
    const distance = Math.max(Math.abs(rowDir), Math.abs(colDir));
    if (distance === 0) return false;

    const rowStep = rowDir / distance;
    const colStep = colDir / distance;

    let currentRow = attackerPos.row + rowStep;
    let currentCol = attackerPos.col + colStep;
    let stepCount = 0;
    while ((Math.round(currentRow) !== kingPos.row || Math.round(currentCol) !== kingPos.col) && stepCount < 8) {
      if (Math.round(currentRow) === blockSquare.row && Math.round(currentCol) === blockSquare.col) {
        return true;
      }
      currentRow += rowStep;
      currentCol += colStep;
      stepCount++;
    }
    return false;
  }
}

module.exports = MoveGenerator;
