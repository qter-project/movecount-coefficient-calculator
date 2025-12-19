import { algSpeed as enhancedAlgSpeed, algSpeedDetailed as enhancedDetailed } from "./enhanced_mvc.js";
import { algSpeed as sadAlgSpeed } from "./sad_mvc.js";

const sequence = "S2 X D D b B S' B";
const moves = sequence.split(" ");

console.log("=== SEQUENCE:", sequence, "===\n");

// Test each partial sequence with enhanced
console.log("Enhanced Algorithm - Step by Step:");
for (let i = 0; i < moves.length; i++) {
  const partial = moves.slice(0, i + 1).join(" ");
  const result = enhancedAlgSpeed(partial);
  console.log(`After "${partial}": ${result}`);
}
console.log("");

// Test each partial sequence with sad
console.log("Old/Sad Algorithm - Step by Step:");
for (let i = 0; i < moves.length; i++) {
  const partial = moves.slice(0, i + 1).join(" ");
  const result = sadAlgSpeed(partial);
  console.log(`After "${partial}": ${result}`);
}
console.log("");

// Get detailed result from enhanced if available
try {
  const detailed = enhancedDetailed(sequence);
  console.log("\nEnhanced Detailed Result:");
  console.log(JSON.stringify(detailed, null, 2));
} catch (e) {
  console.log("No detailed result available");
}
