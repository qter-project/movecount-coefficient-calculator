let {
  algSpeed,
  algSpeedDetailed,
  ALLOWED_MOVES,
} = require("./enhanced_mvc.js");
let { algSpeed: algSpeedOld } = require("./sad_mvc.js");

// Simple seeded random number generator (LCG)
class SeededRandom {
  constructor(seed = 12345) {
    this.seed = seed;
  }

  next() {
    this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
    return this.seed / 0x7fffffff;
  }
}

const rng = new SeededRandom(42);

function approxEqual(a, b, tolerance = 0.1) {
  if (Number.isNaN(a) || Number.isNaN(b)) return false;

  return Math.abs(a - b) <= tolerance;
}

console.log("=".repeat(60));
console.log("VALIDATION: algSpeed vs algSpeedDetailed vs algSpeedOld");
console.log("=".repeat(60));

let passCount = 0;
let failCount = 0;

function testAlg(name, sequence, ...params) {
  const speed = algSpeed(sequence, ...params);
  const detailed = algSpeedDetailed(sequence, ...params);
  const speedOld = algSpeedOld(sequence, ...params);

  const matchSpeedDetailed = approxEqual(speed, detailed.speed, 0.01);
  const matchSpeedOld = approxEqual(speed, speedOld, 0.01);
  const matchDetailedOld = approxEqual(detailed.speed, speedOld, 0.01);

  if (matchSpeedDetailed && matchSpeedOld) {
    passCount++;
    console.log(`✓ ${name}: ${speed} ≈ ${detailed.speed} ≈ ${speedOld}`);
  } else {
    failCount++;
    console.error(
      `✗ FAILED SEQUENCE ${name}: 
    sequence="${sequence}"

    algSpeed=${speed} 
    algSpeedDetailed=${detailed.speed} 
    algSpeedOld=${speedOld}`
    );
  }

  if (passCount + failCount <= 3) {
    console.log(`  Summary:`, detailed.summary);
    console.log(`  Aggregated: ${detailed.aggregatedCost}`);
  }

  return matchSpeedDetailed && matchSpeedOld;
}

// Basic usage with default parameters
testAlg("Sexy move", "R U R' U'");

// F2L case example
testAlg("F2L case", "R U' R' U R U R'");

// OLL case example
testAlg("OLL (Sune)", "R U R' U R U2 R'");

// PLL case example (T-perm)
testAlg("T-perm", "R U R' U' R' F R2 U' R' U' R U R' F'");

// Anti-Sune OLL
testAlg("Anti-Sune", "R' U' R U' R' U2 R");

// J-perm (Ja)
testAlg("Ja-perm", "R' U L' U2 R U' R' U2 R L");

// Y-perm
testAlg("Y-perm", "F R U' R' U' R U R' F' R U R' U' R' F R F'");

// Sledgehammer
testAlg("Sledgehammer", "R' F R F'");

// H-perm
testAlg("H-perm", "M2 U M2 U2 M2 U M2");

// U-perm (Ua)
testAlg("Ua-perm", "R U' R U R U R U' R' U' R2");

// Z-perm
testAlg("Z-perm", "M' U M2 U M2 U M' U2 M2");

// OLL dot case
testAlg("OLL dot", "F R U R' U' F' f R U R' U' f'");

// Simple F2L pair
testAlg("Simple F2L", "U R U' R'");

// A-perm (Aa)
testAlg("Aa-perm", "x R' U R' D2 R U' R' D2 R2");

// E-perm
testAlg("E-perm", "x' R U' R' D R U R' D' R U R' D R U' R' D'");

// V-perm
testAlg("V-perm", "R' U R' U' y R' F' R2 U' R' U R' F R F");

// Test with custom parameters
testAlg(
  "Custom params",
  "R U R' U' R' F R F'",
  false, // ignoreErrors
  false, // ignoreauf
  0.8, // wristMult
  1.3, // pushMult
  1.4, // ringMult
  0.5, // destabilize
  1, // addRegrip
  1.65, // double
  1.25, // sesliceMult
  2.25 // overWorkMult
);

// Test with ignore unknown moves
testAlg("Ignore unknown", "R U R' invalid U'", true);

// Test with ignore AUF
testAlg("Ignore AUF", "U R U R' U' R' U", false, true);

console.log("\n" + "=".repeat(60));
console.log(`RESULTS: ${passCount} passed, ${failCount} failed`);
if (failCount === 0) {
  console.log("✓ All tests passed! algSpeedDetailed matches algSpeed.");
} else {
  console.error("✗ Some tests failed. There are discrepancies.");
}
console.log("=".repeat(60));

// Demonstrate the detailed summary for an interesting algorithm
console.log("\n" + "=".repeat(60));
console.log("DETAILED BREAKDOWN EXAMPLE: T-perm");
console.log("=".repeat(60));
const tpermDetail = algSpeedDetailed("R U R' U' R' F R2 U' R' U' R U R' F'");
console.log("Algorithm: R U R' U' R' F R2 U' R' U' R U R' F'");
console.log(`Speed: ${tpermDetail.speed}`);
console.log(`Aggregated Cost: ${tpermDetail.aggregatedCost}`);
console.log("\nEvent Summary:");
console.log(`  Wrist turns: ${tpermDetail.summary.wristTurns}`);
console.log(`  Wrist double turns: ${tpermDetail.summary.wristDoubleTurns}`);
console.log(`  Finger moves: ${tpermDetail.summary.fingerMoves}`);
console.log(`  Double finger moves: ${tpermDetail.summary.doubleFingerMoves}`);
console.log(`  Pushes: ${tpermDetail.summary.pushes}`);
console.log(`  Ring flicks: ${tpermDetail.summary.ringFlicks}`);
console.log(`  Overworks: ${tpermDetail.summary.overworks}`);
console.log(
  `  Overwork amount: ${tpermDetail.summary.overworkAmount.toFixed(2)}`
);
console.log(`  Destabilizes: ${tpermDetail.summary.destabilizes}`);
console.log(`  Move blocks: ${tpermDetail.summary.moveBlocks}`);
console.log(`  Regrips: ${tpermDetail.summary.regrips}`);
console.log(`  Double regrips: ${tpermDetail.summary.doubleRegrips}`);
console.log(`  Rotations: ${tpermDetail.summary.rotations}`);
console.log("=".repeat(60));

passCount = 0;
failCount = 0;

const brute_force_count = 100;
const brute_force_min_size = 5;
const brute_force_max_size = 10;

console.log(`Brute forcing ${brute_force_count} algorithms!`);

let algorithm = ALLOWED_MOVES;

for (let i = 0; i < brute_force_count; i++) {
  const size =
    Math.floor(rng.next() * (brute_force_max_size - brute_force_min_size + 1)) +
    brute_force_min_size;

  const seq = Array.from({ length: size }, () => {
    const move = ALLOWED_MOVES[Math.floor(rng.next() * ALLOWED_MOVES.length)];
    return move;
  }).join(" ");

  testAlg(`Brute force #${i + 1}`, seq);
}

console.log("\n" + "=".repeat(60));
console.log(`RESULTS: ${passCount} passed, ${failCount} failed`);
if (failCount === 0) {
  console.log("✓ All tests passed! algSpeedDetailed matches algSpeed.");
} else {
  console.error("✗ Some tests failed. There are discrepancies.");
}
console.log("=".repeat(60));
