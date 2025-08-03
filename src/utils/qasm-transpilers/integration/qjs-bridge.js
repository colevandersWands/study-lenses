/**
 * Bridge utilities for integrating the transpiler with q.js quantum circuit editor
 * Provides helper functions to convert between q.js circuit format and plaintext
 */

import { plaintextToQasm, qasmToPlaintext } from '../index.js';
import { parseTextToQjsAst } from '../src/qjs/plaintext-to-qjs-ast.js';
import { qjsAstToText } from '../src/qjs/qjs-ast-to-plaintext.js';

/**
 * Convert a q.js circuit object to OpenQASM 2.0
 * @param {Object} qjsCircuit - Circuit in q.js format
 * @returns {string} OpenQASM 2.0 code
 */
export function qjsToQasm(qjsCircuit) {
  // First convert q.js circuit to plaintext
  const plaintext = qjsAstToText(qjsCircuit);
  // Then convert plaintext to QASM
  return plaintextToQasm(plaintext);
}

/**
 * Convert OpenQASM 2.0 to q.js circuit object
 * @param {string} qasm - OpenQASM 2.0 code
 * @returns {Object} Circuit in q.js format
 */
export function qasmToQjs(qasm) {
  // First convert QASM to plaintext
  const plaintext = qasmToPlaintext(qasm);
  // Then convert plaintext to q.js AST
  return parseTextToQjsAst(plaintext);
}

/**
 * Validate that a q.js circuit can be converted to QASM
 * @param {Object} qjsCircuit - Circuit in q.js format
 * @returns {Object} Validation result with {valid: boolean, error?: string}
 */
export function validateQjsCircuit(qjsCircuit) {
  try {
    const plaintext = qjsAstToText(qjsCircuit);
    plaintextToQasm(plaintext);
    return { valid: true };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

/**
 * Get a human-readable description of a q.js circuit
 * @param {Object} qjsCircuit - Circuit in q.js format
 * @returns {Object} Circuit description
 */
export function describeQjsCircuit(qjsCircuit) {
  const gates = {};
  let controlledGates = 0;
  let measurements = 0;
  
  if (qjsCircuit.operations) {
    for (const op of qjsCircuit.operations) {
      const symbol = op.gate?.symbol || 'Unknown';
      gates[symbol] = (gates[symbol] || 0) + 1;
      
      if (op.isControlled) controlledGates++;
      if (symbol === 'M') measurements++;
    }
  }
  
  return {
    qubits: qjsCircuit.bandwidth || 0,
    depth: qjsCircuit.timewidth || 0,
    gates,
    controlledGates,
    measurements,
    totalOperations: qjsCircuit.operations?.length || 0
  };
}

/**
 * Create a simple q.js circuit from common patterns
 * @param {string} pattern - Pattern name ('bell', 'ghz', 'qft2', etc.)
 * @param {number} qubits - Number of qubits (for scalable patterns)
 * @returns {Object} Circuit in q.js format
 */
export function createStandardCircuit(pattern, qubits = 2) {
  const patterns = {
    'bell': 'H-I\nI-X#0',
    'ghz3': 'H-I-I\nI-X#0-I\nI-I-X#0',
    'swap': 'SWAP#1\nSWAP#0',
    'qft2': 'H-H#0\nI-H',
    'measure': 'H-M\nH-M'
  };
  
  if (pattern === 'ghz' && qubits > 2) {
    // Generate GHZ for n qubits
    let lines = ['H'];
    for (let i = 1; i < qubits; i++) {
      lines[0] += '-I';
    }
    for (let i = 1; i < qubits; i++) {
      let line = '';
      for (let j = 0; j < qubits; j++) {
        line += (j === i) ? '-X#0' : '-I';
      }
      lines.push(line.substring(1));
    }
    return parseTextToQjsAst(lines.join('\n'));
  }
  
  const plaintext = patterns[pattern] || patterns['bell'];
  return parseTextToQjsAst(plaintext);
}

/**
 * Optimize a q.js circuit (basic optimizations)
 * @param {Object} qjsCircuit - Circuit in q.js format
 * @returns {Object} Optimized circuit
 */
export function optimizeQjsCircuit(qjsCircuit) {
  // Convert to plaintext, which automatically handles some optimizations
  const plaintext = qjsAstToText(qjsCircuit);
  // Parse back to get a clean AST
  return parseTextToQjsAst(plaintext);
}

/**
 * Compare two q.js circuits for equivalence
 * @param {Object} circuit1 - First circuit
 * @param {Object} circuit2 - Second circuit
 * @returns {boolean} True if circuits are equivalent
 */
export function areCircuitsEquivalent(circuit1, circuit2) {
  try {
    const qasm1 = qjsToQasm(circuit1);
    const qasm2 = qjsToQasm(circuit2);
    
    // Normalize QASM by removing comments and extra whitespace
    const normalize = (qasm) => qasm
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('//'))
      .join('\n');
    
    return normalize(qasm1) === normalize(qasm2);
  } catch {
    return false;
  }
}