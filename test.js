let { algSpeed } = require("./ref.js");

function approxEqual(a, b, tolerance = 0.1) {
  return Math.abs(a - b) <= tolerance;
}

// Basic usage with default parameters
const result1 = algSpeed("R U R' U'");
console.log(result1); // e.g., 4.5

// Ignore errors in sequence
const result2 = algSpeed("R U R' invalid U'", true);
console.log(result2);

// Ignore AUF (adjust U face)
const result3 = algSpeed("U R U R' U' R' U", false, true);
console.log(result3);

// Custom parameters
const result4 = algSpeed(
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
console.log(result4);

// F2L case example
const f2l = algSpeed("R U' R' U R U R'");
console.log(`F2L speed: ${f2l}`);

if (f2l - 6.5 > 0.1) {
  console.error("You fucked up f2l speed calculation");
}

// OLL case example
const oll = algSpeed("R U R' U R U2 R'");
console.log(`OLL speed: ${oll}`);

if (!approxEqual(oll, 7.6)) {
  console.error("You fucked up oll speed calculation");
}

// PLL case example (T-perm)
const pll = algSpeed("R U R' U' R' F R2 U' R' U' R U R' F'");
console.log(`PLL speed: ${pll}`);

if (!approxEqual(pll, 14.4)) {
  console.error("You fucked up pll speed calculation");
}

// Another OLL case (Sune)
const sune = algSpeed("R U R' U R U2 R'");
console.log(`Sune speed: ${sune}`);

if (!approxEqual(sune, 7.6)) {
  console.error("You fucked up sune speed calculation");
}

// Anti-Sune OLL
const antiSune = algSpeed("R' U' R U' R' U2 R");
console.log(`Anti-Sune speed: ${antiSune}`);

if (!approxEqual(antiSune, 8.3)) {
  console.error("You fucked up anti-sune speed calculation");
}

// J-perm (Ja)
const jaPerm = algSpeed("R' U L' U2 R U' R' U2 R L");
console.log(`Ja-perm speed: ${jaPerm}`);

if (!approxEqual(jaPerm, 20.9)) {
  console.error("You fucked up ja-perm speed calculation");
}

// Y-perm
const yPerm = algSpeed("F R U' R' U' R U R' F' R U R' U' R' F R F'");
console.log(`Y-perm speed: ${yPerm}`);

if (!approxEqual(yPerm, 19.2)) {
  console.error("You fucked up y-perm speed calculation");
}

// Sexy move
const sexy = algSpeed("R U R' U'");
console.log(`Sexy move speed: ${sexy}`);

if (!approxEqual(sexy, 4.5)) {
  console.error("You fucked up sexy move speed calculation");
}

// Sledgehammer
const sledge = algSpeed("R' F R F'");
console.log(`Sledgehammer speed: ${sledge}`);

if (!approxEqual(sledge, 5.3)) {
  console.error("You fucked up sledgehammer speed calculation");
}

// H-perm
const hPerm = algSpeed("M2 U M2 U2 M2 U M2");
console.log(`H-perm speed: ${hPerm}`);

if (!approxEqual(hPerm, 14.6)) {
  console.error("You fucked up h-perm speed calculation");
}

// U-perm (Ua)
const uaPerm = algSpeed("R U' R U R U R U' R' U' R2");
console.log(`Ua-perm speed: ${uaPerm}`);

if (!approxEqual(uaPerm, 16.6)) {
  console.error("You fucked up ua-perm speed calculation");
}

// Z-perm
const zPerm = algSpeed("M' U M2 U M2 U M' U2 M2");
console.log(`Z-perm speed: ${zPerm}`);

if (!approxEqual(zPerm, 17.2)) {
  console.error("You fucked up z-perm speed calculation");
}

// OLL dot case
const ollDot = algSpeed("F R U R' U' F' f R U R' U' f'");
console.log(`OLL dot speed: ${ollDot}`);

if (!approxEqual(ollDot, 13.2)) {
  console.error("You fucked up oll dot speed calculation");
}

// Simple F2L pair
const simpleF2l = algSpeed("U R U' R'");
console.log(`Simple F2L speed: ${simpleF2l}`);

if (!approxEqual(simpleF2l, 3.6)) {
  console.error("You fucked up simple f2l speed calculation");
}

// A-perm (Aa)
const aaPerm = algSpeed("x R' U R' D2 R U' R' D2 R2");
console.log(`Aa-perm speed: ${aaPerm}`);

if (!approxEqual(aaPerm, 12.6)) {
  console.error("You fucked up aa-perm speed calculation");
}

// E-perm
const ePerm = algSpeed("x' R U' R' D R U R' D' R U R' D R U' R' D'");
console.log(`E-perm speed: ${ePerm}`);

if (!approxEqual(ePerm, 18.8)) {
  console.error("You fucked up e-perm speed calculation");
}

// V-perm
const vPerm = algSpeed("R' U R' U' y R' F' R2 U' R' U R' F R F");
console.log(`V-perm speed: ${vPerm}`);

if (!approxEqual(vPerm, 21.8)) {
  console.error("You fucked up v-perm speed calculation");
}
