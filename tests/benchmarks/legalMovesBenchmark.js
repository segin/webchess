
const ChessGame = require('../../src/shared/chessGame');

function runBenchmark() {
    const game = new ChessGame();

    // Setup a more complex position
    // e4 e5, Nf3 Nc6, Bc4 Bc5 (Italian Game)
    const moves = [
        { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } },
        { from: { row: 1, col: 4 }, to: { row: 3, col: 4 } },
        { from: { row: 7, col: 6 }, to: { row: 5, col: 5 } },
        { from: { row: 0, col: 1 }, to: { row: 2, col: 2 } },
        { from: { row: 7, col: 5 }, to: { row: 4, col: 2 } },
        { from: { row: 0, col: 5 }, to: { row: 2, col: 3 } }
    ];

    for (const move of moves) {
        game.makeMove(move);
    }

    console.log('--- Benchmark Started ---');
    console.log(`Initial Board State: Active game, Turn: ${game.currentTurn}`);

    const iterations = 1000;

    // Benchmark getAllLegalMoves
    const startLegal = process.hrtime.bigint();
    for (let i = 0; i < iterations; i++) {
        game.getAllLegalMoves(game.currentTurn);
    }
    const endLegal = process.hrtime.bigint();
    const durationLegal = Number(endLegal - startLegal) / 1000000; // ms

    console.log(`getAllLegalMoves: ${durationLegal.toFixed(2)}ms for ${iterations} calls`);
    console.log(`getAllLegalMoves Average: ${(durationLegal / iterations).toFixed(4)}ms/call`);
    console.log(`getAllLegalMoves Calls/Sec: ${(iterations / (durationLegal / 1000)).toFixed(2)}`);

    // Benchmark getAllValidMoves
    const startValid = process.hrtime.bigint();
    for (let i = 0; i < iterations; i++) {
        game.getAllValidMoves(game.currentTurn);
    }
    const endValid = process.hrtime.bigint();
    const durationValid = Number(endValid - startValid) / 1000000; // ms

    console.log(`getAllValidMoves: ${durationValid.toFixed(2)}ms for ${iterations} calls`);
    console.log(`getAllValidMoves Average: ${(durationValid / iterations).toFixed(4)}ms/call`);
    console.log(`getAllValidMoves Calls/Sec: ${(iterations / (durationValid / 1000)).toFixed(2)}`);
    console.log('--- Benchmark Ended ---');
}

runBenchmark();
