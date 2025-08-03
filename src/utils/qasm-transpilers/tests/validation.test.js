import { plaintextToQasm, qasmToPlaintext } from '../index.js';

describe('validation integration', () => {
  describe('transpiler validation behavior', () => {
    it('transpiler should reject invalid plaintext input', () => {
      expect(() => plaintextToQasm('X#0')).toThrow('Cannot control gate with its own qubit');
      expect(() => plaintextToQasm('Q')).toThrow('Invalid gate');
      expect(() => plaintextToQasm('X#2\nI')).toThrow('does not exist');
    });

    it('transpiler should reject invalid QASM input', () => {
      expect(() => qasmToPlaintext('invalid qasm')).toThrow('Missing OPENQASM version');
      expect(() => qasmToPlaintext('OPENQASM 2.0;\nh q[0];')).toThrow('Missing qelib1.inc include');
    });

    it('transpiler should accept valid inputs without validation errors', () => {
      expect(() => plaintextToQasm('H')).not.toThrow();
      expect(() => plaintextToQasm('H-I\nI-X#0')).not.toThrow();  // Fixed: proper Bell state instead of self-control
      
      const validQasm = 'OPENQASM 2.0;\ninclude "qelib1.inc";\nqreg q[1];\nh q[0];';
      expect(() => qasmToPlaintext(validQasm)).not.toThrow();
    });
  });
});