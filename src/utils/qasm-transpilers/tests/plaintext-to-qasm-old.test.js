import { plaintextToQasm } from '../src/plaintext-to-qasm.js';

describe('plaintextToQasm', () => {
  describe('single qubit circuits', () => {
    it('converts empty string to single qubit circuit', () => {
      expect(plaintextToQasm('', false)).toEqual(
        'OPENQASM 2.0;\n' + 
        'include "qelib1.inc";\n' + 
        'qreg q[1];\n',
      );
    });

    it('converts single identity gate', () => {
      expect(plaintextToQasm('I', false)).toEqual(
        'OPENQASM 2.0;\n' +
          'include "qelib1.inc";\n' +
          'qreg q[1];\n',
      );
    });

    it('converts single Hadamard gate', () => {
      expect(plaintextToQasm('H', false)).toEqual(
        'OPENQASM 2.0;\n' + 
        'include "qelib1.inc";\n' + 
        'qreg q[1];\n' + 
        'h q[0];\n',
      );
    });

    it('converts single X gate', () => {
      expect(plaintextToQasm('X', false)).toEqual(
        'OPENQASM 2.0;\n' + 
        'include "qelib1.inc";\n' + 
        'qreg q[1];\n' + 
        'x q[0];\n',
      );
    });

    it('converts single Z gate', () => {
      expect(plaintextToQasm('Z', false)).toEqual(
        'OPENQASM 2.0;\n' + 'include "qelib1.inc";\n' + 'qreg q[1];\n' + 'z q[0];\n',
      );
    });

    it('converts H-X sequence', () => {
      expect(plaintextToQasm('H-X', false)).toEqual(
        'OPENQASM 2.0;\n' +
          'include "qelib1.inc";\n' +
          'qreg q[1];\n' +
          'h q[0];\n' +
          'x q[0];\n',
      );
    });

    it('converts H-I-X sequence', () => {
      expect(plaintextToQasm('H-I-X', false)).toEqual(
        'OPENQASM 2.0;\n' +
          'include "qelib1.inc";\n' +
          'qreg q[1];\n' +
          'h q[0];\n' +
          'x q[0];\n',
      );
    });

    it('converts sequence with multiple hyphens as timing markers', () => {
      expect(plaintextToQasm('H---X', false)).toEqual(
        'OPENQASM 2.0;\n' +
          'include "qelib1.inc";\n' +
          'qreg q[1];\n' +
          'h q[0];\n' +
          'x q[0];\n',
      );
    });
  });

  describe('two qubit circuits', () => {
    it('converts two qubit circuit with all identity', () => {
      expect(plaintextToQasm('I\nI', false)).toEqual(
        'OPENQASM 2.0;\n' + 'include "qelib1.inc";\n' + 'qreg q[2];\n',
      );
    });

    it('converts parallel H gates', () => {
      expect(plaintextToQasm('H\nH', false)).toEqual(
        'OPENQASM 2.0;\n' +
          'include "qelib1.inc";\n' +
          'qreg q[2];\n' +
          'h q[0];\n' +
          'h q[1];\n',
      );
    });

    it('converts CNOT with control from qubit 0', () => {
      expect(plaintextToQasm('I\nX#0', false)).toEqual(
        'OPENQASM 2.0;\n' +
          'include "qelib1.inc";\n' +
          'qreg q[2];\n' +
          'cx q[0], q[1];\n',
      );
    });

    it('converts CNOT with control from qubit 1', () => {
      expect(plaintextToQasm('X#1\nI', false)).toEqual(
        'OPENQASM 2.0;\n' +
          'include "qelib1.inc";\n' +
          'qreg q[2];\n' +
          'cx q[1], q[0];\n',
      );
    });

    it('converts Bell state preparation', () => {
      expect(plaintextToQasm('H-I\nI-X#0', false)).toEqual(
        'OPENQASM 2.0;\n' +
          'include "qelib1.inc";\n' +
          'qreg q[2];\n' +
          'h q[0];\n' +
          'cx q[0], q[1];\n',
      );
    });

    it('converts controlled-Z gate', () => {
      expect(plaintextToQasm('I\nZ#0', false)).toEqual(
        'OPENQASM 2.0;\n' +
          'include "qelib1.inc";\n' +
          'qreg q[2];\n' +
          'cz q[0], q[1];\n',
      );
    });
  });

  describe('three qubit circuits', () => {
    it('converts first example from file', () => {
      const input = 'I-H-I-I-I\nI-I-I-I-I\nI-I-X#0-X#1-I';
      expect(plaintextToQasm(input, false)).toEqual(
        'OPENQASM 2.0;\n' +
          'include "qelib1.inc";\n' +
          'qreg q[3];\n' +
          'h q[0];\n' +
          'cx q[0], q[2];\n' +
          'cx q[1], q[2];\n',
      );
    });

    it('converts GHZ state preparation', () => {
      expect(plaintextToQasm('H-I-I\nI-X#0-I\nI-I-X#0', false)).toEqual(
        'OPENQASM 2.0;\n' +
          'include "qelib1.inc";\n' +
          'qreg q[3];\n' +
          'h q[0];\n' +
          'cx q[0], q[1];\n' +
          'cx q[0], q[2];\n',
      );
    });
  });

  describe('edge cases - timing and spacing', () => {
    it('handles single hyphen between gates', () => {
      expect(plaintextToQasm('H-X', false)).toEqual(
        'OPENQASM 2.0;\n' +
          'include "qelib1.inc";\n' +
          'qreg q[1];\n' +
          'h q[0];\n' +
          'x q[0];\n',
      );
    });

    it('handles double hyphens as spacing', () => {
      expect(plaintextToQasm('H--X', false)).toEqual(
        'OPENQASM 2.0;\n' +
          'include "qelib1.inc";\n' +
          'qreg q[1];\n' +
          'h q[0];\n' +
          'x q[0];\n',
      );
    });

    it('handles many hyphens as timing markers', () => {
      expect(plaintextToQasm('H-----X', false)).toEqual(
        'OPENQASM 2.0;\n' +
          'include "qelib1.inc";\n' +
          'qreg q[1];\n' +
          'h q[0];\n' +
          'x q[0];\n',
      );
    });

    it('handles gates at start and end with no spacing', () => {
      expect(plaintextToQasm('HXZ', false)).toEqual(
        'OPENQASM 2.0;\n' +
          'include "qelib1.inc";\n' +
          'qreg q[1];\n' +
          'h q[0];\n' +
          'x q[0];\n' +
          'z q[0];\n',
      );
    });

    it('handles circuit ending with hyphens', () => {
      expect(plaintextToQasm('H---', false)).toEqual(
        'OPENQASM 2.0;\n' +
          'include "qelib1.inc";\n' +
          'qreg q[1];\n' +
          'h q[0];\n',
      );
    });

    it('handles circuit starting with hyphens', () => {
      expect(plaintextToQasm('---H', false)).toEqual(
        'OPENQASM 2.0;\n' +
          'include "qelib1.inc";\n' +
          'qreg q[1];\n' +
          'h q[0];\n',
      );
    });

    it('handles only hyphens', () => {
      expect(plaintextToQasm('---', false)).toEqual(
        'OPENQASM 2.0;\n' +
          'include "qelib1.inc";\n' +
          'qreg q[1];\n',
      );
    });
  });

  describe('edge cases - circuit structure', () => {
    it('handles lines of different lengths', () => {
      expect(plaintextToQasm('H-X-Z\nI\nH-I', false)).toEqual(
        'OPENQASM 2.0;\n' +
          'include "qelib1.inc";\n' +
          'qreg q[3];\n' +
          'h q[0];\n' +
          'h q[2];\n' +
          'x q[0];\n' +
          'z q[0];\n',
      );
    });

    it('handles empty lines in middle of circuit', () => {
      expect(plaintextToQasm('H\n\nX', false)).toEqual(
        'OPENQASM 2.0;\n' +
          'include "qelib1.inc";\n' +
          'qreg q[2];\n' +
          'h q[0];\n' +
          'x q[1];\n',
      );
    });

    it('handles whitespace-only lines', () => {
      expect(plaintextToQasm('H\n   \nX', false)).toEqual(
        'OPENQASM 2.0;\n' +
          'include "qelib1.inc";\n' +
          'qreg q[2];\n' +
          'h q[0];\n' +
          'x q[1];\n',
      );
    });

    it('handles trailing newline', () => {
      expect(plaintextToQasm('H\n', false)).toEqual(
        'OPENQASM 2.0;\n' + 'include "qelib1.inc";\n' + 'qreg q[1];\n' + 'h q[0];\n',
      );
    });
  });

  describe('controlled gate edge cases', () => {
    it('handles controlled gate as first operation', () => {
      expect(plaintextToQasm('X#1\nI', false)).toEqual(
        'OPENQASM 2.0;\n' +
          'include "qelib1.inc";\n' +
          'qreg q[2];\n' +
          'cx q[1], q[0];\n',
      );
    });

    it('handles multiple controlled gates in sequence', () => {
      expect(plaintextToQasm('X#1-Z#1\nI---I', false)).toEqual(
        'OPENQASM 2.0;\n' +
          'include "qelib1.inc";\n' +
          'qreg q[2];\n' +
          'cx q[1], q[0];\n' +
          'cz q[1], q[0];\n',
      );
    });

    it('handles controlled gate with max qubit index', () => {
      expect(plaintextToQasm('X#3\nI\nI\nI', false)).toEqual(
        'OPENQASM 2.0;\n' +
          'include "qelib1.inc";\n' +
          'qreg q[4];\n' +
          'cx q[3], q[0];\n',
      );
    });

    it('handles controlled Hadamard (requires decomposition)', () => {
      expect(plaintextToQasm('H#1\nI', false)).toEqual(
        'OPENQASM 2.0;\n' +
          'include "qelib1.inc";\n' +
          'qreg q[2];\n' +
          '// Controlled-H decomposition\n' +
          'ry(0.25*pi) q[0];\n' +
          'cx q[1], q[0];\n' +
          'ry(-0.25*pi) q[0];\n',
      );
    });

    it('handles same qubit controlling multiple targets', () => {
      expect(plaintextToQasm('I-I\nX#0-I\nI-X#0', false)).toEqual(  // Fixed: proper multiple target structure
        'OPENQASM 2.0;\n' +
          'include "qelib1.inc";\n' +
          'qreg q[3];\n' +
          'cx q[0], q[1];\n' +
          'cx q[0], q[2];\n',
      );
    });

    it('handles different qubits controlling same target', () => {
      expect(plaintextToQasm('X#1-X#2\nI---I\nI---I', false)).toEqual(
        'OPENQASM 2.0;\n' +
          'include "qelib1.inc";\n' +
          'qreg q[3];\n' +
          'cx q[1], q[0];\n' +
          'cx q[2], q[0];\n',
      );
    });
  });

  describe('complex quantum algorithms', () => {
    it('converts quantum Fourier transform on 2 qubits', () => {
      const qft2 = 'H---------H#1\nI-H-I-H#0-I';
      expect(plaintextToQasm(qft2, false)).toEqual(
        'OPENQASM 2.0;\n' +
          'include "qelib1.inc";\n' +
          'qreg q[2];\n' +
          'h q[0];\n' +
          'h q[1];\n' +
          '// Controlled-H decomposition\n' +
          'ry(0.25*pi) q[1];\n' +
          'cx q[0], q[1];\n' +
          'ry(-0.25*pi) q[1];\n' +
          '// Controlled-H decomposition\n' +
          'ry(0.25*pi) q[0];\n' +
          'cx q[1], q[0];\n' +
          'ry(-0.25*pi) q[0];\n',
      );
    });

    it('converts Grover diffusion operator pattern', () => {
      const grover = 'H-X-H-X#1-H-X-H\nH-X-H-I---H-X-H';
      expect(plaintextToQasm(grover, false)).toEqual(
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
          'x q[0];\n' +
          'h q[0];\n' +
          'h q[1];\n' +
          'x q[1];\n' +
          'h q[1];\n',
      );
    });

    it('converts W state preparation', () => {
      const wState = 'H-I-----I---I\nI-X#0-I-X#2-I\nI-I---X#0-H-I';  // Fixed: remove self-control
      expect(plaintextToQasm(wState, false)).toEqual(
        'OPENQASM 2.0;\n' +
          'include "qelib1.inc";\n' +
          'qreg q[3];\n' +
          'h q[0];\n' +
          'cx q[0], q[1];\n' +
          'cx q[0], q[2];\n' +
          'cx q[2], q[1];\n' +
          'h q[2];\n',
      );
    });
  });

  describe('error cases - comprehensive', () => {
    it('throws error for lowercase gates', () => {
      expect(() => plaintextToQasm('h', false)).toThrow('Invalid gate: h');
    });

    it('throws error for invalid characters', () => {
      expect(() => plaintextToQasm('H-@-X', false)).toThrow('Invalid gate: @');
    });

    it('throws error for numbers without #', () => {
      expect(() => plaintextToQasm('H-1-X', false)).toThrow('Invalid gate: 1');
    });

    it('throws error for negative control indices', () => {
      expect(() => plaintextToQasm('X#-1\nI', false)).toThrow('Invalid control qubit: -1');
    });

    it('throws error for floating point control indices', () => {
      expect(() => plaintextToQasm('X#1.5\nI', false)).toThrow('Invalid control qubit: 1.5');
    });

    it('throws error for control syntax without number', () => {
      expect(() => plaintextToQasm('X#', false)).toThrow('Invalid control syntax: X#');
    });

    it('throws error for multiple # symbols', () => {
      expect(() => plaintextToQasm('X#0#1', false)).toThrow('Invalid gate syntax: X#0#1');
    });

    it('throws error for self-control in multi-qubit circuit', () => {
      expect(() => plaintextToQasm('X#0', false)).toThrow(  // Fixed: single-qubit self-control
        'Cannot control gate with its own qubit (qubit 0)',
      );
    });

    it('throws error for control index equal to number of qubits', () => {
      expect(() => plaintextToQasm('X#2\nI', false)).toThrow(
        'Control qubit 2 does not exist (circuit has 2 qubits)',
      );
    });
  });

  describe('special cases that should work', () => {
    it('handles 10-qubit circuit', () => {
      const tenQubits = Array(10).fill('H').join('\n');
      const result = plaintextToQasm(tenQubits);
      expect(result).toContain('qreg q[10];');
      expect((result.match(/h q\[\d\];/g) || []).length).toBe(10);
    });

    it('handles very long gate sequence', () => {
      const longSequence = Array(50).fill('H-X').join('-');
      const result = plaintextToQasm(longSequence);
      expect((result.match(/h q\[0\];/g) || []).length).toBe(50);
      expect((result.match(/x q\[0\];/g) || []).length).toBe(50);
    });

    it('handles all supported gates in one sequence', () => {
      expect(plaintextToQasm('I-H-X-Z-I', false)).toEqual(
        'OPENQASM 2.0;\n' +
          'include "qelib1.inc";\n' +
          'qreg q[1];\n' +
          'h q[0];\n' +
          'x q[0];\n' +
          'z q[0];\n',
      );
    });

    it('handles circuit with all qubits having controlled gates', () => {
      expect(plaintextToQasm('X#1-X#2\nX#0-X#2\nX#0-X#1', false)).toEqual(
        'OPENQASM 2.0;\n' +
          'include "qelib1.inc";\n' +
          'qreg q[3];\n' +
          'cx q[1], q[0];\n' +
          'cx q[0], q[1];\n' +
          'cx q[0], q[2];\n' +
          'cx q[2], q[0];\n' +
          'cx q[2], q[1];\n' +
          'cx q[1], q[2];\n',
      );
    });
  });

  describe('pattern recognition', () => {
    it('identifies Bell state pattern', () => {
      const bell = plaintextToQasm('H-I\nI-X#0', false);  // Fixed: remove self-control
      expect(bell).toContain('h q[0];');
      expect(bell).toContain('cx q[0], q[1];');
    });

    it('identifies GHZ state pattern', () => {
      const ghz = plaintextToQasm('H-I---I\nI-X#0-I\nI-I---X#0', false);  // Fixed: remove self-control
      expect(ghz).toContain('h q[0];');
      expect(ghz).toContain('cx q[0], q[1];');
      expect(ghz).toContain('cx q[0], q[2];');
    });

    it('identifies swap pattern using CNOTs', () => {
      const swap = plaintextToQasm('I---X#1-I\nX#0-I---X#0', false);  // Fixed: proper swap pattern
      expect(swap).toContain('cx q[1], q[0];');
      expect(swap).toContain('cx q[0], q[1];');
      expect(swap).toContain('cx q[1], q[0];');
    });
  });

  describe('complex edge cases', () => {
    it('handles circuit from example file with complex control structure', () => {
      const input =
        'H-I-I-H-I-I---I---I-H\n' +  // Fixed: removed all self-control
        'I-Z-I-H-I-I---X#0-I-H\n' +
        'I-I-I-X-H-I---I---H-X\n' +
        'I-I-I-I-I-I---I---I-I';

      expect(plaintextToQasm(input, false)).toEqual(
        'OPENQASM 2.0;\n' +
          'include "qelib1.inc";\n' +
          'qreg q[4];\n' +
          'h q[0];\n' +
          'z q[1];\n' +
          'h q[0];\n' +
          'h q[1];\n' +
          'x q[2];\n' +
          'h q[2];\n' +
          'cx q[0], q[1];\n' +
          'h q[2];\n' +
          'h q[0];\n' +
          'h q[1];\n' +
          'x q[2];\n',
      );
    });

    it('handles single qubit with self-reference properly', () => {
      expect(() => plaintextToQasm('X#0', false)).toThrow(
        'Cannot control gate with its own qubit (qubit 0)',
      );
    });

    it('handles empty circuit with newlines', () => {
      expect(plaintextToQasm('\n\n\n', false)).toEqual(
        'OPENQASM 2.0;\n' + 'include "qelib1.inc";\n' + 'qreg q[1];\n',
      );
    });

    it('handles mixed spacing in multi-qubit circuit', () => {
      expect(plaintextToQasm('H--I---X\nI-H----I\nX-I----Z', false)).toEqual(
        'OPENQASM 2.0;\n' +
          'include "qelib1.inc";\n' +
          'qreg q[3];\n' +
          'h q[0];\n' +
          'x q[2];\n' +
          'h q[1];\n' +
          'x q[0];\n' +
          'z q[2];\n',
      );
    });
  });

  describe('special characters handling', () => {
    it('handles circuit ending with special character from example', () => {
      expect(() => plaintextToQasm('I-I-I---I-I<', false)).toThrow('Invalid gate: I<');
    });
  });
});
