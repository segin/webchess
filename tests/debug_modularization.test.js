const ChessGame = require('../src/shared/chessGame');

describe('Modularization Debug', () => {
  test('pawn 2-square move should succeed', () => {
    const game = new ChessGame();
    const result = game.makeMove({ from: { row: 6, col: 4 }, to: { row: 4, col: 4 } });
    console.log('Result:', JSON.stringify(result, null, 2));
    expect(result.success).toBe(true);
  });
});
