/**
 * Test measurements and classical registers functionality
 */

import { parseQasmToQjsAst } from '../src/qjs/qasm-to-qjs-ast.js';
import { qjsAstToQasm } from '../src/qjs/qjs-ast-to-qasm.js';
import { parseQasmGateLine } from '../src/qjs/gates.js';

describe('Measurement Operations', () => {
  describe('parseQasmGateLine', () => {
    it('parses measurement operations correctly', () => {
      const result = parseQasmGateLine('measure q[0] -> c[0]');
      expect(result).toEqual({
        gateType: 'measure',
        qubits: [0],
        classicalBit: 0,
        isMeasurement: true
      });
    });

    it('parses measurement with different indices', () => {
      const result = parseQasmGateLine('measure q[2] -> c[1]');
      expect(result).toEqual({
        gateType: 'measure',
        qubits: [2],
        classicalBit: 1,
        isMeasurement: true
      });
    });

    it('handles measurement with semicolon', () => {
      const result = parseQasmGateLine('measure q[1] -> c[1];');
      expect(result).toEqual({
        gateType: 'measure',
        qubits: [1],
        classicalBit: 1,
        isMeasurement: true
      });
    });
  });

  describe('QASM parsing with classical registers', () => {
    it('parses QASM with classical register and measurement', () => {
      const qasm = `OPENQASM 2.0;
include "qelib1.inc";
qreg q[2];
creg c[2];
h q[0];
measure q[0] -> c[0];
measure q[1] -> c[1];`;

      const result = parseQasmToQjsAst(qasm);
      
      expect(result.bandwidth).toBe(2);
      expect(result.classicalBits).toBe(2);
      expect(result.classicalRegister).toEqual([0, 0]);
      expect(result.operations).toHaveLength(3); // H + 2 measurements
      
      // Check H gate
      const hGate = result.operations.find(op => op.gate.symbol === 'H');
      expect(hGate).toBeDefined();
      expect(hGate.registerIndices).toEqual([1]); // 1-indexed
      
      // Check measurements
      const measurements = result.operations.filter(op => op.isMeasurement);
      expect(measurements).toHaveLength(2);
      
      expect(measurements[0].gate.symbol).toBe('M');
      expect(measurements[0].registerIndices).toEqual([1]); // q[0] -> 1-indexed
      expect(measurements[0].classicalBit).toBe(0); // c[0]
      expect(measurements[0].isMeasurement).toBe(true);
      
      expect(measurements[1].gate.symbol).toBe('M');
      expect(measurements[1].registerIndices).toEqual([2]); // q[1] -> 1-indexed
      expect(measurements[1].classicalBit).toBe(1); // c[1]
      expect(measurements[1].isMeasurement).toBe(true);
    });

    it('rejects measurement without classical register', () => {
      const qasm = `OPENQASM 2.0;
include "qelib1.inc";
qreg q[1];
measure q[0] -> c[0];`;

      expect(() => parseQasmToQjsAst(qasm)).toThrow('Invalid classical bit index: 0 (circuit has 0 classical bits)');
    });

    it('rejects measurement with invalid classical bit', () => {
      const qasm = `OPENQASM 2.0;
include "qelib1.inc";
qreg q[2];
creg c[1];
measure q[0] -> c[1];`; // c[1] doesn't exist in creg c[1]

      expect(() => parseQasmToQjsAst(qasm)).toThrow('Invalid classical bit index: 1 (circuit has 1 classical bits)');
    });
  });

  describe('AST to QASM conversion with measurements', () => {
    it('generates QASM with classical register and measurements', () => {
      const qasm = `OPENQASM 2.0;
include "qelib1.inc";
qreg q[2];
creg c[2];
h q[0];
measure q[0] -> c[0];
measure q[1] -> c[1];`;

      const ast = parseQasmToQjsAst(qasm);
      const regeneratedQasm = qjsAstToQasm(ast);
      
      expect(regeneratedQasm).toContain('OPENQASM 2.0;');
      expect(regeneratedQasm).toContain('include "qelib1.inc";');
      expect(regeneratedQasm).toContain('qreg q[2];');
      expect(regeneratedQasm).toContain('creg c[2];');
      expect(regeneratedQasm).toContain('h q[0];');
      expect(regeneratedQasm).toContain('measure q[0] -> c[0];');
      expect(regeneratedQasm).toContain('measure q[1] -> c[1];');
    });

    it('omits classical register when no measurements present', () => {
      const qasm = `OPENQASM 2.0;
include "qelib1.inc";
qreg q[1];
h q[0];`;

      const ast = parseQasmToQjsAst(qasm);
      const regeneratedQasm = qjsAstToQasm(ast);
      
      expect(regeneratedQasm).not.toContain('creg');
      expect(regeneratedQasm).not.toContain('measure');
    });
  });

  describe('Bell state with measurement', () => {
    it('handles complete Bell state preparation and measurement', () => {
      const qasm = `OPENQASM 2.0;
include "qelib1.inc";
qreg q[2];
creg c[2];
h q[0];
cx q[0], q[1];
measure q[0] -> c[0];
measure q[1] -> c[1];`;

      const ast = parseQasmToQjsAst(qasm);
      
      expect(ast.bandwidth).toBe(2);
      expect(ast.classicalBits).toBe(2);
      expect(ast.operations).toHaveLength(4); // H, CX, 2 measurements
      
      // Verify round-trip
      const regeneratedQasm = qjsAstToQasm(ast);
      expect(regeneratedQasm).toContain('h q[0];');
      expect(regeneratedQasm).toContain('cx q[0], q[1];');
      expect(regeneratedQasm).toContain('measure q[0] -> c[0];');
      expect(regeneratedQasm).toContain('measure q[1] -> c[1];');
    });
  });

  describe('Error cases', () => {
    it('rejects multiple classical registers', () => {
      const qasm = `OPENQASM 2.0;
include "qelib1.inc";
qreg q[1];
creg c[1];
creg d[1];`;

      expect(() => parseQasmToQjsAst(qasm)).toThrow('Multiple classical registers not supported');
    });

    it('rejects malformed creg declaration', () => {
      const qasm = `OPENQASM 2.0;
include "qelib1.inc";
qreg q[1];
creg c;`;

      expect(() => parseQasmToQjsAst(qasm)).toThrow('Malformed creg declaration: creg c;');
    });

    it('rejects invalid creg size', () => {
      const qasm = `OPENQASM 2.0;
include "qelib1.inc";
qreg q[1];
creg c[0];`;

      expect(() => parseQasmToQjsAst(qasm)).toThrow('Invalid creg size: 0');
    });
  });
});