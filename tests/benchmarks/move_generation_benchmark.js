
const ChessGame = require('../../src/shared/chessGame');

function suppressLogs() {
    const noop = () => {};
    console.log = noop;
    console.warn = noop;
    console.error = noop;
}

function runBenchmark() {
    // Save original console
    const originalLog = console.log;

    suppressLogs();

    try {
        originalLog('Running Move Generation Benchmark (Logs Suppressed)...');

        // Scenario 1: Initial Position
        const gameStart = new ChessGame();
        measurePerformance('Initial Position', gameStart, originalLog);

        // Scenario 2: Complex Middlegame
        const gameMiddle = new ChessGame();
        const complexMoves = [
            { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } },
            { from: { row: 1, col: 4 }, to: { row: 3, col: 4 } },
            { from: { row: 7, col: 6 }, to: { row: 5, col: 5 } },
            { from: { row: 0, col: 1 }, to: { row: 2, col: 2 } },
            { from: { row: 7, col: 5 }, to: { row: 3, col: 1 } },
            { from: { row: 1, col: 0 }, to: { row: 2, col: 0 } },
            { from: { row: 3, col: 1 }, to: { row: 4, col: 0 } },
            { from: { row: 0, col: 6 }, to: { row: 2, col: 5 } },
            { from: { row: 7, col: 4 }, to: { row: 7, col: 6 } }
        ];

        for (const move of complexMoves) {
            gameMiddle.makeMove(move);
        }
        measurePerformance('Middlegame', gameMiddle, originalLog);

        // Scenario 3: Endgame (Manual Board Setup)
        const gameEnd = new ChessGame();
        gameEnd.board = Array(8).fill(null).map(() => Array(8).fill(null));
        gameEnd.board[0][0] = { type: 'king', color: 'black' };
        gameEnd.board[7][4] = { type: 'king', color: 'white' };
        gameEnd.board[5][4] = { type: 'rook', color: 'white' };
        gameEnd.currentTurn = 'white';
        measurePerformance('Endgame (K+R vs K)', gameEnd, originalLog);

        // Scenario 4: Stalemate (Worst Case for hasValidMoves)
        const gameStalemate = new ChessGame();
        gameStalemate.board = Array(8).fill(null).map(() => Array(8).fill(null));
        // Black king at h8 (0,7), White King at f7 (1,5), White Queen at g6 (2,6) - Stalemate?
        // White King f7 (1,5)
        // White Queen g6 (2,6)
        // Black King h8 (0,7)
        // Queen covers g8, h7, h6, h5, etc.
        // King covers g8, g7, f8?
        // Let's set up a known stalemate.
        // Black King a8 (0,0)
        // White King c7 (1,2) -> No, c7 is adjacent to a8? No.
        // Black King a8.
        // White Pawn a7 (1,0) - No, black moves down.
        // Black King a8. White Queen c7?? No checks.
        // Stalemate: White King f7, White Queen g6 is NOT stalemate for Black King h8.
        // Black King h8. Moves: g8 (covered by Q), h7 (covered by Q).
        // It is stalemate.
        gameStalemate.board[0][7] = { type: 'king', color: 'black' };
        gameStalemate.board[1][5] = { type: 'king', color: 'white' };
        gameStalemate.board[2][6] = { type: 'queen', color: 'white' };
        gameStalemate.currentTurn = 'black';
        measurePerformance('Stalemate (Worst Case)', gameStalemate, originalLog);

    } catch (e) {
        originalLog('Error running benchmark:', e);
    }
}

function measurePerformance(label, game, log) {
    const iterations = 1000;
    const color = game.currentTurn;

    // Measure hasValidMoves
    let start = process.hrtime.bigint();
    for (let i = 0; i < iterations; i++) {
        game.hasValidMoves(color);
    }
    let end = process.hrtime.bigint();
    let duration = Number(end - start) / 1e6; // ms
    log(`[${label}] hasValidMoves: ${duration.toFixed(2)}ms total, ${(duration/iterations).toFixed(4)}ms avg`);

    // Measure getAllValidMoves
    start = process.hrtime.bigint();
    for (let i = 0; i < iterations; i++) {
        game.getAllValidMoves(color);
    }
    end = process.hrtime.bigint();
    duration = Number(end - start) / 1e6; // ms
    log(`[${label}] getAllValidMoves: ${duration.toFixed(2)}ms total, ${(duration/iterations).toFixed(4)}ms avg`);
    log('---');
}

runBenchmark();
