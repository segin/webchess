
const { performance } = require('perf_hooks');

const board = Array(8).fill(null).map(() => Array(8).fill(null));
// Pawns
for (let i = 0; i < 8; i++) {
  board[1][i] = { type: 'pawn', color: 'black' };
  board[6][i] = { type: 'pawn', color: 'white' };
}
board[0][0] = { type: 'rook', color: 'black' };
board[0][7] = { type: 'rook', color: 'black' };
board[7][0] = { type: 'rook', color: 'white' };
board[7][7] = { type: 'rook', color: 'white' };

const ITERATIONS = 100000;

function bench(name, fn) {
  // Warmup
  for (let i = 0; i < 1000; i++) fn();

  const start = performance.now();
  for (let i = 0; i < ITERATIONS; i++) fn();
  const end = performance.now();
  console.log(`${name}: ${(end - start).toFixed(2)}ms`);
}

bench('Current (map + spread)', () => {
  return board.map(row => row.map(piece => piece ? { ...piece } : null));
});

bench('Manual loop + spread', () => {
  const newBoard = new Array(8);
  for (let i = 0; i < 8; i++) {
    const row = board[i];
    const newRow = new Array(8);
    for (let j = 0; j < 8; j++) {
      const piece = row[j];
      newRow[j] = piece ? { ...piece } : null;
    }
    newBoard[i] = newRow;
  }
  return newBoard;
});

bench('Manual loop + explicit assignment', () => {
  const newBoard = new Array(8);
  for (let i = 0; i < 8; i++) {
    const row = board[i];
    const newRow = new Array(8);
    for (let j = 0; j < 8; j++) {
      const piece = row[j];
      if (piece) {
        newRow[j] = { type: piece.type, color: piece.color };
      } else {
        newRow[j] = null;
      }
    }
    newBoard[i] = newRow;
  }
  return newBoard;
});

bench('Manual loop + row.map (mixed)', () => {
    const newBoard = new Array(8);
    for (let i = 0; i < 8; i++) {
        newBoard[i] = board[i].map(piece => piece ? { type: piece.type, color: piece.color } : null);
    }
    return newBoard;
});

const castlingRights = {
    white: { kingside: true, queenside: true },
    black: { kingside: true, queenside: true }
};

bench('Castling: Spread (shallow inner)', () => {
    return { ...castlingRights };
});

bench('Castling: Deep Clone (manual)', () => {
    return {
        white: { kingside: castlingRights.white.kingside, queenside: castlingRights.white.queenside },
        black: { kingside: castlingRights.black.kingside, queenside: castlingRights.black.queenside }
    };
});

const moveHistory = Array(100).fill({ from: {row: 6, col: 4}, to: {row: 4, col: 4}, piece: 'pawn', color: 'white' });

bench('MoveHistory: spread', () => {
    return [...moveHistory];
});

bench('MoveHistory: slice', () => {
    return moveHistory.slice();
});
