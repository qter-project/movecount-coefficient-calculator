// Let's manually trace what happens:
// Sequence: S2 X D D b B S' B

// Starting position: Both wrists at neutral (0)

console.log("=== MANUAL TRACE ===\n");

// S2: According to the code, S2 is executed when one wrist is -1 or 1, and the other is 0
// Let's assume we start at L wrist = -1, R wrist = 0
// After S2: cost = 4.1 (sesliceMultiplier * double = 1.25 * 1.65 = 2.0625)
// Plus some overwork penalties

console.log("S2: Wrists likely at (-1, 0) or (1, 0)");
console.log("Cost: ~4.1");
console.log("");

// X: Rotates the cube - adds 1 to both wrists
// If we were at (-1, 0), now we're at (0, 1)
// If we were at (1, 0), now we're at (2, 1) - but 2 is BROKEN state
// So likely path: (-1, 0) -> (0, 1)

console.log("After X: Wrists at (0, 1)");
console.log("Cost still: 4.1 (X doesn't add cost, just changes wrist positions)");
console.log("");

// D: Now with L wrist = 0, R wrist = 1
// Looking at D move code in both algorithms...

console.log("First D move:");
console.log("Enhanced: 8.2 (added 4.1)");
console.log("Sad: 6 (added 1.9)");
console.log("Difference: 2.2");
console.log("");

console.log("This is the key difference!");
console.log("");
console.log("Let's check the D move handling when wrists are (0, 1)...");
