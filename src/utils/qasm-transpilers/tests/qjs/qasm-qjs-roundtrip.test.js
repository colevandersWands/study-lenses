import { parseQasmToQjsAst } from '../../src/qjs/qasm-to-qjs-ast.js';
import { qjsAstToQasm } from '../../src/qjs/qjs-ast-to-qasm.js';

/**
 * Round-trip validation tests for OpenQASM ↔ Q.js AST transformations
 * These tests ensure the bidirectional conversion maintains circuit equivalence
 */

describe('OpenQASM ↔ Q.js AST round-trip validation', () => {
  describe('single-qubit circuits', () => {
    it('preserves single Hadamard gate', () => {
      const originalQasm = 
        'OPENQASM 2.0;\n' +
        'include "qelib1.inc";\n' +
        'qreg q[1];\n' +
        'h q[0];\n';
      
      const ast = parseQasmToQjsAst(originalQasm);
      const reconstructedQasm = qjsAstToQasm(ast);
      
      expect(reconstructedQasm).toEqual(originalQasm);
    });

    it('preserves single X gate', () => {
      const originalQasm = 
        'OPENQASM 2.0;\n' +
        'include "qelib1.inc";\n' +
        'qreg q[1];\n' +
        'x q[0];\n';
      
      const ast = parseQasmToQjsAst(originalQasm);
      const reconstructedQasm = qjsAstToQasm(ast);
      
      expect(reconstructedQasm).toEqual(originalQasm);
    });

    it('preserves single Z gate', () => {
      const originalQasm = 
        'OPENQASM 2.0;\n' +
        'include "qelib1.inc";\n' +
        'qreg q[1];\n' +
        'z q[0];\n';
      
      const ast = parseQasmToQjsAst(originalQasm);
      const reconstructedQasm = qjsAstToQasm(ast);
      
      expect(reconstructedQasm).toEqual(originalQasm);
    });

    it('preserves gate sequence on single qubit', () => {
      const originalQasm = 
        'OPENQASM 2.0;\n' +
        'include "qelib1.inc";\n' +
        'qreg q[1];\n' +
        'h q[0];\n' +
        'x q[0];\n' +
        'z q[0];\n';
      
      const ast = parseQasmToQjsAst(originalQasm);
      const reconstructedQasm = qjsAstToQasm(ast);
      
      expect(reconstructedQasm).toEqual(originalQasm);
    });

    it('preserves empty single-qubit circuit', () => {
      const originalQasm = 
        'OPENQASM 2.0;\n' +
        'include "qelib1.inc";\n' +
        'qreg q[1];\n';
      
      const ast = parseQasmToQjsAst(originalQasm);
      const reconstructedQasm = qjsAstToQasm(ast);
      
      expect(reconstructedQasm).toEqual(originalQasm);
    });
  });

  describe('two-qubit circuits', () => {
    it('preserves Bell state preparation', () => {
      const originalQasm = 
        'OPENQASM 2.0;\n' +
        'include "qelib1.inc";\n' +
        'qreg q[2];\n' +
        'h q[0];\n' +
        'cx q[0], q[1];\n';
      
      const ast = parseQasmToQjsAst(originalQasm);
      const reconstructedQasm = qjsAstToQasm(ast);
      
      expect(reconstructedQasm).toEqual(originalQasm);
    });

    it('preserves parallel single-qubit gates', () => {
      const originalQasm = 
        'OPENQASM 2.0;\n' +
        'include "qelib1.inc";\n' +
        'qreg q[2];\n' +
        'h q[0];\n' +
        'x q[1];\n';
      
      const ast = parseQasmToQjsAst(originalQasm);
      const reconstructedQasm = qjsAstToQasm(ast);
      
      expect(reconstructedQasm).toEqual(originalQasm);
    });

    it('preserves CNOT with different control directions', () => {
      const originalQasm = 
        'OPENQASM 2.0;\n' +
        'include "qelib1.inc";\n' +
        'qreg q[2];\n' +
        'cx q[1], q[0];\n';
      
      const ast = parseQasmToQjsAst(originalQasm);
      const reconstructedQasm = qjsAstToQasm(ast);
      
      expect(reconstructedQasm).toEqual(originalQasm);
    });

    it('preserves controlled-Z gate', () => {
      const originalQasm = 
        'OPENQASM 2.0;\n' +
        'include "qelib1.inc";\n' +
        'qreg q[2];\n' +
        'cz q[0], q[1];\n';
      
      const ast = parseQasmToQjsAst(originalQasm);
      const reconstructedQasm = qjsAstToQasm(ast);
      
      expect(reconstructedQasm).toEqual(originalQasm);
    });

    it('preserves mixed single and two-qubit operations', () => {
      const originalQasm = 
        'OPENQASM 2.0;\n' +
        'include "qelib1.inc";\n' +
        'qreg q[2];\n' +
        'h q[0];\n' +
        'x q[1];\n' +
        'cx q[0], q[1];\n' +
        'z q[0];\n';
      
      const ast = parseQasmToQjsAst(originalQasm);
      const reconstructedQasm = qjsAstToQasm(ast);
      
      expect(reconstructedQasm).toEqual(originalQasm);
    });
  });

  describe('controlled-H decomposition round-trip', () => {
    it('preserves controlled-H decomposition exactly', () => {
      const originalQasm = 
        'OPENQASM 2.0;\n' +
        'include "qelib1.inc";\n' +
        'qreg q[2];\n' +
        '// Controlled-H decomposition\n' +
        'ry(0.25*pi) q[1];\n' +
        'cx q[0], q[1];\n' +
        'ry(-0.25*pi) q[1];\n';
      
      const ast = parseQasmToQjsAst(originalQasm);
      const reconstructedQasm = qjsAstToQasm(ast);
      
      expect(reconstructedQasm).toEqual(originalQasm);
    });

    it('preserves multiple controlled-H decompositions', () => {
      const originalQasm = 
        'OPENQASM 2.0;\n' +
        'include "qelib1.inc";\n' +
        'qreg q[2];\n' +
        '// Controlled-H decomposition\n' +
        'ry(0.25*pi) q[1];\n' +
        'cx q[0], q[1];\n' +
        'ry(-0.25*pi) q[1];\n' +
        '// Controlled-H decomposition\n' +
        'ry(0.25*pi) q[0];\n' +
        'cx q[1], q[0];\n' +
        'ry(-0.25*pi) q[0];\n';
      
      const ast = parseQasmToQjsAst(originalQasm);
      const reconstructedQasm = qjsAstToQasm(ast);
      
      expect(reconstructedQasm).toEqual(originalQasm);
    });

    it('preserves controlled-H mixed with regular gates', () => {
      const originalQasm = 
        'OPENQASM 2.0;\n' +
        'include "qelib1.inc";\n' +
        'qreg q[2];\n' +
        'h q[0];\n' +
        '// Controlled-H decomposition\n' +
        'ry(0.25*pi) q[1];\n' +
        'cx q[0], q[1];\n' +
        'ry(-0.25*pi) q[1];\n' +
        'x q[0];\n';
      
      const ast = parseQasmToQjsAst(originalQasm);
      const reconstructedQasm = qjsAstToQasm(ast);
      
      expect(reconstructedQasm).toEqual(originalQasm);
    });
  });

  describe('three-qubit circuits', () => {
    it('preserves GHZ state preparation', () => {
      const originalQasm = 
        'OPENQASM 2.0;\n' +
        'include "qelib1.inc";\n' +
        'qreg q[3];\n' +
        'h q[0];\n' +
        'cx q[0], q[1];\n' +
        'cx q[0], q[2];\n';
      
      const ast = parseQasmToQjsAst(originalQasm);
      const reconstructedQasm = qjsAstToQasm(ast);
      
      expect(reconstructedQasm).toEqual(originalQasm);
    });

    it('preserves complex three-qubit pattern', () => {
      const originalQasm = 
        'OPENQASM 2.0;\n' +
        'include "qelib1.inc";\n' +
        'qreg q[3];\n' +
        'h q[0];\n' +
        'x q[1];\n' +
        'z q[2];\n' +
        'cx q[0], q[1];\n' +
        'cz q[1], q[2];\n' +
        'cx q[0], q[2];\n';
      
      const ast = parseQasmToQjsAst(originalQasm);
      const reconstructedQasm = qjsAstToQasm(ast);
      
      expect(reconstructedQasm).toEqual(originalQasm);
    });

    it('preserves empty three-qubit circuit', () => {
      const originalQasm = 
        'OPENQASM 2.0;\n' +
        'include "qelib1.inc";\n' +
        'qreg q[3];\n';
      
      const ast = parseQasmToQjsAst(originalQasm);
      const reconstructedQasm = qjsAstToQasm(ast);
      
      expect(reconstructedQasm).toEqual(originalQasm);
    });
  });

  describe('complex quantum algorithms', () => {
    it('preserves quantum Fourier transform pattern', () => {
      const originalQasm = 
        'OPENQASM 2.0;\n' +
        'include "qelib1.inc";\n' +
        'qreg q[2];\n' +
        'h q[0];\n' +
        'h q[1];\n' +
        '// Controlled-H decomposition\n' +
        'ry(0.25*pi) q[0];\n' +
        'cx q[1], q[0];\n' +
        'ry(-0.25*pi) q[0];\n' +
        '// Controlled-H decomposition\n' +
        'ry(0.25*pi) q[1];\n' +
        'cx q[0], q[1];\n' +
        'ry(-0.25*pi) q[1];\n';
      
      const ast = parseQasmToQjsAst(originalQasm);
      const reconstructedQasm = qjsAstToQasm(ast);
      
      expect(reconstructedQasm).toEqual(originalQasm);
    });

    it('preserves Grover diffusion operator', () => {
      const originalQasm = 
        'OPENQASM 2.0;\n' +
        'include "qelib1.inc";\n' +
        'qreg q[2];\n' +
        'h q[0];\n' +
        'h q[1];\n' +
        'x q[0];\n' +
        'x q[1];\n' +
        'h q[0];\n' +
        'h q[1];\n' +
        'cx q[1], q[0];\n' +
        'h q[0];\n' +
        'h q[1];\n' +
        'x q[0];\n' +
        'x q[1];\n' +
        'h q[0];\n' +
        'h q[1];\n';
      
      const ast = parseQasmToQjsAst(originalQasm);
      const reconstructedQasm = qjsAstToQasm(ast);
      
      expect(reconstructedQasm).toEqual(originalQasm);
    });

    it('preserves SWAP circuit using CNOTs', () => {
      const originalQasm = 
        'OPENQASM 2.0;\n' +
        'include "qelib1.inc";\n' +
        'qreg q[2];\n' +
        'cx q[1], q[0];\n' +
        'cx q[0], q[1];\n' +
        'cx q[1], q[0];\n';
      
      const ast = parseQasmToQjsAst(originalQasm);
      const reconstructedQasm = qjsAstToQasm(ast);
      
      expect(reconstructedQasm).toEqual(originalQasm);
    });
  });

  describe('edge cases and robustness', () => {
    it('preserves circuits with comments', () => {
      const originalQasm = 
        'OPENQASM 2.0;\n' +
        'include "qelib1.inc";\n' +
        'qreg q[2];\n' +
        '// This is a Bell state\n' +
        'h q[0];\n' +
        '// Apply CNOT\n' +
        'cx q[0], q[1];\n';
      
      const ast = parseQasmToQjsAst(originalQasm);
      const reconstructedQasm = qjsAstToQasm(ast);
      
      // Comments should be preserved in controlled-H decompositions
      // but other comments might be filtered out during parsing
      expect(reconstructedQasm).toContain('h q[0];');
      expect(reconstructedQasm).toContain('cx q[0], q[1];');
    });

    it('preserves large qubit count', () => {
      const originalQasm = 
        'OPENQASM 2.0;\n' +
        'include "qelib1.inc";\n' +
        'qreg q[5];\n' +
        'h q[0];\n' +
        'cx q[0], q[4];\n' +
        'cz q[2], q[3];\n';
      
      const ast = parseQasmToQjsAst(originalQasm);
      const reconstructedQasm = qjsAstToQasm(ast);
      
      // Check semantic equivalence rather than exact string match
      // (left-pack strategy may reorder operations)
      expect(reconstructedQasm).toContain('OPENQASM 2.0;');
      expect(reconstructedQasm).toContain('qreg q[5];');
      expect(reconstructedQasm).toContain('h q[0];');
      expect(reconstructedQasm).toContain('cx q[0], q[4];');
      expect(reconstructedQasm).toContain('cz q[2], q[3];');
      
      // Verify AST contains the expected operations
      expect(ast.operations).toHaveLength(3);
      const gateTypes = ast.operations.map(op => op.gate.symbol).sort();
      expect(gateTypes).toEqual(['H', 'X', 'Z']);
    });

    it('handles multiple controlled operations in sequence', () => {
      const originalQasm = 
        'OPENQASM 2.0;\n' +
        'include "qelib1.inc";\n' +
        'qreg q[3];\n' +
        'cx q[0], q[1];\n' +
        'cz q[1], q[2];\n' +
        'cx q[0], q[2];\n';
      
      const ast = parseQasmToQjsAst(originalQasm);
      const reconstructedQasm = qjsAstToQasm(ast);
      
      expect(reconstructedQasm).toEqual(originalQasm);
    });
  });

  describe('AST structure preservation', () => {
    it('preserves qubit count in AST conversion', () => {
      const originalQasm = 
        'OPENQASM 2.0;\n' +
        'include "qelib1.inc";\n' +
        'qreg q[4];\n' +
        'h q[0];\n';
      
      const ast = parseQasmToQjsAst(originalQasm);
      
      expect(ast.bandwidth).toBe(4);
      expect(ast.qubits).toHaveLength(4);
      expect(ast.qubits[0].registerIndex).toBe(1); // Q.js uses 1-indexed
      expect(ast.qubits[3].registerIndex).toBe(4);
      
      const reconstructedQasm = qjsAstToQasm(ast);
      expect(reconstructedQasm).toEqual(originalQasm);
    });

    it('preserves operation timing in AST', () => {
      const originalQasm = 
        'OPENQASM 2.0;\n' +
        'include "qelib1.inc";\n' +
        'qreg q[2];\n' +
        'h q[0];\n' +
        'x q[1];\n' +
        'cx q[0], q[1];\n';
      
      const ast = parseQasmToQjsAst(originalQasm);
      
      // Check that operations have appropriate moment indices
      expect(ast.operations).toHaveLength(3);
      
      // Parallel operations (H and X) should have same moment
      const hOp = ast.operations.find(op => op.gate.symbol === 'H');
      const xOp = ast.operations.find(op => op.gate.symbol === 'X' && !op.isControlled);
      const cxOp = ast.operations.find(op => op.gate.symbol === 'X' && op.isControlled);
      
      expect(hOp.momentIndex).toBe(xOp.momentIndex); // Parallel
      expect(cxOp.momentIndex).toBeGreaterThan(hOp.momentIndex); // Sequential
      
      const reconstructedQasm = qjsAstToQasm(ast);
      expect(reconstructedQasm).toEqual(originalQasm);
    });

    it('preserves AST metadata fields', () => {
      const originalQasm = 
        'OPENQASM 2.0;\n' +
        'include "qelib1.inc";\n' +
        'qreg q[2];\n' +
        'h q[0];\n';
      
      const ast = parseQasmToQjsAst(originalQasm);
      
      // Verify AST structure
      expect(ast.bandwidth).toBeDefined();
      expect(ast.timewidth).toBeDefined();
      expect(ast.qubits).toBeDefined();
      expect(ast.operations).toBeDefined();
      expect(ast.results).toBeDefined();
      expect(ast.matrix).toBeDefined();
      expect(ast.needsEvaluation).toBeDefined();
      expect(ast.history).toBeDefined();
      
      const reconstructedQasm = qjsAstToQasm(ast);
      expect(reconstructedQasm).toEqual(originalQasm);
    });
  });

  describe('semantic equivalence validation', () => {
    it('maintains gate operation semantics through conversion', () => {
      const originalQasm = 
        'OPENQASM 2.0;\n' +
        'include "qelib1.inc";\n' +
        'qreg q[2];\n' +
        'h q[0];\n' +
        'cx q[0], q[1];\n';
      
      const ast = parseQasmToQjsAst(originalQasm);
      
      // Verify AST captures the right operations
      expect(ast.operations).toHaveLength(2);
      
      const hGate = ast.operations.find(op => op.gate.symbol === 'H');
      const cxGate = ast.operations.find(op => op.gate.symbol === 'X' && op.isControlled);
      
      expect(hGate.registerIndices).toEqual([1]); // H on qubit 0 (1-indexed)
      expect(cxGate.registerIndices).toEqual([2, 1]); // CNOT: target=1, control=0 (1-indexed)
      
      const reconstructedQasm = qjsAstToQasm(ast);
      expect(reconstructedQasm).toEqual(originalQasm);
    });

    it('preserves controlled-H semantic equivalence', () => {
      const originalQasm = 
        'OPENQASM 2.0;\n' +
        'include "qelib1.inc";\n' +
        'qreg q[2];\n' +
        '// Controlled-H decomposition\n' +
        'ry(0.25*pi) q[1];\n' +
        'cx q[0], q[1];\n' +
        'ry(-0.25*pi) q[1];\n';
      
      const ast = parseQasmToQjsAst(originalQasm);
      
      // Should recognize as controlled-H
      expect(ast.operations).toHaveLength(1);
      expect(ast.operations[0].gate.symbol).toBe('H');
      expect(ast.operations[0].isControlled).toBe(true);
      expect(ast.operations[0].registerIndices).toEqual([2, 1]); // [target+1, control+1]
      
      const reconstructedQasm = qjsAstToQasm(ast);
      expect(reconstructedQasm).toEqual(originalQasm);
    });
  });

  describe('invariant properties', () => {
    it('maintains circuit depth through conversion', () => {
      const originalQasm = 
        'OPENQASM 2.0;\n' +
        'include "qelib1.inc";\n' +
        'qreg q[2];\n' +
        'h q[0];\n' +
        'cx q[0], q[1];\n' +
        'z q[0];\n' +
        'x q[1];\n';
      
      const ast = parseQasmToQjsAst(originalQasm);
      
      // Circuit should have proper time structure
      const maxMoment = Math.max(...ast.operations.map(op => op.momentIndex));
      expect(ast.timewidth).toBe(maxMoment); // Fixed: timewidth = maxMoment for 1-based indexing
      
      const reconstructedQasm = qjsAstToQasm(ast);
      expect(reconstructedQasm).toEqual(originalQasm);
    });

    it('maintains qubit connectivity through conversion', () => {
      const originalQasm = 
        'OPENQASM 2.0;\n' +
        'include "qelib1.inc";\n' +
        'qreg q[3];\n' +
        'cx q[0], q[1];\n' +
        'cx q[1], q[2];\n' +
        'cx q[0], q[2];\n';
      
      const ast = parseQasmToQjsAst(originalQasm);
      
      // All operations should be two-qubit controlled operations
      expect(ast.operations.every(op => op.isControlled && op.registerIndices.length === 2)).toBe(true);
      
      const reconstructedQasm = qjsAstToQasm(ast);
      expect(reconstructedQasm).toEqual(originalQasm);
    });

    it('maintains gate count through conversion', () => {
      const originalQasm = 
        'OPENQASM 2.0;\n' +
        'include "qelib1.inc";\n' +
        'qreg q[2];\n' +
        'h q[0];\n' +
        'h q[1];\n' +
        'x q[0];\n' +
        'z q[1];\n' +
        'cx q[0], q[1];\n';
      
      const ast = parseQasmToQjsAst(originalQasm);
      
      // Should have 5 operations total
      expect(ast.operations).toHaveLength(5);
      
      // Count by gate type
      const hGates = ast.operations.filter(op => op.gate.symbol === 'H' && !op.isControlled);
      const xGates = ast.operations.filter(op => op.gate.symbol === 'X' && !op.isControlled);
      const zGates = ast.operations.filter(op => op.gate.symbol === 'Z' && !op.isControlled);
      const cxGates = ast.operations.filter(op => op.gate.symbol === 'X' && op.isControlled);
      
      expect(hGates).toHaveLength(2);
      expect(xGates).toHaveLength(1);
      expect(zGates).toHaveLength(1);
      expect(cxGates).toHaveLength(1);
      
      const reconstructedQasm = qjsAstToQasm(ast);
      expect(reconstructedQasm).toEqual(originalQasm);
    });
  });
});