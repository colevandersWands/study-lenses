import { parseTextToQjsAst } from './qjs/plaintext-to-qjs-ast.js';
import { qjsAstToQasm } from './qjs/qjs-ast-to-qasm.js';

/**
 * Convert plaintext quantum circuit to OpenQASM 2.0
 * @param {string} plaintext - Circuit in plaintext format
 * @param {boolean} includeTimingComments - Whether to include timing preservation comments (default: true)
 * @returns {string} OpenQASM 2.0 code
 * @pure
 */
export function plaintextToQasm(plaintext, includeTimingComments = true) {
  // Handle invalid input (null, undefined, or non-string)
  if (plaintext == null || typeof plaintext !== 'string') {
    // Return minimal QASM for invalid input
    return 'OPENQASM 2.0;\n' +
           'include "qelib1.inc";\n' +
           'qreg q[1];\n';
  }
  
  try {
    // Parse plaintext to Q.js AST (handles empty strings with timing preservation)
    const ast = parseTextToQjsAst(plaintext);
    
    // Convert Q.js AST to OpenQASM
    const qasm = qjsAstToQasm(ast, includeTimingComments);
    
    return qasm;
  } catch (error) {
    // Re-throw with context
    throw new Error(`Failed to convert plaintext to QASM: ${error.message}`);
  }
}