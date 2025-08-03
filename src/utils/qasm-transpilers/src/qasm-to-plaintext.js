import { parseQasmToQjsAst } from './qjs/qasm-to-qjs-ast.js';
import { qjsAstToText } from './qjs/qjs-ast-to-plaintext.js';

/**
 * Convert OpenQASM 2.0 to plaintext circuit format
 * @param {string} qasm - OpenQASM 2.0 code
 * @returns {string} Plaintext circuit
 * @pure
 */
export function qasmToPlaintext(qasm) {
  // Handle empty input
  if (!qasm || qasm.trim() === '') {
    return '';
  }
  
  try {
    // Parse QASM to Q.js AST
    const ast = parseQasmToQjsAst(qasm);
    
    // Convert Q.js AST to plaintext
    // Use equal width formatting for QASM sources to preserve timing alignment
    const makeAllMomentsEqualWidth = !ast.timingPreservation; // Use equal width unless we have timing preservation
    let plaintext = qjsAstToText(ast, makeAllMomentsEqualWidth);
    
    // Remove leading newline that qjsAstToText adds
    if (plaintext.startsWith('\n')) {
      plaintext = plaintext.substring(1);
    }
    
    return plaintext;
  } catch (error) {
    // Re-throw with context
    throw new Error(`Failed to convert QASM to plaintext: ${error.message}`);
  }
}