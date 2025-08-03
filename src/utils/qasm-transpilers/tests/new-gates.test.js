import { plaintextToQasm } from '../src/plaintext-to-qasm.js';
import { qasmToPlaintext } from '../src/qasm-to-plaintext.js';
import { parseTextToQjsAst } from '../src/qjs/plaintext-to-qjs-ast.js';
import { qjsAstToQasm } from '../src/qjs/qjs-ast-to-qasm.js';
import { parseQasmToQjsAst } from '../src/qjs/qasm-to-qjs-ast.js';
import { qjsAstToText } from '../src/qjs/qjs-ast-to-plaintext.js';

describe('Y, T, S Gates Support', () => {
  describe('single-qubit Y gate', () => {
    it('converts plaintext Y to QASM', () => {
      expect(plaintextToQasm('Y', false)).toEqual(
        'OPENQASM 2.0;\n' +
        'include "qelib1.inc";\n' +
        'qreg q[1];\n' +
        'y q[0];\n'
      );
    });

    it('converts QASM y to plaintext', () => {
      const qasm = 'OPENQASM 2.0;\n' +
        'include "qelib1.inc";\n' +
        'qreg q[1];\n' +
        'y q[0];\n';
      expect(qasmToPlaintext(qasm)).toEqual('Y');
    });

    it('parses Y gate in plaintext to AST', () => {
      const ast = parseTextToQjsAst('Y');
      expect(ast.operations).toHaveLength(1);
      expect(ast.operations[0].gate.symbol).toBe('Y');
      expect(ast.operations[0].gate.name).toBe('Pauli Y');
    });
  });

  describe('single-qubit T gate', () => {
    it('converts plaintext T to QASM', () => {
      expect(plaintextToQasm('T', false)).toEqual(
        'OPENQASM 2.0;\n' +
        'include "qelib1.inc";\n' +
        'qreg q[1];\n' +
        't q[0];\n'
      );
    });

    it('converts QASM t to plaintext', () => {
      const qasm = 'OPENQASM 2.0;\n' +
        'include "qelib1.inc";\n' +
        'qreg q[1];\n' +
        't q[0];\n';
      expect(qasmToPlaintext(qasm)).toEqual('T');
    });

    it('parses T gate in plaintext to AST', () => {
      const ast = parseTextToQjsAst('T');
      expect(ast.operations).toHaveLength(1);
      expect(ast.operations[0].gate.symbol).toBe('T');
      expect(ast.operations[0].gate.name).toBe('T gate (π/4 phase)');
    });
  });

  describe('single-qubit S gate', () => {
    it('converts plaintext S to QASM', () => {
      expect(plaintextToQasm('S', false)).toEqual(
        'OPENQASM 2.0;\n' +
        'include "qelib1.inc";\n' +
        'qreg q[1];\n' +
        's q[0];\n'
      );
    });

    it('converts QASM s to plaintext', () => {
      const qasm = 'OPENQASM 2.0;\n' +
        'include "qelib1.inc";\n' +
        'qreg q[1];\n' +
        's q[0];\n';
      expect(qasmToPlaintext(qasm)).toEqual('S');
    });

    it('parses S gate in plaintext to AST', () => {
      const ast = parseTextToQjsAst('S');
      expect(ast.operations).toHaveLength(1);
      expect(ast.operations[0].gate.symbol).toBe('S');
      expect(ast.operations[0].gate.name).toBe('S gate (π/2 phase)');
    });
  });

  describe('controlled gates', () => {
    it('converts controlled Y gate', () => {
      expect(plaintextToQasm('Y#1\nI', false)).toEqual(
        'OPENQASM 2.0;\n' +
        'include "qelib1.inc";\n' +
        'qreg q[2];\n' +
        'cy q[1], q[0];\n'
      );
    });

    it('converts controlled T gate', () => {
      expect(plaintextToQasm('I\nT#0', false)).toEqual(
        'OPENQASM 2.0;\n' +
        'include "qelib1.inc";\n' +
        'qreg q[2];\n' +
        'ct q[0], q[1];\n'
      );
    });

    it('converts controlled S gate', () => {
      expect(plaintextToQasm('S#1\nH', false)).toEqual(
        'OPENQASM 2.0;\n' +
        'include "qelib1.inc";\n' +
        'qreg q[2];\n' +
        'cs q[1], q[0];\n' +
        'h q[1];\n'
      );
    });

    it('parses QASM controlled gates back to plaintext', () => {
      const qasm = 'OPENQASM 2.0;\n' +
        'include "qelib1.inc";\n' +
        'qreg q[2];\n' +
        'cy q[0], q[1];\n' +
        'ct q[1], q[0];\n' +
        'cs q[0], q[1];\n';
      expect(qasmToPlaintext(qasm)).toEqual('I-T#1-I\nY#0-I-S#0');
    });
  });

  describe('mixed circuits with new gates', () => {
    it('converts circuit with all new gates', () => {
      const plaintext = 'Y-T-S\nH-X-Z';
      expect(plaintextToQasm(plaintext, false)).toEqual(
        'OPENQASM 2.0;\n' +
        'include "qelib1.inc";\n' +
        'qreg q[2];\n' +
        'y q[0];\n' +
        'h q[1];\n' +
        't q[0];\n' +
        'x q[1];\n' +
        's q[0];\n' +
        'z q[1];\n'
      );
    });

    it('handles complex pattern with new gates', () => {
      const plaintext = 'H-Y-T#1-S\nI-S-I---Y';
      expect(plaintextToQasm(plaintext, false)).toEqual(
        'OPENQASM 2.0;\n' +
        'include "qelib1.inc";\n' +
        'qreg q[2];\n' +
        'h q[0];\n' +
        'y q[0];\n' +
        's q[1];\n' +
        'ct q[1], q[0];\n' +
        's q[0];\n' +
        'y q[1];\n'
      );
    });
  });

  describe('round-trip conversions', () => {
    it('preserves Y gate through round-trip', () => {
      const original = 'Y';
      const qasm = plaintextToQasm(original, false);
      const roundtrip = qasmToPlaintext(qasm);
      expect(roundtrip).toEqual(original);
    });

    it('preserves T gate through round-trip', () => {
      const original = 'T';
      const qasm = plaintextToQasm(original, false);
      const roundtrip = qasmToPlaintext(qasm);
      expect(roundtrip).toEqual(original);
    });

    it('preserves S gate through round-trip', () => {
      const original = 'S';
      const qasm = plaintextToQasm(original, false);
      const roundtrip = qasmToPlaintext(qasm);
      expect(roundtrip).toEqual(original);
    });

    it('preserves complex circuit through round-trip', () => {
      const original = 'Y-T-S\nH-X-Z';
      const qasm = plaintextToQasm(original, false);
      const roundtrip = qasmToPlaintext(qasm);
      expect(roundtrip).toEqual(original);
    });

    it('preserves controlled gates through round-trip', () => {
      const original = 'Y#1-I-S\nI-T#0-I';
      const qasm = plaintextToQasm(original, false);
      const roundtrip = qasmToPlaintext(qasm);
      expect(roundtrip).toEqual(original);
    });
  });

  describe('AST round-trip tests', () => {
    it('Y gate AST round-trip', () => {
      const original = 'Y-I-Y';
      const ast = parseTextToQjsAst(original);
      const text = qjsAstToText(ast);
      expect(text).toEqual('\n' + original);
    });

    it('T gate AST round-trip', () => {
      const original = 'T-T-T';
      const ast = parseTextToQjsAst(original);
      const text = qjsAstToText(ast);
      expect(text).toEqual('\n' + original);
    });

    it('S gate AST round-trip', () => {
      const original = 'S-S-S';
      const ast = parseTextToQjsAst(original);
      const text = qjsAstToText(ast);
      expect(text).toEqual('\n' + original);
    });

    it('mixed gates AST to QASM', () => {
      const ast = parseTextToQjsAst('Y-T-S');
      const qasm = qjsAstToQasm(ast, false);
      expect(qasm).toContain('y q[0];');
      expect(qasm).toContain('t q[0];');
      expect(qasm).toContain('s q[0];');
    });

    it('QASM to AST with new gates', () => {
      const qasm = 'OPENQASM 2.0;\n' +
        'include "qelib1.inc";\n' +
        'qreg q[1];\n' +
        'y q[0];\n' +
        't q[0];\n' +
        's q[0];\n';
      const ast = parseQasmToQjsAst(qasm);
      expect(ast.operations).toHaveLength(3);
      expect(ast.operations[0].gate.symbol).toBe('Y');
      expect(ast.operations[1].gate.symbol).toBe('T');
      expect(ast.operations[2].gate.symbol).toBe('S');
    });
  });

  describe('edge cases', () => {
    it('handles Y at end of line', () => {
      const plaintext = 'H---Y';
      expect(plaintextToQasm(plaintext, false)).toContain('y q[0];');
    });

    it('handles T at beginning of line', () => {
      const plaintext = 'T---H';
      expect(plaintextToQasm(plaintext, false)).toContain('t q[0];');
    });

    it('handles S in middle of sequence', () => {
      const plaintext = 'H-S-X';
      expect(plaintextToQasm(plaintext, false)).toContain('s q[0];');
    });

    it('handles all new gates in parallel', () => {
      const plaintext = 'Y\nT\nS';
      const qasm = plaintextToQasm(plaintext, false);
      expect(qasm).toContain('y q[0];');
      expect(qasm).toContain('t q[1];');
      expect(qasm).toContain('s q[2];');
    });

    it('handles register-wide application of new gates', () => {
      const qasm = 'OPENQASM 2.0;\n' +
        'include "qelib1.inc";\n' +
        'qreg q[3];\n' +
        'y q;\n';
      expect(qasmToPlaintext(qasm)).toEqual('Y\nY\nY');
    });

    it('handles case-insensitive QASM parsing', () => {
      const qasm = 'OPENQASM 2.0;\n' +
        'include "qelib1.inc";\n' +
        'qreg q[1];\n' +
        'Y q[0];\n' +
        'T q[0];\n' +
        'S q[0];\n';
      expect(qasmToPlaintext(qasm)).toEqual('Y-T-S');
    });
  });
});