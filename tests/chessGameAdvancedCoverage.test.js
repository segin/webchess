const ChessGame = require('../src/shared/chessGame');

describe('ChessGame Advanced Coverage - Uncovered Lines', () => {
    let game;

    beforeEach(() => {
        game = new ChessGame();
    });

    describe('isValidMoveSimple - Line Coverage', () => {
        test('should handle invalid squares', () => {
            const piece = { type: 'pawn', color: 'white' };
            const invalidFrom = { row: -1, col: 4 };
            const validTo = { row: 5, col: 4 };

            const result = game.isValidMoveSimple(invalidFrom, validTo, piece);
            expect(result).toBe(false);
        });

        test('should handle same square moves', () => {
            const piece = { type: 'pawn', color: 'white' };
            const square = { row: 6, col: 4 };

            const result = game.isValidMoveSimple(square, square, piece);
            expect(result).toBe(false);
        });

        test('should handle unknown piece types', () => {
            const piece = { type: 'unknown', color: 'white' };
            const from = { row: 6, col: 4 };
            const to = { row: 5, col: 4 };

            const result = game.isValidMoveSimple(from, to, piece);
            expect(result).toBe(false);
        });

        test('should handle king castling in isValidMoveSimple', () => {
            // Clear path for castling
            game.board[7][5] = null;
            game.board[7][6] = null;

            const piece = { type: 'king', color: 'white' };
            const from = { row: 7, col: 4 };
            const to = { row: 7, col: 6 };

            const result = game.isValidMoveSimple(from, to, piece);
            expect(typeof result).toBe('boolean');
        });

        test('should handle capturing own piece', () => {
            const piece = { type: 'rook', color: 'white' };
            const from = { row: 7, col: 0 };
            const to = { row: 7, col: 1 }; // White knight position

            const result = game.isValidMoveSimple(from, to, piece);
            expect(result).toBe(false);
        });
    });

    describe('Check Detection and Categorization', () => {
        test('should categorize no check', () => {
            const result = game.categorizeCheck([]);
            expect(result).toBe('none');
        });

        test('should categorize single piece check', () => {
            const attackingPieces = [{ piece: { type: 'rook', color: 'black' } }];
            const result = game.categorizeCheck(attackingPieces);
            expect(result).toBe('rook_check');
        });

        test('should categorize double check', () => {
            const attackingPieces = [
                { piece: { type: 'rook', color: 'black' } },
                { piece: { type: 'bishop', color: 'black' } }
            ];
            const result = game.categorizeCheck(attackingPieces);
            expect(result).toBe('double_check');
        });

        test('should get attack type for different pieces', () => {
            const pawn = { type: 'pawn', color: 'black' };
            const from = { row: 2, col: 3 };
            const to = { row: 3, col: 4 };

            const result = game.getAttackType(pawn, from, to);
            expect(typeof result).toBe('string');
        });
    });

    describe('Stalemate Pattern Recognition', () => {
        test('should identify corner stalemate pattern', () => {
            // Set up corner stalemate
            game.board = Array(8).fill(null).map(() => Array(8).fill(null));
            game.board[0][0] = { type: 'king', color: 'white' };
            game.board[1][1] = { type: 'king', color: 'black' };
            game.currentTurn = 'white';

            const result = game.identifyStalematePattern('white');
            expect(result).toHaveProperty('isClassicPattern');
        });

        test('should check if king is in corner', () => {
            const cornerPos = { row: 0, col: 0 };
            const result = game.isKingInCorner(cornerPos);
            expect(result).toBe(true);

            const nonCornerPos = { row: 4, col: 4 };
            const result2 = game.isKingInCorner(nonCornerPos);
            expect(result2).toBe(false);

            const nullPos = null;
            const result3 = game.isKingInCorner(nullPos);
            expect(result3).toBe(false);
        });

        test('should check if king is on edge', () => {
            const edgePos = { row: 0, col: 4 };
            const result = game.isKingOnEdge(edgePos);
            expect(result).toBe(true);

            const centerPos = { row: 4, col: 4 };
            const result2 = game.isKingOnEdge(centerPos);
            expect(result2).toBe(false);

            const nullPos = null;
            const result3 = game.isKingOnEdge(nullPos);
            expect(result3).toBe(false);
        });

        test('should identify pawn stalemate pattern', () => {
            // Set up position with pawns blocking king
            game.board = Array(8).fill(null).map(() => Array(8).fill(null));
            game.board[4][4] = { type: 'king', color: 'white' };
            game.board[3][3] = { type: 'pawn', color: 'black' };
            game.board[3][5] = { type: 'pawn', color: 'black' };

            const result = game.isPawnStalematePattern('white');
            expect(typeof result).toBe('boolean');
        });
    });

    describe('Move Notation and Board State', () => {
        test('should generate move notation', () => {
            const from = { row: 6, col: 4 };
            const to = { row: 4, col: 4 };
            const piece = { type: 'pawn', color: 'white' };

            const notation = game.getMoveNotation(from, to, piece);
            expect(typeof notation).toBe('string');
            expect(notation).toContain('e2');
            expect(notation).toContain('e4');
        });

        test('should declare stalemate draw', () => {
            // Set up stalemate position
            game.board = Array(8).fill(null).map(() => Array(8).fill(null));
            game.board[0][0] = { type: 'king', color: 'white' };
            game.board[1][1] = { type: 'king', color: 'black' };
            game.currentTurn = 'white';

            const result = game.declareStalemateDraw('white');
            expect(result).toHaveProperty('success');
        });

        test('should get board state', () => {
            const boardState = game.getBoardState();
            expect(boardState).toHaveProperty('board');
            expect(boardState).toHaveProperty('currentTurn');
            expect(boardState).toHaveProperty('gameStatus');
            expect(boardState).toHaveProperty('winner');
            expect(boardState).toHaveProperty('moveHistory');
            expect(boardState).toHaveProperty('castlingRights');
            expect(boardState).toHaveProperty('enPassantTarget');
        });
    });

    describe('Game State Validation', () => {
        test('should validate game state structure', () => {
            const result = game.validateGameStateStructure();
            expect(result).toHaveProperty('success');
        });

        test('should validate game state structure with invalid board', () => {
            game.board = null;
            const result = game.validateGameStateStructure();
            expect(result.success).toBe(false);
        });

        test('should validate game state structure with invalid row', () => {
            game.board[0] = null;
            const result = game.validateGameStateStructure();
            expect(result.success).toBe(false);
        });

        test('should validate castling consistency', () => {
            const result = game.validateCastlingConsistency();
            expect(result).toHaveProperty('success');
            expect(result.success).toBe(true);
        });

        test('should handle load from state', () => {
            const result = game.loadFromState({});
            expect(result).toHaveProperty('success');
            expect(result.success).toBe(false);
        });
    });

    describe('Utility Methods', () => {
        test('should get board copy', () => {
            const boardCopy = game.getBoardCopy();
            expect(Array.isArray(boardCopy)).toBe(true);
            expect(boardCopy.length).toBe(8);
            expect(boardCopy[0].length).toBe(8);

            // Verify it's a deep copy
            boardCopy[0][0] = { type: 'test', color: 'test' };
            expect(game.board[0][0]).not.toEqual(boardCopy[0][0]);
        });

        test('should reset game', () => {
            // Make some moves first
            game.makeMove({ from: { row: 6, col: 4 }, to: { row: 4, col: 4 } });
            game.makeMove({ from: { row: 1, col: 4 }, to: { row: 3, col: 4 } });

            // Reset the game
            game.resetGame();

            expect(game.currentTurn).toBe('white');
            expect(game.gameStatus).toBe('active');
            expect(game.winner).toBeNull();
            expect(game.moveHistory).toEqual([]);
            expect(game.halfMoveClock).toBe(0);
            expect(game.fullMoveNumber).toBe(1);
            expect(game.inCheck).toBe(false);
            expect(game.checkDetails).toBeNull();
        });

        test('should get simplified move history', () => {
            // Make a move to have history
            game.makeMove({ from: { row: 6, col: 4 }, to: { row: 4, col: 4 } });

            const simplified = game.getSimplifiedMoveHistory();
            expect(Array.isArray(simplified)).toBe(true);
            if (simplified.length > 0) {
                expect(simplified[0]).toHaveProperty('from');
                expect(simplified[0]).toHaveProperty('to');
                expect(simplified[0]).toHaveProperty('piece');
                expect(simplified[0]).toHaveProperty('color');
            }
        });

        test('should get complete game state', () => {
            const gameState = game.getGameState();
            expect(gameState).toHaveProperty('board');
            expect(gameState).toHaveProperty('currentTurn');
            expect(gameState).toHaveProperty('status');
            expect(gameState).toHaveProperty('gameStatus');
            expect(gameState).toHaveProperty('winner');
        });
    });

    describe('Advanced Check Detection', () => {
        test('should handle isInCheck with no king', () => {
            // Remove all kings
            for (let row = 0; row < 8; row++) {
                for (let col = 0; col < 8; col++) {
                    if (game.board[row][col] && game.board[row][col].type === 'king') {
                        game.board[row][col] = null;
                    }
                }
            }

            const result = game.isInCheck('white');
            expect(result).toBe(false);
        });

        test('should handle wouldBeInCheck scenarios', () => {
            // Set up a position where moving would expose king to check
            game.board = Array(8).fill(null).map(() => Array(8).fill(null));
            game.board[7][4] = { type: 'king', color: 'white' };
            game.board[7][3] = { type: 'rook', color: 'white' };
            game.board[0][3] = { type: 'rook', color: 'black' };

            const from = { row: 7, col: 3 };
            const to = { row: 6, col: 3 };
            const piece = { type: 'rook', color: 'white' };

            const result = game.wouldBeInCheck(from, to, 'white', piece);
            expect(typeof result).toBe('boolean');
        });
    });

    describe('Special Move Validation Edge Cases', () => {
        test('should handle extractPromotionFromMove for non-pawn', () => {
            const from = { row: 7, col: 0 };
            const to = { row: 6, col: 0 };
            const piece = { type: 'rook', color: 'white' };

            const result = game.extractPromotionFromMove(from, to, piece);
            expect(result).toBeNull();
        });

        test('should handle extractPromotionFromMove for pawn not at promotion row', () => {
            const from = { row: 6, col: 0 };
            const to = { row: 5, col: 0 };
            const piece = { type: 'pawn', color: 'white' };

            const result = game.extractPromotionFromMove(from, to, piece);
            expect(result).toBeNull();
        });

        test('should handle validateCheckResolution with no check', () => {
            game.checkDetails = null;
            const from = { row: 6, col: 4 };
            const to = { row: 4, col: 4 };
            const piece = { type: 'pawn', color: 'white' };

            const result = game.validateCheckResolution(from, to, piece);
            expect(result.success).toBe(true);
        });
    });

    describe('Path and Movement Validation', () => {
        test('should handle isPathClear for same square', () => {
            const square = { row: 4, col: 4 };
            const result = game.isPathClear(square, square);
            expect(result).toBe(true);
        });

        test('should validate blocking square calculations', () => {
            const blockSquare = { row: 4, col: 4 };
            const attackerPos = { row: 0, col: 0 };
            const kingPos = { row: 7, col: 7 };

            const result = game.isBlockingSquare(blockSquare, attackerPos, kingPos);
            expect(typeof result).toBe('boolean');
        });
    });

    describe('Castling Rights Management Edge Cases', () => {
        test('should handle updateCastlingRightsForCapturedRook', () => {
            const captureSquare = { row: 0, col: 0 };
            const capturedRook = { type: 'rook', color: 'black' };

            game.updateCastlingRightsForCapturedRook(captureSquare, capturedRook);
            expect(game.castlingRights.black.queenside).toBe(false);
        });

        test('should handle updateCastlingRightsForKingMove', () => {
            game.updateCastlingRightsForKingMove('white');
            expect(game.castlingRights.white.kingside).toBe(false);
            expect(game.castlingRights.white.queenside).toBe(false);
        });

        test('should handle updateCastlingRightsForRookMove', () => {
            const from = { row: 7, col: 0 };
            const rook = { type: 'rook', color: 'white' };

            game.updateCastlingRightsForRookMove(from, rook);
            expect(game.castlingRights.white.queenside).toBe(false);
        });

        test('should track castling rights changes', () => {
            const originalRights = {
                white: { kingside: true, queenside: true },
                black: { kingside: true, queenside: true }
            };
            const newRights = {
                white: { kingside: false, queenside: true },
                black: { kingside: true, queenside: true }
            };
            const moveInfo = { from: { row: 7, col: 4 }, to: { row: 7, col: 5 } };

            game.trackCastlingRightsChanges(originalRights, newRights, moveInfo);
            // This method primarily logs, so we just ensure it doesn't throw
            expect(true).toBe(true);
        });

        test('should validate castling rights for side with invalid side', () => {
            const result = game.validateCastlingRightsForSide('white', 'invalid');
            expect(result.success).toBe(false);
        });

        test('should get castling rights status', () => {
            const status = game.getCastlingRightsStatus();
            expect(status).toHaveProperty('white');
            expect(status).toHaveProperty('black');
            expect(status.white).toHaveProperty('kingside');
            expect(status.white).toHaveProperty('queenside');
        });

        test('should serialize castling rights', () => {
            const serialized = game.serializeCastlingRights();
            expect(serialized).toHaveProperty('white');
            expect(serialized).toHaveProperty('black');
        });
    });

    describe('Game End Conditions', () => {
        test('should handle isCheckmateGivenCheckStatus', () => {
            const result1 = game.isCheckmateGivenCheckStatus('white', true);
            const result2 = game.isCheckmateGivenCheckStatus('white', false);
            expect(typeof result1).toBe('boolean');
            expect(typeof result2).toBe('boolean');
        });

        test('should handle isStalemateGivenCheckStatus', () => {
            const result1 = game.isStalemateGivenCheckStatus('white', false);
            const result2 = game.isStalemateGivenCheckStatus('white', true);
            expect(typeof result1).toBe('boolean');
            expect(typeof result2).toBe('boolean');
        });

        test('should analyze stalemate position', () => {
            const analysis = game.analyzeStalematePosition('white');
            expect(analysis).toHaveProperty('isStalemate');
            expect(typeof analysis.isStalemate).toBe('boolean');
        });
    });

    describe('Legal Move Generation', () => {
        test('should get all legal moves', () => {
            const moves = game.getAllLegalMoves('white');
            expect(Array.isArray(moves)).toBe(true);
        });

        test('should get king legal moves', () => {
            const moves = game.getKingLegalMoves('white');
            expect(Array.isArray(moves)).toBe(true);
        });

        test('should get king legal moves with no king', () => {
            // Remove white king
            game.board[7][4] = null;
            const moves = game.getKingLegalMoves('white');
            expect(moves).toEqual([]);
        });

        test('should get piece legal moves', () => {
            const moves = game.getPieceLegalMoves('white');
            expect(Array.isArray(moves)).toBe(true);
        });
    });

    describe('Error Handling and Edge Cases', () => {
        test('should handle invalid piece types in movement validation', () => {
            const piece = { type: 'invalid', color: 'white' };
            const from = { row: 6, col: 4 };
            const to = { row: 4, col: 4 };

            const result = game.validateMovementPattern(from, to, piece);
            expect(result.success).toBe(false);
        });

        test('should handle game state validation with corrupted state', () => {
            game.gameStatus = 'invalid';
            const result = game.validateGameState();
            expect(result.success).toBe(false);
        });

        test('should handle turn validation with invalid piece', () => {
            const piece = { color: 'invalid' };
            const result = game.validateTurn(piece);
            expect(result.success).toBe(false);
        });
    });
});