import { validatePlaintextFormat, validateQasmFormat, validateConnectivity, validateTiming } from '../src/validation.js';

describe('validation functions', () => {
  describe('validatePlaintextFormat', () => {
    it('accepts valid single qubit circuits', () => {
      expect(() => validatePlaintextFormat('H')).not.toThrow();
      expect(() => validatePlaintextFormat('X')).not.toThrow();
      expect(() => validatePlaintextFormat('Z')).not.toThrow();
      expect(() => validatePlaintextFormat('I')).not.toThrow();
      expect(() => validatePlaintextFormat('H-X-Z')).not.toThrow();
      expect(() => validatePlaintextFormat('H---X')).not.toThrow();
    });

    it('accepts valid multi-qubit circuits', () => {
      expect(() => validatePlaintextFormat('H-I\nI-X#0')).not.toThrow();  // Fixed: proper Bell state
      expect(() => validatePlaintextFormat('I\nX#0')).not.toThrow();
      expect(() => validatePlaintextFormat('H-I-I\nI-X#0-I\nI-I-X#0')).not.toThrow();  // Fixed: proper GHZ state
    });

    it('rejects self-control gates', () => {
      expect(() => validatePlaintextFormat('X#0')).toThrow('Cannot control gate with its own qubit (qubit 0)');
      expect(() => validatePlaintextFormat('I\nX#1')).toThrow('Cannot control gate with its own qubit (qubit 1)');
      expect(() => validatePlaintextFormat('H#0\nI\nI')).toThrow('Cannot control gate with its own qubit (qubit 0)');
    });

    it('rejects non-existent control qubits', () => {
      expect(() => validatePlaintextFormat('X#2\nI')).toThrow('Control qubit 2 does not exist');  // 2 qubits (0,1), control 2 doesn't exist
      expect(() => validatePlaintextFormat('X#3\nI\nI')).toThrow('Control qubit 3 does not exist');  // 3 qubits (0,1,2), control 3 doesn't exist
      expect(() => validatePlaintextFormat('I\nI\nZ#3')).toThrow('Control qubit 3 does not exist');  // 3 qubits (0,1,2), control 3 doesn't exist
    });

    it('rejects invalid gate names', () => {
      expect(() => validatePlaintextFormat('Q')).toThrow('Invalid gate: Q');
      expect(() => validatePlaintextFormat('H-Q-X')).toThrow('Invalid gate: Q');
      expect(() => validatePlaintextFormat('Y#0\nI')).toThrow('Invalid gate: Y');
    });

    it('rejects malformed control syntax', () => {
      expect(() => validatePlaintextFormat('X#')).toThrow('Invalid control syntax');
      expect(() => validatePlaintextFormat('X#a')).toThrow('Invalid control syntax');
      expect(() => validatePlaintextFormat('X##0')).toThrow('Invalid control syntax');
      expect(() => validatePlaintextFormat('X#0#1')).toThrow('Invalid control syntax');
    });

    it('rejects empty lines', () => {
      expect(() => validatePlaintextFormat('')).toThrow('Empty circuit');
      expect(() => validatePlaintextFormat('\n\n')).toThrow('Empty circuit');
    });
  });

  describe('validateQasmFormat', () => {
    it('accepts valid basic QASM', () => {
      const basicQasm = 'OPENQASM 2.0;\ninclude "qelib1.inc";\nqreg q[1];\nh q[0];';
      expect(() => validateQasmFormat(basicQasm)).not.toThrow();
    });

    it('accepts complex QASM circuits', () => {
      const complexQasm =
        'OPENQASM 2.0;\n' +
        'include "qelib1.inc";\n' +
        'qreg q[4];\n' +
        'h q[0];\n' +
        'cx q[0], q[1];\n' +
        'ry(0.25*pi) q[1];\n' +
        'cx q[0], q[1];\n' +
        'ry(-0.25*pi) q[1];\n' +
        'cx q[2], q[3];\n';
      expect(() => validateQasmFormat(complexQasm)).not.toThrow();
    });

    it('rejects missing OPENQASM version', () => {
      const noVersion = 'include "qelib1.inc";\nqreg q[1];\nh q[0];';
      expect(() => validateQasmFormat(noVersion)).toThrow('Missing OPENQASM version declaration');
    });

    it('rejects missing qelib include', () => {
      const noQelib = 'OPENQASM 2.0;\nqreg q[1];\nh q[0];';
      expect(() => validateQasmFormat(noQelib)).toThrow('Missing qelib1.inc include');
    });

    it('rejects missing qubit register', () => {
      const noQreg = 'OPENQASM 2.0;\ninclude "qelib1.inc";\nh q[0];';
      expect(() => validateQasmFormat(noQreg)).toThrow('Missing qreg declaration');
    });

    it('rejects wrong OPENQASM version', () => {
      const wrongVersion = 'OPENQASM 3.0;\ninclude "qelib1.inc";\nqreg q[1];\nh q[0];';
      expect(() => validateQasmFormat(wrongVersion)).toThrow('Unsupported OPENQASM version');
    });

    it('rejects invalid gate syntax', () => {
      const invalidGate = 'OPENQASM 2.0;\ninclude "qelib1.inc";\nqreg q[1];\ninvalid_gate q[0];';
      expect(() => validateQasmFormat(invalidGate)).toThrow('Invalid gate syntax');
    });
  });

  describe('validateConnectivity', () => {
    it('accepts Bell state circuit', () => {
      const circuit = 'H-I\nI-X#0';  // Fixed: proper Bell state (H on qubit 0, CNOT on qubit 1 controlled by qubit 0)
      expect(() => validateConnectivity(circuit)).not.toThrow();
    });

    it('accepts GHZ state circuit', () => {
      const circuit = 'H-I-I\nI-X#0-I\nI-I-X#0';  // Fixed: proper GHZ state (H on qubit 0, CNOTs from qubit 0 to qubits 1 and 2)
      expect(() => validateConnectivity(circuit)).not.toThrow();
    });

    it('accepts complex connectivity patterns', () => {
      const circuit = 'X#1-X#2\nX#0-X#2\nX#0-X#1';
      expect(() => validateConnectivity(circuit)).not.toThrow();
    });

    it('rejects self-control attempts', () => {
      expect(() => validateConnectivity('X#0')).toThrow('Cannot control gate with its own qubit (qubit 0)');
      expect(() => validateConnectivity('I\nZ#1')).toThrow('Cannot control gate with its own qubit (qubit 1)');
    });

    it('rejects non-existent control qubits', () => {
      expect(() => validateConnectivity('X#2\nI')).toThrow('Control qubit 2 does not exist');
      expect(() => validateConnectivity('I\nI\nZ#3')).toThrow('Control qubit 3 does not exist');
    });

    it('handles circuits with no controlled gates', () => {
      const circuit = 'H-X-Z\nI-H-I\nZ-I-X';
      expect(() => validateConnectivity(circuit)).not.toThrow();
    });
  });

  describe('validateTiming', () => {
    it('accepts synchronized timing', () => {
      const circuit = 'H-X\nI-I';
      expect(() => validateTiming(circuit)).not.toThrow();
    });

    it('accepts staggered timing', () => {
      const circuit = 'H---X\nI-I-I';
      expect(() => validateTiming(circuit)).not.toThrow();
    });

    it('accepts complex timing patterns', () => {
      const circuit = 'H---------H#0\nI-H-I-H#1-I';
      expect(() => validateTiming(circuit)).not.toThrow();
    });

    it('rejects timing misalignment', () => {
      expect(() => validateTiming('H-X\nI')).toThrow('Circuit timing mismatch');
      expect(() => validateTiming('H\nI-I-I')).toThrow('Circuit timing mismatch');
    });

    it('rejects inconsistent gate positions', () => {
      expect(() => validateTiming('H-X-I\nI-I')).toThrow('Circuit timing mismatch');
      expect(() => validateTiming('H\nI-I')).toThrow('Circuit timing mismatch');
    });

    it('handles empty time steps correctly', () => {
      const circuit = 'H---I---X\nI-I-I-I-I';
      expect(() => validateTiming(circuit)).not.toThrow();
    });
  });
});