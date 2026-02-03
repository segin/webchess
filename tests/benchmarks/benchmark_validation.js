
const ChessGame = require('../../src/shared/chessGame');

const runBenchmark = () => {
    console.log('Starting benchmark for makeMove (stressing updateGameState validation)...');

    const iterations = 1000;
    const moves = [
        { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } }, // e4
        { from: { row: 1, col: 4 }, to: { row: 3, col: 4 } }, // e5
        { from: { row: 7, col: 6 }, to: { row: 5, col: 5 } }, // Nf3
        { from: { row: 0, col: 1 }, to: { row: 2, col: 2 } }, // Nc6
        { from: { row: 7, col: 5 }, to: { row: 4, col: 2 } }, // Bc4
        { from: { row: 0, col: 5 }, to: { row: 3, col: 2 } }, // Bc5
    ];

    let totalTime = 0;

    for (let i = 0; i < iterations; i++) {
        const game = new ChessGame();

        const start = process.hrtime();

        for (const move of moves) {
            game.makeMove(move.from, move.to);
        }

        const end = process.hrtime(start);
        totalTime += (end[0] * 1000 + end[1] / 1e6);
    }

    const avgTimePerGame = totalTime / iterations;
    const avgTimePerMove = totalTime / (iterations * moves.length);

    console.log(`Total games: ${iterations}`);
    console.log(`Moves per game: ${moves.length}`);
    console.log(`Total time: ${totalTime.toFixed(2)}ms`);
    console.log(`Average time per game: ${avgTimePerGame.toFixed(4)}ms`);
    console.log(`Average time per move: ${avgTimePerMove.toFixed(4)}ms`);
};

runBenchmark();
