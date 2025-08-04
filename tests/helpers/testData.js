/**
 * Common Test Data and Positions
 * Standardized test data patterns for reusable test scenarios
 */

const ChessGame = require('../../src/shared/chessGame');

/**
 * Standard test positions for common chess scenarios
 */
const TestPositions = {
    /**
     * Standard starting position
     */
    STARTING_POSITION: () => {
        return new ChessGame();
    },

    /**
     * Empty board with only kings
     */
    KINGS_ONLY: () => {
        const game = new ChessGame();
        game.board = Array(8).fill(null).map(() => Array(8).fill(null));
        game.board[0][4] = { type: 'king', color: 'black' };
        game.board[7][4] = { type: 'king', color: 'white' };
        return game;
    },

    /**
     * Position ready for kingside castling
     */
    CASTLING_READY_KINGSIDE: () => {
        const game = new ChessGame();
        // Clear path for white kingside castling
        game.board[7][5] = null; // Bishop
        game.board[7][6] = null; // Knight
        return game;
    },

    /**
     * Position ready for queenside castling
     */
    CASTLING_READY_QUEENSIDE: () => {
        const game = new ChessGame();
        // Clear path for white queenside castling
        game.board[7][1] = null; // Knight
        game.board[7][2] = null; // Bishop
        game.board[7][3] = null; // Queen
        return game;
    },

    /**
     * Position set up for en passant capture
     */
    EN_PASSANT_SETUP: () => {
        const game = new ChessGame();
        // Move white pawn to 5th rank
        game.board[6][4] = null;
        game.board[3][4] = { type: 'pawn', color: 'white' };
        // Place black pawn adjacent for en passant
        game.board[1][3] = null;
        game.board[3][3] = { type: 'pawn', color: 'black' };
        // Set en passant target
        game.enPassantTarget = { row: 2, col: 3 };
        game.currentTurn = 'white';
        return game;
    },

    /**
     * Simple checkmate position (back rank mate)
     */
    CHECKMATE_POSITION: () => {
        const game = new ChessGame();
        game.board = Array(8).fill(null).map(() => Array(8).fill(null));
        // Black king trapped on back rank
        game.board[0][4] = { type: 'king', color: 'black' };
        game.board[0][3] = { type: 'pawn', color: 'black' };
        game.board[0][5] = { type: 'pawn', color: 'black' };
        game.board[1][3] = { type: 'pawn', color: 'black' };
        game.board[1][4] = { type: 'pawn', color: 'black' };
        game.board[1][5] = { type: 'pawn', color: 'black' };
        // White rook delivering checkmate
        game.board[0][0] = { type: 'rook', color: 'white' };
        // White king
        game.board[7][4] = { type: 'king', color: 'white' };
        game.currentTurn = 'black';
        return game;
    },

    /**
     * Stalemate position
     */
    STALEMATE_POSITION: () => {
        const game = new ChessGame();
        game.board = Array(8).fill(null).map(() => Array(8).fill(null));
        // Black king in corner with no legal moves but not in check
        game.board[0][0] = { type: 'king', color: 'black' };
        // White pieces controlling escape squares
        game.board[2][1] = { type: 'king', color: 'white' };
        game.board[1][2] = { type: 'queen', color: 'white' };
        game.currentTurn = 'black';
        return game;
    },

    /**
     * Position with king in check
     */
    CHECK_POSITION: () => {
        const game = new ChessGame();
        game.board = Array(8).fill(null).map(() => Array(8).fill(null));
        game.board[4][4] = { type: 'king', color: 'white' };
        game.board[4][0] = { type: 'rook', color: 'black' };
        game.board[0][4] = { type: 'king', color: 'black' };
        game.currentTurn = 'white';
        return game;
    }
};

/**
 * Standard move sequences for testing
 */
const TestSequences = {
    /**
     * Scholar's Mate sequence
     */
    SCHOLARS_MATE: [
        { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } }, // e4
        { from: { row: 1, col: 4 }, to: { row: 3, col: 4 } }, // e5
        { from: { row: 7, col: 5 }, to: { row: 4, col: 2 } }, // Bc4
        { from: { row: 0, col: 1 }, to: { row: 2, col: 2 } }, // Nc6
        { from: { row: 7, col: 3 }, to: { row: 3, col: 7 } }, // Qh5
        { from: { row: 0, col: 6 }, to: { row: 2, col: 5 } }, // Nf6
        { from: { row: 3, col: 7 }, to: { row: 1, col: 5 } }  // Qxf7# (checkmate)
    ],

    /**
     * Simple pawn advance sequence
     */
    PAWN_ADVANCE: [
        { from: { row: 6, col: 4 }, to: { row: 5, col: 4 } }, // e3
        { from: { row: 1, col: 4 }, to: { row: 2, col: 4 } }, // e6
        { from: { row: 5, col: 4 }, to: { row: 4, col: 4 } }, // e4
        { from: { row: 2, col: 4 }, to: { row: 3, col: 4 } }  // e5
    ],

    /**
     * Castling sequence (kingside)
     */
    KINGSIDE_CASTLING_SETUP: [
        { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } }, // e4
        { from: { row: 1, col: 4 }, to: { row: 3, col: 4 } }, // e5
        { from: { row: 7, col: 5 }, to: { row: 4, col: 2 } }, // Bc4
        { from: { row: 0, col: 5 }, to: { row: 3, col: 2 } }, // Bc5
        { from: { row: 7, col: 6 }, to: { row: 5, col: 5 } }  // Nf3
    ]
};

/**
 * Standard test data for various scenarios
 */
const TestData = {
    /**
     * Valid move examples for each piece type
     */
    VALID_MOVES: {
        pawn: [
            { from: { row: 6, col: 4 }, to: { row: 5, col: 4 } }, // one square forward
            { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } }  // two squares from start
        ],
        rook: [
            { from: { row: 7, col: 0 }, to: { row: 7, col: 3 } }, // horizontal
            { from: { row: 7, col: 0 }, to: { row: 4, col: 0 } }  // vertical
        ],
        knight: [
            { from: { row: 7, col: 1 }, to: { row: 5, col: 0 } }, // L-shape
            { from: { row: 7, col: 1 }, to: { row: 5, col: 2 } }  // L-shape
        ],
        bishop: [
            { from: { row: 7, col: 2 }, to: { row: 5, col: 4 } }, // diagonal
            { from: { row: 7, col: 2 }, to: { row: 4, col: 5 } }  // diagonal
        ],
        queen: [
            { from: { row: 7, col: 3 }, to: { row: 7, col: 6 } }, // horizontal
            { from: { row: 7, col: 3 }, to: { row: 4, col: 0 } }  // diagonal
        ],
        king: [
            { from: { row: 7, col: 4 }, to: { row: 7, col: 5 } }, // one square
            { from: { row: 7, col: 4 }, to: { row: 6, col: 4 } }  // one square
        ]
    },

    /**
     * Invalid move examples
     */
    INVALID_MOVES: {
        outOfBounds: [
            { from: { row: 0, col: 0 }, to: { row: -1, col: 0 } },
            { from: { row: 7, col: 7 }, to: { row: 8, col: 7 } }
        ],
        wrongTurn: [
            { from: { row: 1, col: 4 }, to: { row: 2, col: 4 } } // black move when white's turn
        ],
        noPiece: [
            { from: { row: 4, col: 4 }, to: { row: 5, col: 4 } } // empty square
        ]
    },

    /**
     * Error codes for testing
     */
    ERROR_CODES: {
        INVALID_COORDINATES: 'INVALID_COORDINATES',
        NO_PIECE: 'NO_PIECE',
        WRONG_TURN: 'WRONG_TURN',
        INVALID_MOVE: 'INVALID_MOVE',
        INVALID_MOVEMENT: 'INVALID_MOVEMENT',
        KING_IN_CHECK: 'KING_IN_CHECK',
        PATH_BLOCKED: 'PATH_BLOCKED',
        GAME_OVER: 'GAME_OVER'
    }
};

module.exports = {
    TestPositions,
    TestSequences,
    TestData
};