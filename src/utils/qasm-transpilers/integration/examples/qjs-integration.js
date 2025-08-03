/**
 * Examples of integrating the transpiler with q.js circuit editor
 */

import { 
  qjsToQasm, 
  qasmToQjs, 
  validateQjsCircuit,
  describeQjsCircuit,
  createStandardCircuit,
  areCircuitsEquivalent
} from '../qjs-bridge.js';

console.log('=== Q.js Integration Examples ===\n');

// Example 1: Create a standard circuit
console.log('1. Creating Standard Circuits:');
const bellCircuit = createStandardCircuit('bell');
console.log('Bell State Circuit:');
console.log(JSON.stringify(bellCircuit, null, 2));

const ghzCircuit = createStandardCircuit('ghz', 4);  // 4-qubit GHZ
console.log('\n4-Qubit GHZ Circuit:');
console.log(JSON.stringify(ghzCircuit, null, 2));

// Example 2: Convert q.js circuit to QASM
console.log('\n2. Converting Q.js Circuit to QASM:');
const qasm = qjsToQasm(bellCircuit);
console.log('QASM Output:');
console.log(qasm);

// Example 3: Convert QASM back to q.js
console.log('\n3. Converting QASM to Q.js Circuit:');
const qasmCode = `
OPENQASM 2.0;
include "qelib1.inc";
qreg q[2];
h q[0];
cx q[0], q[1];
`;
const qjsCircuit = qasmToQjs(qasmCode);
console.log('Q.js Circuit:');
console.log(JSON.stringify(qjsCircuit, null, 2));

// Example 4: Validate a circuit
console.log('\n4. Circuit Validation:');
const validResult = validateQjsCircuit(bellCircuit);
console.log('Bell circuit validation:', validResult);

// Create an invalid circuit
const invalidCircuit = {
  bandwidth: 2,
  timewidth: 1,
  operations: [{
    gate: { symbol: 'X' },
    momentIndex: 1,
    registerIndices: [1],
    isControlled: true,
    controlQubit: 0  // This will cause an issue
  }]
};
const invalidResult = validateQjsCircuit(invalidCircuit);
console.log('Invalid circuit validation:', invalidResult);

// Example 5: Describe circuit properties
console.log('\n5. Circuit Description:');
const swapCircuit = createStandardCircuit('swap');
const description = describeQjsCircuit(swapCircuit);
console.log('SWAP Circuit Properties:', description);

// Example 6: Compare circuits
console.log('\n6. Circuit Comparison:');
const circuit1 = createStandardCircuit('bell');
const circuit2 = qasmToQjs(qjsToQasm(circuit1));  // Round-trip
const areEqual = areCircuitsEquivalent(circuit1, circuit2);
console.log('Are circuits equivalent after round-trip?', areEqual);

// Example 7: Working with measurements
console.log('\n7. Measurement Circuit:');
const measureCircuit = createStandardCircuit('measure');
const measureQasm = qjsToQasm(measureCircuit);
console.log('Measurement QASM:');
console.log(measureQasm);

// Example 8: Custom circuit creation
console.log('\n8. Custom Circuit Creation:');
const customCircuit = {
  bandwidth: 3,
  timewidth: 4,
  qubits: [],
  operations: [
    {
      gate: { symbol: 'H', name: 'Hadamard' },
      momentIndex: 1,
      registerIndices: [1],
      isControlled: false,
      operationMomentId: null
    },
    {
      gate: { symbol: 'X', name: 'Pauli X' },
      momentIndex: 2,
      registerIndices: [2, 1],  // target, control
      isControlled: true,
      operationMomentId: null
    },
    {
      gate: { symbol: 'Z', name: 'Pauli Z' },
      momentIndex: 3,
      registerIndices: [3, 2],  // target, control
      isControlled: true,
      operationMomentId: null
    }
  ]
};

console.log('Custom Circuit Description:', describeQjsCircuit(customCircuit));
const customQasm = qjsToQasm(customCircuit);
console.log('\nCustom Circuit QASM:');
console.log(customQasm);

// Example 9: Error handling in conversion
console.log('\n9. Error Handling in Conversion:');
try {
  const badCircuit = {
    bandwidth: 1,
    timewidth: 1,
    operations: [{
      gate: { symbol: 'X' },
      momentIndex: 0,  // Invalid: should be 1-indexed
      registerIndices: [1],
      isControlled: false
    }]
  };
  qjsToQasm(badCircuit);
} catch (error) {
  console.log('Conversion error:', error.message);
}