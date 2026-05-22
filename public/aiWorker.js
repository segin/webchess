importScripts('/shared.bundle.js');

self.onerror = function(error) {
    self.postMessage({
        type: 'ERROR',
        error: error.message || error.toString()
    });
};

let aiInstance = null;
let gameInstance = null;

self.onmessage = function(e) {
    const { type, data } = e.data;

    if (type === 'INIT') {
        const depth = data.difficulty === 'hard' ? 4 : (data.difficulty === 'medium' ? 3 : 2);
        aiInstance = new self.ChessAI(depth);
        gameInstance = new self.ChessGame();
        self.postMessage({ type: 'INITIALIZED' });
    } else if (type === 'CALCULATE_MOVE') {
        if (!aiInstance || !gameInstance) return;

        // Load FEN or state
        const fen = data.fen;
        try {
            // Reconstruct board from FEN
            const parts = fen.split(' ');
            const boardPart = parts[0];
            const turnPart = parts[1];
            
            gameInstance.board = Array(8).fill(null).map(() => Array(8).fill(null));
            
            const rows = boardPart.split('/');
            for (let i = 0; i < 8; i++) {
                let col = 0;
                for (let char of rows[i]) {
                    if (/\d/.test(char)) {
                        col += parseInt(char);
                    } else {
                        const isWhite = char === char.toUpperCase();
                        const typeMap = { 'p': 'pawn', 'r': 'rook', 'n': 'knight', 'b': 'bishop', 'q': 'queen', 'k': 'king' };
                        gameInstance.board[i][col] = {
                            type: typeMap[char.toLowerCase()],
                            color: isWhite ? 'white' : 'black'
                        };
                        col++;
                    }
                }
            }
            
            gameInstance.currentTurn = turnPart === 'w' ? 'white' : 'black';
            gameInstance.stateManager.currentTurn = gameInstance.currentTurn;
            
            if (typeof gameInstance._rebuildPieceLocations === 'function') {
                gameInstance._rebuildPieceLocations();
            }

            const startTime = Date.now();
            const bestMove = aiInstance.getBestMove(gameInstance);
            const timeTaken = Date.now() - startTime;

            self.postMessage({
                type: 'MOVE_CALCULATED',
                data: {
                    move: bestMove,
                    timeTaken: timeTaken
                }
            });
        } catch (err) {
            self.postMessage({
                type: 'ERROR',
                error: err.toString()
            });
        }
    }
};
