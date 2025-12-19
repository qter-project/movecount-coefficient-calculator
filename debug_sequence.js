import { algSpeed as enhancedAlgSpeed } from "./enhanced_mvc.js";
import { algSpeed as sadAlgSpeed } from "./sad_mvc.js";

const sequence = "S2 X D D b B S' B";

console.log("=== DEBUGGING SEQUENCE:", sequence, "===\n");

// Test with enhanced algorithm
console.log("Enhanced Algorithm:");
const enhanced = enhancedAlgSpeed(sequence);
console.log("Result:", enhanced);
console.log("");

// Test with old/sad algorithm  
console.log("Old/Sad Algorithm:");
const sad = sadAlgSpeed(sequence);
console.log("Result:", sad);
console.log("");

console.log("Difference:", enhanced - sad);
console.log("Enhanced - Sad:", enhanced, "-", sad, "=", enhanced - sad);
