// Let me manually calculate what happens in both algorithms

console.log("=== DETAILED MANUAL CALCULATION ===\n");

// Constants
const sesliceMult = 1.25;
const double = 1.65;
const ringMult = 1.4;
const destabilize = 0.5;
const pushMult = 1.3;

console.log("Constants: sesliceMult=1.25, double=1.65, ringMult=1.4, destabilize=0.5\n");

// Sequence: S2 X D D b B S' B

console.log("Move 1: S2");
console.log("  Both algorithms: Start at (L=-1, R=0) or (L=1, R=0)");
console.log("  Cost: sesliceMult * double = 1.25 * 1.65 = 2.0625");
console.log("  Plus some overwork (thumb, index, middle, ring)");
console.log("  Result: ~4.1");
console.log("");

console.log("Move 2: X (rotation)");
console.log("  X adds 1 to both wrists");
console.log("  If started at (L=-1, R=0): now (L=0, R=1)");
console.log("  If started at (L=1, R=0): now (L=2, R=1) - BROKEN!");
console.log("  Most likely path: (-1, 0) → (0, 1)");
console.log("  X doesn't add cost directly");
console.log("  Cost still: 4.1");
console.log("");

console.log("Move 3: D (with wrists at L=0, R=1)");
console.log("  SAD:");
console.log("    First condition: lWrist == 0 && (rWrist != 0 ...) → TRUE");
console.log("    Executes left hand ring flick");
console.log("    cost += ringMult = 1.4");
console.log("    DESTABILIZE CHECK: normalMove=='D' && (lWrist==1 || rWrist==1)");
console.log("      lWrist = 0, rWrist = 1 → TRUE!");
console.log("    cost += destabilize = 0.5");
console.log("    Total added: 1.4 + 0.5 = 1.9");
console.log("    Running total: 4.1 + 1.9 = 6.0 ✓");
console.log("");
console.log("  ENHANCED:");
console.log("    First condition: leftWrist == 0 && (rightWrist != 0 ...) → TRUE");
console.log("    Executes left hand ring flick");
console.log("    cost += ringMult = 1.4");
console.log("    DESTABILIZE CHECK: normalMove=='D' && (leftWrist==1 || rightWrist==1)");
console.log("      leftWrist = 0, rightWrist = 1 → TRUE!");
console.log("    cost += destabilizePenalty = 0.5");
console.log("    BUT WAIT - maybe there's also overwork?");
console.log("    Total: Must be getting 4.1 more (4.1 + 4.1 = 8.2)");
console.log("");

console.log("The difference suggests enhanced is adding ~2.2 more cost than sad");
console.log("This could be due to:");
console.log("  1. Different overwork calculations");
console.log("  2. Different grip penalties when coming off rotations");
console.log("  3. Regrip costs after X rotation");
console.log("");
