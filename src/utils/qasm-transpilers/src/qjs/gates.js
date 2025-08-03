/**
 * Gate definitions and registry for Q.js AST transformations
 * Handles gate creation, controlled gates, and controlled-H decomposition
 */

import { createGateObject } from './utils.js';

/**
 * Supported single-qubit gates in plaintext format
 */
export const SUPPORTED_GATES = {
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

/**
 * QASM gate mappings
 */
export const QASM_GATE_MAP = {
  'h': 'H',
  'x': 'X',
  'y': 'Y',
  'z': 'Z',
  't': 'T',
  's': 'S',
  'rx': 'RX', // X-axis rotation
  'rz': 'RZ', // Z-axis rotation
  'measure': 'M', // Measurement operation
  'cx': 'X', // CNOT -> controlled X
  'cy': 'Y', // controlled Y
  'cz': 'Z', // controlled Z
  'ct': 'T', // controlled T
  'cs': 'S'  // controlled S
};

/**
 * Check if a gate is a parameterized rotation gate
 * @param {string} symbol - Gate symbol to check
 * @returns {boolean} - True if it's a rotation gate
 */
export function isRotationGate(symbol) {
  return ['RX', 'RZ'].includes(symbol);
}

/**
 * Check if a gate symbol is supported
 * @param {string} symbol - Gate symbol to check
 * @returns {boolean} - True if supported
 */
export function isSupportedGate(symbol) {
  return symbol in SUPPORTED_GATES;
}

/**
 * Create a Q.js operation object for a single-qubit gate
 * @param {string} gateSymbol - Gate symbol (H, X, Y, Z, T, S, I, RX, RZ)
 * @param {number} qubitIndex - 1-based qubit index
 * @param {number} momentIndex - 0-based moment index
 * @param {number} [angle] - Rotation angle for RX/RZ gates (in radians)
 * @returns {Object} - Q.js operation object
 */
export function createSingleQubitOperation(gateSymbol, qubitIndex, momentIndex, angle) {
  if (!isSupportedGate(gateSymbol)) {
    throw new Error(`Invalid gate: ${gateSymbol}`);
  }
  
  if (typeof qubitIndex !== 'number' || qubitIndex < 1) {
    throw new Error(`Invalid qubit index: ${qubitIndex} (Q.js uses 1-indexed)`);
  }
  
  if (typeof momentIndex !== 'number' || momentIndex < 0) {
    throw new Error(`Invalid moment index: ${momentIndex}`);
  }
  
  // Validate angle parameter for rotation gates
  if (isRotationGate(gateSymbol)) {
    if (typeof angle !== 'number') {
      throw new Error(`Rotation gate ${gateSymbol} requires angle parameter`);
    }
  }
  
  const operation = {
    gate: createGateObject(gateSymbol),
    momentIndex,
    registerIndices: [qubitIndex],
    isControlled: false,
    operationMomentId: null
  };
  
  // Add angle for rotation gates
  if (isRotationGate(gateSymbol) && typeof angle === 'number') {
    operation.angle = angle;
  }
  
  return operation;
}

/**
 * Create a Q.js operation object for a controlled gate
 * @param {string} gateSymbol - Gate symbol (X, Y, Z, T, S, H)
 * @param {number} targetQubit - 1-based target qubit index
 * @param {number} controlQubit - 1-based control qubit index  
 * @param {number} momentIndex - 0-based moment index
 * @returns {Object} - Q.js operation object
 */
export function createControlledOperation(gateSymbol, targetQubit, controlQubit, momentIndex) {
  if (!isSupportedGate(gateSymbol)) {
    throw new Error(`Invalid gate: ${gateSymbol}`);
  }
  
  if (typeof targetQubit !== 'number' || targetQubit < 1) {
    throw new Error(`Invalid target qubit: ${targetQubit}`);
  }
  
  if (typeof controlQubit !== 'number' || controlQubit < 1) {
    throw new Error(`Invalid control qubit: ${controlQubit}`);
  }
  
  if (targetQubit === controlQubit) {
    throw new Error(`Cannot control gate with its own qubit (qubit ${targetQubit - 1})`);
  }
  
  if (typeof momentIndex !== 'number' || momentIndex < 0) {
    throw new Error(`Invalid moment index: ${momentIndex}`);
  }
  
  return {
    gate: createGateObject(gateSymbol),
    momentIndex,
    registerIndices: [targetQubit, controlQubit], // [target, control] in Q.js format
    isControlled: true,
    operationMomentId: null
  };
}

/**
 * Check if a sequence of QASM operations represents a controlled-H decomposition
 * Pattern: ry(0.25*pi) q[target]; cx q[control], q[target]; ry(-0.25*pi) q[target];
 * @param {string[]} lines - Array of QASM operation lines
 * @param {number} startIndex - Starting index to check
 * @returns {Object|null} - {targetQubit, controlQubit, endIndex} or null if not found
 */
export function isControlledHDecomposition(lines, startIndex) {
  if (startIndex + 2 >= lines.length) {
    return null;
  }
  
  const line1 = lines[startIndex].trim();
  const line2 = lines[startIndex + 1].trim();
  const line3 = lines[startIndex + 2].trim();
  
  // Match ry(0.25*pi) q[X];
  const ry1Match = line1.match(/^ry\(0\.25\*pi\)\s+q\[(\d+)\];?$/);
  if (!ry1Match) return null;
  
  const targetQubit = parseInt(ry1Match[1], 10);
  
  // Match cx q[Y], q[X];
  const cxMatch = line2.match(/^cx\s+q\[(\d+)\],\s*q\[(\d+)\];?$/);
  if (!cxMatch) return null;
  
  const controlQubit = parseInt(cxMatch[1], 10);
  const cxTarget = parseInt(cxMatch[2], 10);
  
  if (cxTarget !== targetQubit) return null;
  
  // Match ry(-0.25*pi) q[X];
  const ry2Match = line3.match(/^ry\(-0\.25\*pi\)\s+q\[(\d+)\];?$/);
  if (!ry2Match) return null;
  
  const ry2Target = parseInt(ry2Match[1], 10);
  if (ry2Target !== targetQubit) return null;
  
  return {
    targetQubit,
    controlQubit,
    endIndex: startIndex + 2
  };
}

/**
 * Check if a sequence of QASM operations represents a SWAP gate decomposition
 * Pattern: cx q[a], q[b]; cx q[b], q[a]; cx q[a], q[b];
 * @param {string[]} lines - Array of QASM operation lines
 * @param {number} startIndex - Starting index to check
 * @returns {Object|null} - {qubit1, qubit2, endIndex} or null if not found
 */
export function isSwapDecomposition(lines, startIndex) {
  if (startIndex + 2 >= lines.length) {
    return null;
  }
  
  const line1 = lines[startIndex].trim();
  const line2 = lines[startIndex + 1].trim();
  const line3 = lines[startIndex + 2].trim();
  
  // Match first CNOT: cx q[a], q[b];
  const cx1Match = line1.match(/^cx\s+q\[(\d+)\],\s*q\[(\d+)\];?$/);
  if (!cx1Match) return null;
  
  const qubit1 = parseInt(cx1Match[1], 10);
  const qubit2 = parseInt(cx1Match[2], 10);
  
  // Self-CNOT is not valid
  if (qubit1 === qubit2) return null;
  
  // Match second CNOT: cx q[b], q[a]; (reverse of first)
  const cx2Match = line2.match(/^cx\s+q\[(\d+)\],\s*q\[(\d+)\];?$/);
  if (!cx2Match) return null;
  
  const cx2Control = parseInt(cx2Match[1], 10);
  const cx2Target = parseInt(cx2Match[2], 10);
  
  if (cx2Control !== qubit2 || cx2Target !== qubit1) return null;
  
  // Match third CNOT: cx q[a], q[b]; (same as first)
  const cx3Match = line3.match(/^cx\s+q\[(\d+)\],\s*q\[(\d+)\];?$/);
  if (!cx3Match) return null;
  
  const cx3Control = parseInt(cx3Match[1], 10);
  const cx3Target = parseInt(cx3Match[2], 10);
  
  if (cx3Control !== qubit1 || cx3Target !== qubit2) return null;
  
  return { qubit1, qubit2, endIndex: startIndex + 2 };
}

/**
 * Create SWAP operation for Q.js AST  
 * @param {number} qubit1 - First qubit (1-based for Q.js)
 * @param {number} qubit2 - Second qubit (1-based for Q.js)
 * @param {number} momentIndex - Moment index (1-based for Q.js)
 * @returns {Object} - Q.js operation object
 */
export function createSwapOperation(qubit1, qubit2, momentIndex) {
  if (typeof qubit1 !== 'number' || qubit1 <= 0) {
    throw new Error(`Invalid qubit1: ${qubit1}`);
  }
  
  if (typeof qubit2 !== 'number' || qubit2 <= 0) {
    throw new Error(`Invalid qubit2: ${qubit2}`);
  }
  
  if (qubit1 === qubit2) {
    throw new Error(`Cannot swap qubit with itself: ${qubit1}`);
  }
  
  if (typeof momentIndex !== 'number' || momentIndex < 0) {
    throw new Error(`Invalid moment index: ${momentIndex}`);
  }
  
  return {
    gate: createGateObject('SWAP'),
    momentIndex,
    registerIndices: [qubit1, qubit2], // Both qubits for SWAP
    isControlled: false,
    isSwap: true, // Special flag to identify SWAP operations
    operationMomentId: null
  };
}

/**
 * Generate controlled-H decomposition QASM code
 * @param {number} targetQubit - 0-based target qubit index (QASM format)
 * @param {number} controlQubit - 0-based control qubit index (QASM format)
 * @returns {string} - QASM decomposition code
 */
export function generateControlledHDecomposition(targetQubit, controlQubit) {
  if (typeof targetQubit !== 'number' || targetQubit < 0) {
    throw new Error(`Invalid target qubit: ${targetQubit}`);
  }
  
  if (typeof controlQubit !== 'number' || controlQubit < 0) {
    throw new Error(`Invalid control qubit: ${controlQubit}`);
  }
  
  return '// Controlled-H decomposition\n' +
         `ry(0.25*pi) q[${targetQubit}];\n` +
         `cx q[${controlQubit}], q[${targetQubit}];\n` +
         `ry(-0.25*pi) q[${targetQubit}];\n`;
}

/**
 * Parse a QASM gate line and extract gate information
 * @param {string} line - QASM gate line like "h q[0];" or "cx q[0], q[1];" or "y q[2];"
 * @returns {Object} - {gateType, qubits: number[]} or null if invalid
 */
export function parseQasmGateLine(line) {
  const cleaned = line.trim().replace(/;$/, '');
  
  // Single-qubit gates: h q[0] (case insensitive)
  const singleMatch = cleaned.match(/^([hxyztsHXYZTS])\s+q\[(-?\d+)\]$/);
  if (singleMatch) {
    const gateType = singleMatch[1].toLowerCase();
    const qubit = parseInt(singleMatch[2], 10);
    return {
      gateType,
      qubits: [qubit],
      isControlled: false
    };
  }
  
  // Parameterized rotation gates: rx(angle) q[0], rz(angle) q[0] (case insensitive)
  const rotationMatch = cleaned.match(/^(rx|rz|RX|RZ)\(([^)]+)\)\s+q\[(-?\d+)\]$/i);
  if (rotationMatch) {
    const gateType = rotationMatch[1].toLowerCase();
    const angleExpr = rotationMatch[2];
    const qubit = parseInt(rotationMatch[3], 10);
    return {
      gateType,
      angle: angleExpr,
      qubits: [qubit],
      isControlled: false
    };
  }
  
  // Register-wide gates: h q; (applies to all qubits in register)
  const registerMatch = cleaned.match(/^([hxyztsHXYZTS])\s+q;?$/);
  if (registerMatch) {
    const gateType = registerMatch[1].toLowerCase();
    return {
      gateType,
      qubits: 'all', // Special marker for all qubits
      isControlled: false
    };
  }
  
  // Register-wide rotation gates: rx(angle) q; rz(angle) q; (case insensitive)
  const registerRotationMatch = cleaned.match(/^(rx|rz|RX|RZ)\(([^)]+)\)\s+q;?$/i);
  if (registerRotationMatch) {
    const gateType = registerRotationMatch[1].toLowerCase();
    const angleExpr = registerRotationMatch[2];
    return {
      gateType,
      angle: angleExpr,
      qubits: 'all', // Special marker for all qubits
      isControlled: false
    };
  }
  
  // Two-qubit controlled gates: cx q[0], q[1]
  const controlMatch = cleaned.match(/^(cx|cy|cz|ct|cs)\s+q\[(-?\d+)\],\s*q\[(-?\d+)\]$/);
  if (controlMatch) {
    const gateType = controlMatch[1];
    const control = parseInt(controlMatch[2], 10);
    const target = parseInt(controlMatch[3], 10);
    return {
      gateType,
      qubits: [control, target],
      isControlled: true
    };
  }
  
  // Measurement operations: measure q[0] -> c[0]
  const measureMatch = cleaned.match(/^measure\s+q\[(-?\d+)\]\s*->\s*c\[(-?\d+)\]$/);
  if (measureMatch) {
    const qubit = parseInt(measureMatch[1], 10);
    const classicalBit = parseInt(measureMatch[2], 10);
    return {
      gateType: 'measure',
      qubits: [qubit],
      classicalBit: classicalBit,
      isMeasurement: true
    };
  }
  
  // RY gates (part of controlled-H decomposition)
  const ryMatch = cleaned.match(/^ry\(([-+]?0\.25\*pi)\)\s+q\[(-?\d+)\]$/);
  if (ryMatch) {
    const angle = ryMatch[1];
    const qubit = parseInt(ryMatch[2], 10);
    return {
      gateType: 'ry',
      angle,
      qubits: [qubit],
      isControlled: false
    };
  }
  
  return null;
}

/**
 * Convert QASM gate type to plaintext gate symbol
 * @param {string} qasmGate - QASM gate type (h, x, y, z, t, s, rx, rz, measure, cx, cy, cz, ct, cs)
 * @returns {string} - Plaintext gate symbol (H, X, Y, Z, T, S, RX, RZ, M)
 */
export function qasmToPlaintextGate(qasmGate) {
  const mapping = {
    'h': 'H',
    'x': 'X', 
    'y': 'Y',
    'z': 'Z',
    't': 'T',
    's': 'S',
    'rx': 'RX', // X-axis rotation
    'rz': 'RZ', // Z-axis rotation
    'measure': 'M', // Measurement operation
    'cx': 'X', // CNOT becomes controlled X
    'cy': 'Y', // becomes controlled Y
    'cz': 'Z', // becomes controlled Z
    'ct': 'T', // becomes controlled T
    'cs': 'S'  // becomes controlled S
  };
  
  if (!mapping[qasmGate]) {
    throw new Error(`Gate ${qasmGate} not supported in plaintext format`);
  }
  
  return mapping[qasmGate];
}

/**
 * Convert plaintext gate symbol to QASM gate type
 * @param {string} plaintextGate - Plaintext gate symbol (H, X, Y, Z, T, S, RX, RZ, M)
 * @param {boolean} isControlled - Whether this is a controlled gate
 * @returns {string} - QASM gate type
 */
export function plaintextToQasmGate(plaintextGate, isControlled = false) {
  if (isControlled) {
    const mapping = {
      'X': 'cx',
      'Y': 'cy',
      'Z': 'cz',
      'T': 'ct',
      'S': 'cs',
      'H': 'controlled-h' // Special case requiring decomposition
      // Note: Controlled RX/RZ gates not yet supported
      // Note: Controlled measurements not supported
    };
    
    if (!mapping[plaintextGate]) {
      throw new Error(`Controlled ${plaintextGate} not supported`);
    }
    
    return mapping[plaintextGate];
  }
  
  const mapping = {
    'H': 'h',
    'X': 'x',
    'Y': 'y',
    'Z': 'z',
    'T': 't',
    'S': 's',
    'RX': 'rx', // X-axis rotation
    'RZ': 'rz', // Z-axis rotation
    'M': 'measure', // Measurement operation
    'I': null // Identity gates are omitted in QASM
  };
  
  if (!(plaintextGate in mapping)) {
    throw new Error(`Gate ${plaintextGate} not supported in QASM format`);
  }
  
  return mapping[plaintextGate];
}