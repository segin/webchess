importScripts('/shared.bundle.js');

self.onerror = function(error) {
    self.postMessage({
        type: 'ERROR',
        error: error.message || error.toString()
    });
};

// Difficulty levels map to search depths: easy 2, medium 3, hard 4, expert 5
const DIFFICULTY_DEPTHS = {
    easy: 2,
    medium: 3,
    hard: 4,
    expert: 5
};

let aiInstance = null;
let gameInstance = null;

self.onmessage = function(e) {
    const { type, data } = e.data;

    if (type === 'INIT') {
        // ChessAI accepts a difficulty name and resolves the depth itself
        // (matching DIFFICULTY_DEPTHS above); unknown values fall back to medium.
        const difficulty = DIFFICULTY_DEPTHS[data.difficulty] ? data.difficulty : 'medium';
        aiInstance = new globalThis.ChessAI(difficulty);
        gameInstance = new globalThis.ChessGame();
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
            const castlingPart = parts[2] || '-';
            const enPassantPart = parts[3] || '-';

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

            // Restore castling rights from FEN
            gameInstance.castlingRights = {
                white: {
                    kingside: castlingPart.includes('K'),
                    queenside: castlingPart.includes('Q')
                },
                black: {
                    kingside: castlingPart.includes('k'),
                    queenside: castlingPart.includes('q')
                }
            };

            // Restore en passant target from FEN (e.g. "e3")
            if (enPassantPart && enPassantPart !== '-') {
                gameInstance.enPassantTarget = {
                    row: 8 - parseInt(enPassantPart[1], 10),
                    col: enPassantPart.charCodeAt(0) - 97
                };
            } else {
                gameInstance.enPassantTarget = null;
            }

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
