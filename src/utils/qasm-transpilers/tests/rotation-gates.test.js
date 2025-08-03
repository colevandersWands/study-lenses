import { plaintextToQasm } from '../src/plaintext-to-qasm.js';
import { qasmToPlaintext } from '../src/qasm-to-plaintext.js';
import { parseTextToQjsAst } from '../src/qjs/plaintext-to-qjs-ast.js';
import { qjsAstToQasm } from '../src/qjs/qjs-ast-to-qasm.js';
import { parseQasmToQjsAst } from '../src/qjs/qasm-to-qjs-ast.js';
import { qjsAstToText } from '../src/qjs/qjs-ast-to-plaintext.js';
import { parseAngle, parseRotationGate, formatAngleForQasm } from '../src/qjs/utils.js';

describe('Rotation Gates (RX, RZ) Support', () => {
  describe('angle parsing utilities', () => {
    it('parses pi expressions correctly', () => {
      expect(parseAngle('pi/2')).toBeCloseTo(Math.PI / 2, 10);
      expect(parseAngle('pi/4')).toBeCloseTo(Math.PI / 4, 10);
      expect(parseAngle('pi')).toBeCloseTo(Math.PI, 10);
      expect(parseAngle('2*pi')).toBeCloseTo(2 * Math.PI, 10);
      expect(parseAngle('-pi/2')).toBeCloseTo(-Math.PI / 2, 10);
    });

    it('parses numeric angles correctly', () => {
      expect(parseAngle('1.57')).toBeCloseTo(1.57, 10);
      expect(parseAngle('0.5')).toBeCloseTo(0.5, 10);
      expect(parseAngle('-1.0')).toBeCloseTo(-1.0, 10);
    });

    it('throws error for invalid angles', () => {
      expect(() => parseAngle('invalid')).toThrow('Invalid angle value');
      expect(() => parseAngle('')).toThrow('Invalid angle string');
      expect(() => parseAngle(null)).toThrow('Invalid angle string');
    });

    it('parses rotation gate strings correctly', () => {
      expect(parseRotationGate('RX(pi/2)')).toEqual({
        gate: 'RX',
        angle: Math.PI / 2
      });
      
      expect(parseRotationGate('RZ(1.57)')).toEqual({
        gate: 'RZ', 
        angle: 1.57
      });

      expect(parseRotationGate('H')).toEqual({
        gate: 'H'
      });
    });

    it('formats angles for QASM output', () => {
      expect(formatAngleForQasm(Math.PI / 2)).toBe('pi/2');
      expect(formatAngleForQasm(Math.PI / 4)).toBe('pi/4'); 
      expect(formatAngleForQasm(Math.PI)).toBe('pi');
      expect(formatAngleForQasm(-Math.PI / 2)).toBe('-pi/2');
      expect(formatAngleForQasm(1.57)).toBe('1.57');
    });
  });

  describe('single-qubit RX gate', () => {
    it('converts plaintext RX to QASM', () => {
      expect(plaintextToQasm('RX(pi/2)', false)).toEqual(
        'OPENQASM 2.0;\n' +
        'include "qelib1.inc";\n' +
        'qreg q[1];\n' +
        'rx(pi/2) q[0];\n'
      );
    });

    it('converts QASM rx to plaintext', () => {
      const qasm = 'OPENQASM 2.0;\n' +
        'include "qelib1.inc";\n' +
        'qreg q[1];\n' +
        'rx(pi/2) q[0];\n';
      expect(qasmToPlaintext(qasm)).toEqual('RX(pi/2)');
    });

    it('parses RX gate in plaintext to AST', () => {
      const ast = parseTextToQjsAst('RX(pi/2)');
      expect(ast.operations).toHaveLength(1);
      expect(ast.operations[0].gate.symbol).toBe('RX');
      expect(ast.operations[0].gate.name).toBe('X-axis rotation');
      expect(ast.operations[0].angle).toBeCloseTo(Math.PI / 2, 10);
    });
  });

  describe('single-qubit RZ gate', () => {
    it('converts plaintext RZ to QASM', () => {
      expect(plaintextToQasm('RZ(pi/4)', false)).toEqual(
        'OPENQASM 2.0;\n' +
        'include "qelib1.inc";\n' +
        'qreg q[1];\n' +
        'rz(pi/4) q[0];\n'
      );
    });

    it('converts QASM rz to plaintext', () => {
      const qasm = 'OPENQASM 2.0;\n' +
        'include "qelib1.inc";\n' +
        'qreg q[1];\n' +
        'rz(pi/4) q[0];\n';
      expect(qasmToPlaintext(qasm)).toEqual('RZ(pi/4)');
    });

    it('parses RZ gate in plaintext to AST', () => {
      const ast = parseTextToQjsAst('RZ(pi/4)');
      expect(ast.operations).toHaveLength(1);
      expect(ast.operations[0].gate.symbol).toBe('RZ');
      expect(ast.operations[0].gate.name).toBe('Z-axis rotation');
      expect(ast.operations[0].angle).toBeCloseTo(Math.PI / 4, 10);
    });
  });

  describe('mixed circuits with rotation gates', () => {
    it('converts circuit with rotation and standard gates', () => {
      const plaintext = 'H-RX(pi/2)\nRZ(pi/4)-X';
      expect(plaintextToQasm(plaintext, false)).toEqual(
        'OPENQASM 2.0;\n' +
        'include "qelib1.inc";\n' +
        'qreg q[2];\n' +
        'h q[0];\n' +
        'rz(pi/4) q[1];\n' +
        'rx(pi/2) q[0];\n' +
        'x q[1];\n'
      );
    });

    it('handles numeric angle values', () => {
      const plaintext = 'RX(1.57)-RZ(0.785)';
      expect(plaintextToQasm(plaintext, false)).toEqual(
        'OPENQASM 2.0;\n' +
        'include "qelib1.inc";\n' +
        'qreg q[1];\n' +
        'rx(1.57) q[0];\n' +
        'rz(0.785) q[0];\n'
      );
    });
  });

  describe('round-trip conversions', () => {
    it('preserves RX gate through round-trip', () => {
      const original = 'RX(pi/2)';
      const qasm = plaintextToQasm(original, false);
      const roundtrip = qasmToPlaintext(qasm);
      expect(roundtrip).toEqual(original);
    });

    it('preserves RZ gate through round-trip', () => {
      const original = 'RZ(pi/4)';
      const qasm = plaintextToQasm(original, false);
      const roundtrip = qasmToPlaintext(qasm);
      expect(roundtrip).toEqual(original);
    });

    it('preserves complex circuit with rotation gates', () => {
      const original = 'H-RX(pi/2)\nRZ(pi/4)-X';
      const qasm = plaintextToQasm(original, false);
      const roundtrip = qasmToPlaintext(qasm);
      expect(roundtrip).toEqual(original);
    });

    it('preserves numeric angles through round-trip', () => {
      const original = 'RX(1.57)';
      const qasm = plaintextToQasm(original, false);
      const roundtrip = qasmToPlaintext(qasm);
      expect(roundtrip).toEqual(original);
    });
  });

  describe('AST round-trip tests', () => {
    it('RX gate AST round-trip', () => {
      const original = 'RX(pi/2)-I-RX(pi/4)';
      const ast = parseTextToQjsAst(original);
      const text = qjsAstToText(ast);
      expect(text).toEqual('\n' + original);
    });

    it('RZ gate AST round-trip', () => {
      const original = 'RZ(1.57)-RZ(pi/2)';
      const ast = parseTextToQjsAst(original);
      const text = qjsAstToText(ast);
      expect(text).toEqual('\n' + original);
    });

    it('mixed rotation gates AST to QASM', () => {
      const ast = parseTextToQjsAst('RX(pi/2)-RZ(pi/4)');
      const qasm = qjsAstToQasm(ast, false);
      expect(qasm).toContain('rx(pi/2) q[0];');
      expect(qasm).toContain('rz(pi/4) q[0];');
    });

    it('QASM to AST with rotation gates', () => {
      const qasm = 'OPENQASM 2.0;\n' +
        'include "qelib1.inc";\n' +
        'qreg q[1];\n' +
        'rx(pi/2) q[0];\n' +
        'rz(pi/4) q[0];\n';
      const ast = parseQasmToQjsAst(qasm);
      expect(ast.operations).toHaveLength(2);
      expect(ast.operations[0].gate.symbol).toBe('RX');
      expect(ast.operations[0].angle).toBeCloseTo(Math.PI / 2, 10);
      expect(ast.operations[1].gate.symbol).toBe('RZ');
      expect(ast.operations[1].angle).toBeCloseTo(Math.PI / 4, 10);
    });
  });

  describe('edge cases and error handling', () => {
    it('handles rotation gates at end of line', () => {
      const plaintext = 'H---RX(pi/2)';
      expect(plaintextToQasm(plaintext, false)).toContain('rx(pi/2) q[0];');
    });

    it('handles rotation gates at beginning of line', () => {
      const plaintext = 'RZ(pi/4)---H';
      expect(plaintextToQasm(plaintext, false)).toContain('rz(pi/4) q[0];');
    });

    it('handles rotation gates in middle of sequence', () => {
      const plaintext = 'H-RX(pi/2)-X';
      expect(plaintextToQasm(plaintext, false)).toContain('rx(pi/2) q[0];');
    });

    it('handles rotation gates in parallel', () => {
      const plaintext = 'RX(pi/2)\nRZ(pi/4)\nH';
      const qasm = plaintextToQasm(plaintext, false);
      expect(qasm).toContain('rx(pi/2) q[0];');
      expect(qasm).toContain('rz(pi/4) q[1];');
      expect(qasm).toContain('h q[2];');
    });

    it('handles register-wide rotation gates', () => {
      const qasm = 'OPENQASM 2.0;\n' +
        'include "qelib1.inc";\n' +
        'qreg q[3];\n' +
        'rx(pi/2) q;\n';
      expect(qasmToPlaintext(qasm)).toEqual('RX(pi/2)\nRX(pi/2)\nRX(pi/2)');
    });

    it('throws error for invalid rotation syntax', () => {
      expect(() => plaintextToQasm('RX()', false)).toThrow();
      expect(() => plaintextToQasm('RX(invalid)', false)).toThrow();
      expect(() => plaintextToQasm('RX', false)).toThrow();
    });

    it('handles case-insensitive QASM parsing', () => {
      const qasm = 'OPENQASM 2.0;\n' +
        'include "qelib1.inc";\n' +
        'qreg q[1];\n' +
        'RX(pi/2) q[0];\n' +
        'RZ(pi/4) q[0];\n';
      expect(qasmToPlaintext(qasm)).toEqual('RX(pi/2)-RZ(pi/4)');
    });
  });
});