const GameManager = require('../src/server/gameManager');
const ChessGame = require('../src/shared/chessGame');

describe('Undo Functionality Comprehensive Tests', () => {

    describe('ChessGame Undo Logic', () => {
        let game;

        beforeEach(() => {
            game = new ChessGame();
        });

        test('should undo a simple move', () => {
            // e2 -> e4
            const move = { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } };
            game.makeMove(move);

            expect(game.board[4][4]).not.toBeNull();
            expect(game.board[6][4]).toBeNull();
            expect(game.currentTurn).toBe('black');
            expect(game.moveHistory.length).toBe(1);

            const result = game.undoMove();
            expect(result.success).toBe(true);

            // Verify board restoration
            expect(game.board[6][4]).not.toBeNull();
            expect(game.board[6][4].type).toBe('pawn');
            expect(game.board[6][4].color).toBe('white');
            expect(game.board[4][4]).toBeNull();

            // Verify state restoration
            expect(game.currentTurn).toBe('white');
            expect(game.moveHistory.length).toBe(0);
        });

        test('should undo a capture', () => {
            // Setup capture scenario
            // 1. e4 d5
            game.makeMove({ from: { row: 6, col: 4 }, to: { row: 4, col: 4 } }); // White e4
            game.makeMove({ from: { row: 1, col: 3 }, to: { row: 3, col: 3 } }); // Black d5

            // 2. exd5
            game.makeMove({ from: { row: 4, col: 4 }, to: { row: 3, col: 3 } }); // White captures d5

            expect(game.board[3][3].type).toBe('pawn');
            expect(game.board[3][3].color).toBe('white');

            const result = game.undoMove(); // Undo capture
            expect(result.success).toBe(true);

            // Verify restoration
            expect(game.board[4][4]).not.toBeNull(); // White pawn back at e4
            expect(game.board[4][4].color).toBe('white');
            expect(game.board[3][3]).not.toBeNull(); // Black pawn back at d5
            expect(game.board[3][3].color).toBe('black');
            expect(game.currentTurn).toBe('white');
        });

        test('should undo castling (kingside)', () => {
            // Clear path for white kingside castling
            game.board[7][5] = null; // Remove Bishop
            game.board[7][6] = null; // Remove Knight

            // 1. e4 (just to burn a move and set turn to black, wait... need white to move)
            // Just move castling right away if valid (assuming valid board setup for tests)
            // But game enforces turn.

            // Move: White Castles
            const kingStart = { row: 7, col: 4 };
            const kingDest = { row: 7, col: 6 };

            const result = game.makeMove({ from: kingStart, to: kingDest });
            expect(result.success).toBe(true);

            expect(game.board[7][6].type).toBe('king');
            expect(game.board[7][5].type).toBe('rook'); // Rook moved
            expect(game.castlingRights.white.kingside).toBe(false);

            // Undo
            const undoResult = game.undoMove();
            expect(undoResult.success).toBe(true);

            expect(game.board[7][4].type).toBe('king');
            expect(game.board[7][6]).toBeNull();
            expect(game.board[7][7].type).toBe('rook'); // Rook returned
            expect(game.board[7][5]).toBeNull();
            expect(game.castlingRights.white.kingside).toBe(true); // Rights restored
        });

        test('should undo en passant', () => {
            // Setup En Passant
            // 1. e4 (White)
            game.makeMove({ from: { row: 6, col: 4 }, to: { row: 4, col: 4 } });
            // 2. ... (Black moves something else to burn turn, e.g., a6)
            game.makeMove({ from: { row: 1, col: 0 }, to: { row: 2, col: 0 } });
            // 3. e5 (White)
            game.makeMove({ from: { row: 4, col: 4 }, to: { row: 3, col: 4 } });
            // 4. d5 (Black, double move)
            game.makeMove({ from: { row: 1, col: 3 }, to: { row: 3, col: 3 } });

            expect(game.enPassantTarget).toEqual({ row: 2, col: 3 }); // Target behind d5 pawn

            // 5. exd6 (White en passant capture)
            // Captures pawn at (3,3) moving to (2,3)
            const epMove = { from: { row: 3, col: 4 }, to: { row: 2, col: 3 } };
            const epResult = game.makeMove(epMove);
            expect(epResult.success).toBe(true);

            expect(game.board[3][3]).toBeNull(); // Captured pawn removed
            expect(game.board[2][3].type).toBe('pawn'); // White pawn at dest

            // Undo
            const undoResult = game.undoMove();
            expect(undoResult.success).toBe(true);

            expect(game.board[2][3]).toBeNull(); // White pawn moved back
            expect(game.board[3][4].type).toBe('pawn'); // White pawn at start
            expect(game.board[3][3].type).toBe('pawn'); // Black captured pawn RESTORED
            expect(game.board[3][3].color).toBe('black');
            expect(game.enPassantTarget).toEqual({ row: 2, col: 3 }); // Target restored
        });

        test('should undo promotion', () => {
            // Setup promotion
            // Place white pawn at a7, clear a8
            game.board[1][0] = { type: 'pawn', color: 'white' };
            game.board[0][0] = null;
            // It needs to be White's turn

            const move = { from: { row: 1, col: 0 }, to: { row: 0, col: 0 }, promotion: 'queen' };
            const result = game.makeMove(move);
            expect(result.success).toBe(true);

            expect(game.board[0][0].type).toBe('queen');

            // Undo
            const undoResult = game.undoMove();
            expect(undoResult.success).toBe(true);

            expect(game.board[0][0]).toBeNull();
            expect(game.board[1][0].type).toBe('pawn');
            expect(game.board[1][0].color).toBe('white');
        });

        test('should handle no moves to undo', () => {
            const result = game.undoMove();
            expect(result.success).toBe(false);
            expect(result.errorCode).toBe('NO_MOVES_TO_UNDO');
        });

        test('should restore game status from checkmate', () => {
            // Fool's Mate
            game.makeMove({ from: { row: 6, col: 5 }, to: { row: 5, col: 5 } }); // f3
            game.makeMove({ from: { row: 1, col: 4 }, to: { row: 3, col: 4 } }); // e5
            game.makeMove({ from: { row: 6, col: 6 }, to: { row: 4, col: 6 } }); // g4
            const mateResult = game.makeMove({ from: { row: 0, col: 3 }, to: { row: 4, col: 7 } }); // Qh4#

            expect(mateResult.success).toBe(true);
            expect(game.gameStatus).toBe('checkmate');
            expect(game.winner).toBe('black');

            // Undo checkmate
            const undoResult = game.undoMove();
            expect(undoResult.success).toBe(true);

            expect(game.gameStatus).toBe('active');
            expect(game.winner).toBeNull();
            expect(game.currentTurn).toBe('black');
            expect(game.board[4][7]).toBeNull(); // Queen moved back
        });
    });

    describe('GameManager Undo Integration', () => {
        let gameManager;
        let gameId;
        const hostId = 'player1';
        const guestId = 'player2';

        beforeEach(() => {
            gameManager = new GameManager();
            gameId = gameManager.createGame(hostId);
            gameManager.joinGame(gameId, guestId);
        });

        afterEach(() => {
            gameManager.cleanup();
        });

        test('should allow player to undo move', () => {
            // Make a move
            gameManager.makeMove(gameId, hostId, { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } });

            const undoResult = gameManager.undoMove(gameId, hostId);
            expect(undoResult.success).toBe(true);

            const game = gameManager.getGame(gameId);
            expect(game.chess.moveHistory.length).toBe(0);
        });

        test('should reject undo from non-participant', () => {
            gameManager.makeMove(gameId, hostId, { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } });

            const undoResult = gameManager.undoMove(gameId, 'stranger');
            expect(undoResult.success).toBe(false);
            expect(undoResult.message).toContain('not in this game');
        });

        test('should reject undo for non-existent game', () => {
            const undoResult = gameManager.undoMove('INVALID', hostId);
            expect(undoResult.success).toBe(false);
            expect(undoResult.message).toBe('Game not found');
        });

        test('should revert finished game status in manager', () => {
             // Fool's Mate via GameManager
            gameManager.makeMove(gameId, hostId, { from: { row: 6, col: 5 }, to: { row: 5, col: 5 } }); // f3
            gameManager.makeMove(gameId, guestId, { from: { row: 1, col: 4 }, to: { row: 3, col: 4 } }); // e5
            gameManager.makeMove(gameId, hostId, { from: { row: 6, col: 6 }, to: { row: 4, col: 6 } }); // g4

            // Checkmate move
            const mateResult = gameManager.makeMove(gameId, guestId, { from: { row: 0, col: 3 }, to: { row: 4, col: 7 } }); // Qh4#

            // Manually finish game if makeMove didn't (simulate app logic)
            if (mateResult.gameState.gameStatus === 'checkmate') {
                 gameManager.endGame(gameId, 'checkmate', guestId);
            }

            const game = gameManager.getGame(gameId);
            expect(game.status).toBe('finished');

            // Undo
            const undoResult = gameManager.undoMove(gameId, guestId);
            expect(undoResult.success).toBe(true);

            expect(game.status).toBe('active');
            expect(game.winner).toBeNull();
        });
    });
});
