/**
 * Core utilities for Q.js AST transformations
 * Provides index conversion, validation, and parsing helpers
 */

/**
 * Convert 0-indexed to 1-indexed (for Q.js compatibility)
 */
export function indexTo1Based(index) {
  if (typeof index !== 'number' || index < 0) {
    throw new Error(`Invalid index: ${index}`);
  }
  return index + 1;
}

/**
 * Convert 1-indexed to 0-indexed (for QASM compatibility)
 */
export function indexTo0Based(index) {
  if (typeof index !== 'number' || index < 1) {
    throw new Error(`Invalid 1-based index: ${index}`);
  }
  return index - 1;
}

/**
 * Parse angle parameter from plaintext rotation gates
 * @param {string} angleStr - Angle string like "pi/2", "0.5*pi", "1.57" 
 * @returns {number} - Angle in radians
 */
export function parseAngle(angleStr) {
  if (!angleStr || typeof angleStr !== 'string') {
    throw new Error(`Invalid angle string: ${angleStr}`);
  }
  
  const clean = angleStr.trim();
  
  // Handle pi expressions: pi/2, pi/4, 0.5*pi, 2*pi, etc.
  if (clean.includes('pi')) {
    // Replace pi with Math.PI and evaluate
    const expression = clean.replace(/pi/g, Math.PI.toString());
    try {
      // Simple evaluation for basic expressions
      // Support patterns like: pi/2, 0.5*pi, 2*pi, pi/4, -pi/2, etc.
      const result = Function(`"use strict"; return (${expression})`)();
      if (typeof result === 'number' && !isNaN(result)) {
        return result;
      } else {
        throw new Error(`Invalid angle expression: ${clean}`);
      }
    } catch (error) {
      throw new Error(`Invalid angle expression: ${clean}`);
    }
  }
  
  // Handle numeric values
  const numeric = parseFloat(clean);
  if (isNaN(numeric)) {
    throw new Error(`Invalid angle value: ${clean}`);
  }
  
  return numeric;
}

/**
 * Format angle for QASM output
 * @param {number} angle - Angle in radians
 * @returns {string} - QASM-compatible angle expression
 */
export function formatAngleForQasm(angle) {
  if (typeof angle !== 'number' || isNaN(angle)) {
    throw new Error(`Invalid angle: ${angle}`);
  }
  
  // Common angle values in terms of pi
  const piRatio = angle / Math.PI;
  
  // Check for common fractions of pi
  if (Math.abs(piRatio - 0.5) < 1e-10) return 'pi/2';
  if (Math.abs(piRatio - 0.25) < 1e-10) return 'pi/4';
  if (Math.abs(piRatio - 1) < 1e-10) return 'pi';
  if (Math.abs(piRatio - 2) < 1e-10) return '2*pi';
  if (Math.abs(piRatio - (-0.5)) < 1e-10) return '-pi/2';
  if (Math.abs(piRatio - (-0.25)) < 1e-10) return '-pi/4';
  if (Math.abs(piRatio - (-1)) < 1e-10) return '-pi';
  
  // For other values, express as fraction or decimal times pi
  if (Math.abs(piRatio) > 1e-10) {
    // Check if it's a simple fraction
    const simplified = piRatio.toFixed(6);
    if (Math.abs(piRatio - parseFloat(simplified)) < 1e-10) {
      return `${simplified}*pi`;
    }
  }
  
  // Fall back to decimal representation
  return angle.toString();
}

/**
 * Parse rotation gate with angle from plaintext
 * @param {string} gateStr - Gate string like "RX(pi/2)" or "RZ(1.57)"
 * @returns {Object} - {gate: string, angle: number} or {gate: string} for non-rotation
 */
export function parseRotationGate(gateStr) {
  if (!gateStr || typeof gateStr !== 'string') {
    throw new Error(`Invalid gate string: ${gateStr}`);
  }
  
  const clean = gateStr.trim();
  
  // Check for rotation gate with angle: RX(pi/2), RZ(0.5)
  const rotationMatch = clean.match(/^(RX|RZ)\(([^)]+)\)$/i);
  if (rotationMatch) {
    const gate = rotationMatch[1].toUpperCase();
    const angleStr = rotationMatch[2];
    const angle = parseAngle(angleStr);
    return { gate, angle };
  }
  
  // Regular gate without angle
  return { gate: clean };
}

/**
 * Parse control notation from plaintext gates
 * @param {string} gateStr - Gate string like "X#1" or "H"
 * @returns {Object} - {gate: string, control: number|null}
 */
export function parseControlNotation(gateStr) {
  if (!gateStr || typeof gateStr !== 'string') {
    throw new Error(`Invalid gate string: ${gateStr}`);
  }

  // Remove whitespace
  const clean = gateStr.trim();
  
  // Check for control syntax
  if (clean.includes('#')) {
    const parts = clean.split('#');
    if (parts.length !== 2) {
      throw new Error(`Invalid gate syntax: ${clean}`);
    }
    
    const gate = parts[0];
    const controlStr = parts[1];
    
    if (!gate) {
      throw new Error(`Invalid control syntax: ${clean}`);
    }
    
    // Enhanced validation for control string
    if (!controlStr || controlStr.trim() === '') {
      throw new Error(`Invalid control syntax: ${clean}`);
    }
    
    // Check for floating point numbers
    if (controlStr.includes('.')) {
      throw new Error(`Invalid control qubit: ${controlStr}`);
    }
    
    // Check for negative numbers (including "-1")
    if (controlStr.includes('-')) {
      throw new Error(`Invalid control qubit: ${controlStr}`);
    }
    
    // Parse integer and validate
    const control = parseInt(controlStr, 10);
    if (isNaN(control) || control < 0 || !Number.isInteger(Number(controlStr))) {
      throw new Error(`Invalid control qubit: ${controlStr}`);
    }
    
    // Special handling for SWAP gates
    if (gate === 'SWAP') {
      return { gate, control, isSwap: true };
    }
    
    return { gate, control };
  }
  
  return { gate: clean, control: null };
}

/**
 * Create a basic Q.js gate object structure
 * @param {string} symbol - Gate symbol (H, X, Y, Z, T, S, I, RX, RZ)
 * @returns {Object} - Q.js compatible gate object
 */
export function createGateObject(symbol) {
  const gateMap = {
    'H': 'Hadamard',
    'X': 'Pauli X',
    'Y': 'Pauli Y',
    'Z': 'Pauli Z',
    'T': 'T gate (π/4 phase)',
    'S': 'S gate (π/2 phase)',
    'I': 'Identity',
    'RX': 'X-axis rotation',
    'RZ': 'Z-axis rotation',
    'M': 'Measure',
    'SWAP': 'SWAP gate'
  };
  
  if (!gateMap[symbol]) {
    throw new Error(`Unsupported gate type: ${symbol}`);
  }
  
  return {
    symbol,
    name: gateMap[symbol],
    applyToQubit: function() {
      // Mock function for testing compatibility
      return this;
    }
  };
}

/**
 * Create a Q.js qubit object
 * @param {number} registerIndex - 1-based qubit index
 * @returns {Object} - Q.js compatible qubit object
 */
export function createQubitObject(registerIndex) {
  if (typeof registerIndex !== 'number' || registerIndex < 1) {
    throw new Error(`Invalid qubit registerIndex: ${registerIndex}`);
  }
  
  return {
    x: registerIndex - 1, // 0-based position
    y: 0,
    registerIndex, // 1-based index
    alpha: { r: 1, i: 0 }, // Complex number representing |0⟩ amplitude
    beta: { r: 0, i: 0 }   // Complex number representing |1⟩ amplitude
  };
}

/**
 * Validate Q.js AST structure
 * @param {Object} ast - Q.js AST object to validate
 * @throws {Error} - If AST structure is invalid
 */
export function validateQjsAst(ast) {
  if (!ast || typeof ast !== 'object') {
    throw new Error('AST must be an object');
  }
  
  // Check required properties
  const required = ['bandwidth', 'timewidth', 'qubits', 'operations', 'results', 'matrix', 'needsEvaluation', 'history'];
  for (const prop of required) {
    if (!(prop in ast)) {
      // Use specific error messages for properties that tests expect
      if (prop === 'qubits') {
        throw new Error('Invalid Q.js AST: missing qubits array');
      } else if (prop === 'operations') {
        throw new Error('Invalid Q.js AST: missing operations array');
      } else {
        throw new Error(`Invalid Q.js AST: missing ${prop}`);
      }
    }
  }
  
  // Validate types
  if (typeof ast.bandwidth !== 'number' || ast.bandwidth < 1) {
    throw new Error(`Invalid bandwidth: ${ast.bandwidth}`);
  }
  
  if (typeof ast.timewidth !== 'number' || ast.timewidth < 0) {
    throw new Error(`Invalid timewidth: ${ast.timewidth}`);
  }
  
  if (!Array.isArray(ast.qubits)) {
    throw new Error('Invalid Q.js AST: missing qubits array');
  }
  
  if (!Array.isArray(ast.operations)) {
    throw new Error('Invalid Q.js AST: missing operations array');
  }
  
  // Validate bandwidth matches qubit count
  if (ast.bandwidth !== ast.qubits.length) {
    throw new Error(`AST bandwidth (${ast.bandwidth}) does not match qubit count (${ast.qubits.length})`);
  }
  
  // Validate qubit structure
  for (let i = 0; i < ast.qubits.length; i++) {
    const qubit = ast.qubits[i];
    if (!qubit || typeof qubit.registerIndex !== 'number' || qubit.registerIndex !== i + 1) {
      throw new Error(`Invalid qubit at index ${i}: expected registerIndex ${i + 1}`);
    }
  }
  
  // Validate operations
  for (const op of ast.operations) {
    if (!op.gate || !op.gate.symbol) {
      throw new Error('Invalid operation: missing gate');
    }
    
    if (typeof op.momentIndex !== 'number' || op.momentIndex < 0) {
      throw new Error(`Invalid momentIndex: ${op.momentIndex}`);
    }
    
    if (!Array.isArray(op.registerIndices) || op.registerIndices.length === 0) {
      throw new Error('Invalid operation: missing registerIndices');
    }
    
    // Validate qubit indices are within range and 1-indexed
    for (const idx of op.registerIndices) {
      if (typeof idx !== 'number' || idx < 1) {
        throw new Error(`Invalid qubit index: ${idx} (Q.js uses 1-indexed)`);
      }
      if (idx > ast.bandwidth) {
        throw new Error(`Qubit index ${idx} exceeds circuit size (${ast.bandwidth} qubits)`);
      }
    }
    
    // Validate controlled gate structure
    if (op.isControlled && op.registerIndices.length !== 2) {
      throw new Error('Controlled gate must have exactly 2 qubits');
    }
  }
}

/**
 * Create minimal Q.js AST structure
 * @param {number} bandwidth - Number of qubits
 * @param {number} timewidth - Number of time steps
 * @param {number} classicalBits - Number of classical bits (optional)
 * @returns {Object} - Minimal Q.js AST object
 */
export function createMinimalQjsAst(bandwidth = 1, timewidth = 0, classicalBits = 0) {
  const qubits = [];
  for (let i = 1; i <= bandwidth; i++) {
    qubits.push(createQubitObject(i));
  }
  
  const ast = {
    bandwidth,
    timewidth,
    qubits,
    operations: [],
    results: [],
    matrix: null,
    needsEvaluation: true,
    history: {} // Mock history object
  };
  
  // Add classical register support if classical bits are specified
  if (classicalBits > 0) {
    ast.classicalBits = classicalBits;
    ast.classicalRegister = new Array(classicalBits).fill(0); // Initialize all bits to 0
  }
  
  return ast;
}

/**
 * Deep clone an object (for immutable operations)
 * @param {*} obj - Object to clone
 * @returns {*} - Deep cloned object
 */
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item));
  }
  
  const cloned = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  
  return cloned;
}