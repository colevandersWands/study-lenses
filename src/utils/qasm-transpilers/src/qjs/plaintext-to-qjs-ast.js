/**
 * Pure function to parse plaintext quantum circuit to Q.js AST format
 * Refactored from ../../q.js:Q.Circuit.fromText() to be a pure transformation
 */

import { createMinimalQjsAst, validateQjsAst, createGateObject } from './utils.js';
import { parseCompleteCircuitTiming, timingToOperations, calculateTimewidth } from './timing.js';
import { createSingleQubitOperation, createControlledOperation, isSupportedGate, isRotationGate } from './gates.js';

export function parseTextToQjsAst(text) {
  // Handle template literal objects (e.g., { raw: ['H-X'] })
  if (text && typeof text === 'object' && text.raw && Array.isArray(text.raw)) {
    text = text.raw.join('');
  }
  
  // Handle invalid input (null, undefined, or non-string)
  if (text == null || typeof text !== 'string') {
    return createMinimalQjsAst(3, 0); // Match Q.Circuit constructor default
  }
  
  // Handle empty or whitespace-only input
  if (text.trim() === '') {
    const ast = createMinimalQjsAst(1, 0);
    // Add timing preservation for empty string to enable roundtrip detection
    // Note: This conflicts with some AST tests that expect no timingPreservation
    // But it's necessary for correct roundtrip behavior
    ast.timingPreservation = {
      source: 'plaintext',
      originalText: text
    };
    return ast;
  }
  
  try {
    // Parse the complete circuit timing structure
    const circuitTiming = parseCompleteCircuitTiming(text);
    
    // Handle empty circuit
    if (circuitTiming.qubits.length === 0) {
      return createMinimalQjsAst(1, 0);
    }
    
    const bandwidth = circuitTiming.qubits.length;
    const timewidth = circuitTiming.maxTime; // maxTime already accounts for positions, moments will be 1-indexed
    
    // Create the basic AST structure
    const ast = createMinimalQjsAst(bandwidth, timewidth);
    
    // Convert timing information to Q.js operations
    const operations = [];
    
    for (let qubitIndex = 0; qubitIndex < circuitTiming.qubits.length; qubitIndex++) {
      const qubitGates = circuitTiming.qubits[qubitIndex];
      
      for (const gateInfo of qubitGates) {
        // Skip identity gates - they don't create operations
        if (gateInfo.gate === 'I') {
          continue;
        }
        
        // Validate gate is supported
        if (!isSupportedGate(gateInfo.gate)) {
          throw new Error(`Invalid gate: ${gateInfo.gate}`);
        }
        
        // Special validation for rotation gates - they must have angle parameters
        if (isRotationGate(gateInfo.gate) && gateInfo.angle === undefined) {
          throw new Error(`Invalid gate: ${gateInfo.gate}`);
        }
        
        const targetQubit = qubitIndex + 1; // Convert to 1-based
        const momentIndex = gateInfo.position + 1; // Convert to 1-based moments
        
        if (gateInfo.control !== null) {
          // This is a controlled gate
          const controlQubit = gateInfo.control + 1; // Convert to 1-based
          
          // Validate control qubit is within circuit bounds
          if (gateInfo.control < 0 || gateInfo.control >= bandwidth) {
            throw new Error(`Control qubit ${gateInfo.control} does not exist (circuit has ${bandwidth} qubits)`);
          }
          
          // Check for self-control
          if (targetQubit === controlQubit) {
            throw new Error(`Cannot control gate with its own qubit (qubit ${qubitIndex})`);
          }
          
          const operation = createControlledOperation(
            gateInfo.gate, 
            targetQubit, 
            controlQubit, 
            momentIndex
          );
          
          operations.push(operation);
        } else {
          // Single-qubit gate
          const operation = createSingleQubitOperation(
            gateInfo.gate,
            targetQubit,
            momentIndex,
            gateInfo.angle  // Pass angle parameter for rotation gates
          );
          
          operations.push(operation);
        }
      }
    }
    
    // Add operations to the AST
    ast.operations = operations;
    
    // Use the timewidth calculated from timing analysis (includes gaps)
    ast.timewidth = timewidth;
    
    // Add timing preservation metadata for ALL patterns that need exact round-trip preservation
    // This includes: identity gates (H-I-X), consecutive gates (HXZ), timing gaps (H--X), empty lines, etc.
    const hasTimingPreservation = 
      text.includes('--') ||  // Multiple consecutive hyphens (H--X)
      text.includes('I') ||   // Any identity gates (H-I-X, I-I-I) 
      text.includes('\n\n') || // Empty lines in circuit (H\n\nX)
      text.startsWith('\n') || // Leading newline (\nH)
      text.endsWith('\n') ||   // Trailing newline (H\n)
      text.split('\n').some(line => {
        const trimmed = line.trim();
        // Check for consecutive gates (either pure consecutive like HXZ, or mixed like HX-Z)
        // Look for any two consecutive gate characters not separated by hyphen
        if (/[HXZI]{2,}/.test(trimmed)) {
          return true;
        }
        // Check for empty parts in hyphen-separated lines (H--X has empty part)
        if (trimmed.includes('-') && trimmed.split('-').some(part => part.trim() === '')) {
          return true;
        }
        return false;
      });
    
    if (hasTimingPreservation) {
      ast.timingPreservation = {
        source: 'plaintext', 
        originalText: text
      };
    }
    
    // Validate the final AST structure
    validateQjsAst(ast);
    
    return ast;
    
  } catch (error) {
    // Re-throw with context about the parsing operation
    throw new Error(`Failed to parse plaintext circuit: ${error.message}`);
  }
}