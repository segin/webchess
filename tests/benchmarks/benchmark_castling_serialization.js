
const iterations = 1000000;
const castlingRights = {
  white: { kingside: true, queenside: true },
  black: { kingside: true, queenside: true }
};

console.log(`Running benchmark for castling rights cloning (${iterations} iterations)...`);

// JSON strategy
const startJson = process.hrtime();
for (let i = 0; i < iterations; i++) {
  const clone = JSON.parse(JSON.stringify(castlingRights));
}
const endJson = process.hrtime(startJson);
const jsonTime = (endJson[0] * 1000 + endJson[1] / 1e6);

// Spread strategy
const startSpread = process.hrtime();
for (let i = 0; i < iterations; i++) {
  const clone = {
    white: { ...castlingRights.white },
    black: { ...castlingRights.black }
  };
}
const endSpread = process.hrtime(startSpread);
const spreadTime = (endSpread[0] * 1000 + endSpread[1] / 1e6);

console.log(`JSON.parse(JSON.stringify()): ${jsonTime.toFixed(2)}ms`);
console.log(`Spread syntax: ${spreadTime.toFixed(2)}ms`);
console.log(`Improvement: ${(jsonTime / spreadTime).toFixed(2)}x faster`);
