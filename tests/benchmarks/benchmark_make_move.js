const ChessGame = require('../../src/shared/chessGame');

const runBenchmark = () => {
    console.log('Starting benchmark for makeMove...');

    // We will play a short sequence of moves many times
    // 1. e4 e5 2. Nf3 Nc6 3. Bb5 a6
    const moves = [
        { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } }, // e4
        { from: { row: 1, col: 4 }, to: { row: 3, col: 4 } }, // e5
        { from: { row: 7, col: 6 }, to: { row: 5, col: 5 } }, // Nf3
        { from: { row: 0, col: 1 }, to: { row: 2, col: 2 } }, // Nc6
        { from: { row: 7, col: 5 }, to: { row: 3, col: 1 } }, // Bb5
        { from: { row: 1, col: 0 }, to: { row: 2, col: 0 } }, // a6
    ];

    const iterations = 1000;
    const start = process.hrtime();

    let moveCount = 0;
    for (let i = 0; i < iterations; i++) {
        const game = new ChessGame();
        for (const move of moves) {
            const result = game.makeMove(move.from, move.to);
            if (!result.success) {
                console.error('Move failed:', result);
                process.exit(1);
            }
            moveCount++;
        }
    }

    const end = process.hrtime(start);
    const timeInMs = (end[0] * 1000 + end[1] / 1e6);
    const avgTimePerGame = timeInMs / iterations;
    const avgTimePerMove = timeInMs / moveCount;

    console.log(`Total time for ${iterations} games (${moveCount} moves): ${timeInMs.toFixed(2)}ms`);
    console.log(`Average time per game: ${avgTimePerGame.toFixed(4)}ms`);
    console.log(`Average time per move: ${avgTimePerMove.toFixed(4)}ms`);

    return avgTimePerMove;
};

runBenchmark();
