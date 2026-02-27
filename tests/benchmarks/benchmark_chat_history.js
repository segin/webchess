const GameManager = require('../../src/server/gameManager');
const { performance } = require('perf_hooks');

function runBenchmark() {
    const gameManager = new GameManager();
    const ITERATIONS = 10000;
    const CHAT_LIMIT = 100;

    // Create a game
    const hostId = 'host1';
    const gameId = gameManager.createGame(hostId);
    const guestId = 'guest1';
    gameManager.joinGame(gameId, guestId);

    console.log(`Setting up chat history with ${CHAT_LIMIT} messages...`);

    // Fill up to limit
    for (let i = 0; i < CHAT_LIMIT; i++) {
        gameManager.addChatMessage(gameId, hostId, `Message ${i}`);
    }

    console.log('Starting benchmark...');

    const start = performance.now();

    // Add messages beyond the limit
    for (let i = 0; i < ITERATIONS; i++) {
        gameManager.addChatMessage(gameId, hostId, `New Message ${i}`);
    }

    const end = performance.now();
    const duration = end - start;

    console.log(`Time taken to add ${ITERATIONS} messages (with history limit logic): ${duration.toFixed(2)}ms`);
    console.log(`Average time per message: ${(duration / ITERATIONS).toFixed(4)}ms`);

    // Verification
    const game = gameManager.getGame(gameId);
    console.log(`Final chat history length: ${game.chatMessages.length}`);
    console.log(`Last message: ${game.chatMessages[game.chatMessages.length - 1].message}`);
}

runBenchmark();
