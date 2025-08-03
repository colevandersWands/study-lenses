/**
 * Basic usage examples for the qasm-transpilers
 */

import { plaintextToQasm, qasmToPlaintext } from '../../index.js';

console.log('=== Basic Transpiler Examples ===\n');

// Example 1: Simple Bell State
console.log('1. Bell State Creation:');
const bellState = 'H-I\nI-X#0';
console.log('Plaintext:', bellState.replace('\n', '\\n'));
const bellQasm = plaintextToQasm(bellState);
console.log('OpenQASM:');
console.log(bellQasm);

// Example 2: GHZ State
console.log('\n2. Three-Qubit GHZ State:');
const ghzState = 'H-I-I\nI-X#0-I\nI-I-X#0';
console.log('Plaintext:', ghzState.replace(/\n/g, '\\n'));
const ghzQasm = plaintextToQasm(ghzState);
console.log('OpenQASM:');
console.log(ghzQasm);

// Example 3: Quantum Fourier Transform (2 qubits)
console.log('\n3. Quantum Fourier Transform (2 qubits):');
const qft2 = 'H-H#0\nI-H';
console.log('Plaintext:', qft2.replace('\n', '\\n'));
const qftQasm = plaintextToQasm(qft2);
console.log('OpenQASM:');
console.log(qftQasm);

// Example 4: SWAP Gate
console.log('\n4. SWAP Gate:');
const swapCircuit = 'SWAP#1\nSWAP#0';
console.log('Plaintext:', swapCircuit.replace('\n', '\\n'));
const swapQasm = plaintextToQasm(swapCircuit);
console.log('OpenQASM:');
console.log(swapQasm);

// Example 5: Measurement
console.log('\n5. Measurement Example:');
const measureCircuit = 'H-M\nH-M';
console.log('Plaintext:', measureCircuit.replace('\n', '\\n'));
const measureQasm = plaintextToQasm(measureCircuit);
console.log('OpenQASM:');
console.log(measureQasm);

// Example 6: Rotation Gates
console.log('\n6. Rotation Gates:');
const rotationCircuit = 'RX(1.5708)-RZ(3.14159)';  // π/2 and π
console.log('Plaintext:', rotationCircuit);
const rotationQasm = plaintextToQasm(rotationCircuit);
console.log('OpenQASM:');
console.log(rotationQasm);

// Example 7: Round-trip Conversion
console.log('\n7. Round-trip Conversion Test:');
const originalQasm = `OPENQASM 2.0;
include "qelib1.inc";
qreg q[3];
h q[0];
cx q[0], q[1];
cx q[0], q[2];
x q[1];
z q[2];`;
console.log('Original QASM:');
console.log(originalQasm);
const convertedPlaintext = qasmToPlaintext(originalQasm);
console.log('\nConverted to Plaintext:', convertedPlaintext.replace(/\n/g, '\\n'));
const reconvertedQasm = plaintextToQasm(convertedPlaintext);
console.log('\nReconverted to QASM:');
console.log(reconvertedQasm);

// Example 8: Error Handling
console.log('\n8. Error Handling Examples:');
try {
  plaintextToQasm('X#0');  // Self-control
} catch (error) {
  console.log('Self-control error:', error.message);
}

try {
  plaintextToQasm('Q');  // Invalid gate
} catch (error) {
  console.log('Invalid gate error:', error.message);
}

try {
  plaintextToQasm('X#2\nI');  // Non-existent control
} catch (error) {
  console.log('Non-existent control error:', error.message);
}