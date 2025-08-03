/**
 * Pure function to convert Q.js AST format to OpenQASM 2.0
 * Handles standard gates and controlled-H decomposition generation
 */

import { indexTo0Based, validateQjsAst } from './utils.js';
import { generateControlledHDecomposition, plaintextToQasmGate, isRotationGate } from './gates.js';
import { formatAngleForQasm } from './utils.js';

export function qjsAstToQasm(qjsAst, includeTimingComments = true) {
  if (!qjsAst || typeof qjsAst !== 'object') {
    return '';
  }
  
  try {
    // Use comprehensive validation for input AST
    validateQjsAst(qjsAst);
    
    const { bandwidth, operations } = qjsAst;
    
    // Generate QASM header
    let qasm = 'OPENQASM 2.0;\n';
    qasm += 'include "qelib1.inc";\n';
    qasm += `qreg q[${bandwidth}];\n`;
    
    // Add classical register declaration if classical bits exist
    if (qjsAst.classicalBits && qjsAst.classicalBits > 0) {
      qasm += `creg c[${qjsAst.classicalBits}];\n`;
    }
    
    // Add timing preservation metadata as comments if available and requested
    if (includeTimingComments && qjsAst.timingPreservation && qjsAst.timingPreservation.source === 'plaintext') {
      qasm += '// TIMING_PRESERVATION_START\n';
      const originalLines = qjsAst.timingPreservation.originalText.split('\n');
      for (const line of originalLines) {
        qasm += `// ${line}\n`;
      }
      qasm += '// TIMING_PRESERVATION_END\n';
    }
    
    // Handle empty circuit
    if (operations.length === 0) {
      return qasm;
    }
    
    // Sort operations by moment index for temporal ordering
    // For same moment, sort by lowest qubit index (matches original Q.js behavior)
    const sortedOps = [...operations]
      .sort((a, b) => {
        if (a.momentIndex !== b.momentIndex) {
          return a.momentIndex - b.momentIndex;
        }
        // Same moment - sort by lowest register index (Q.js compatible)
        // This ensures operations within same moment are ordered by qubit index
        return Math.min(...a.registerIndices) - Math.min(...b.registerIndices);
      });
    
    // Convert operations to QASM
    for (const op of sortedOps) {
      if (!op.gate || !op.gate.symbol) {
        throw new Error('Invalid operation: missing gate');
      }
      
      // Validate qubit indices
      if (!Array.isArray(op.registerIndices) || op.registerIndices.length === 0) {
        throw new Error('Invalid operation: missing registerIndices');
      }
      
      // Check all qubit indices are valid 1-indexed values
      for (const idx of op.registerIndices) {
        if (typeof idx !== 'number' || idx < 1) {
          throw new Error(`Invalid qubit index: ${idx} (Q.js uses 1-indexed)`);
        }
        if (idx > bandwidth) {
          throw new Error(`Qubit index ${idx} exceeds circuit size (${bandwidth} qubits)`);
        }
      }
      
      // Validate controlled gate structure
      if (op.isControlled && op.registerIndices.length !== 2) {
        throw new Error('Controlled gate must have exactly 2 qubits');
      }
      
      // Skip identity gates - they don't generate QASM
      if (op.gate.symbol === 'I') {
        continue;
      }
      
      // Handle measurement operations
      if (op.isMeasurement && op.gate.symbol === 'M') {
        const targetQubit = indexTo0Based(op.registerIndices[0]); // Convert to 0-indexed
        
        // Validate classical bit index is specified
        if (typeof op.classicalBit !== 'number' || op.classicalBit < 0) {
          throw new Error(`Invalid classical bit index for measurement: ${op.classicalBit}`);
        }
        
        qasm += `measure q[${targetQubit}] -> c[${op.classicalBit}];\n`;
        continue;
      }
      
      if (op.isSwap && op.gate.symbol === 'SWAP' && op.registerIndices.length === 2) {
        // SWAP gate: decompose to 3-CNOT sequence
        const qubit1 = indexTo0Based(op.registerIndices[0]); // Convert to 0-indexed
        const qubit2 = indexTo0Based(op.registerIndices[1]); // Convert to 0-indexed
        
        // SWAP decomposition: CX(a,b), CX(b,a), CX(a,b)
        qasm += `cx q[${qubit1}], q[${qubit2}];\n`;
        qasm += `cx q[${qubit2}], q[${qubit1}];\n`;
        qasm += `cx q[${qubit1}], q[${qubit2}];\n`;
      } else if (op.isControlled && op.registerIndices.length === 2) {
        // Controlled gate: registerIndices = [target, control] in 1-indexed
        const targetQubit = indexTo0Based(op.registerIndices[0]); // Convert to 0-indexed
        const controlQubit = indexTo0Based(op.registerIndices[1]); // Convert to 0-indexed
        
        if (op.gate.symbol === 'H') {
          // Controlled-H requires decomposition
          qasm += generateControlledHDecomposition(targetQubit, controlQubit);
        } else {
          // Standard controlled gates (CX, CZ)
          try {
            const qasmGate = plaintextToQasmGate(op.gate.symbol, true);
            qasm += `${qasmGate} q[${controlQubit}], q[${targetQubit}];\n`;
          } catch (error) {
            throw new Error(`Unsupported gate type: ${op.gate.symbol}`);
          }
        }
      } else {
        // Single-qubit gate
        const targetQubit = indexTo0Based(op.registerIndices[0]); // Convert to 0-indexed
        
        try {
          const qasmGate = plaintextToQasmGate(op.gate.symbol, false);
          if (qasmGate) { // Skip null gates (like Identity)
            // Handle rotation gates with angle parameters
            if (isRotationGate(op.gate.symbol) && typeof op.angle === 'number') {
              const angleStr = formatAngleForQasm(op.angle);
              qasm += `${qasmGate}(${angleStr}) q[${targetQubit}];\n`;
            } else {
              qasm += `${qasmGate} q[${targetQubit}];\n`;
            }
          }
        } catch (error) {
          throw new Error(`Unsupported gate type: ${op.gate.symbol}`);
        }
      }
    }
    
    return qasm;
    
  } catch (error) {
    throw new Error(`Failed to convert Q.js AST to QASM: ${error.message}`);
  }
}