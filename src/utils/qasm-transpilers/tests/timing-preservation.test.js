import { plaintextToQasm } from '../src/plaintext-to-qasm.js';
import { qasmToPlaintext } from '../src/qasm-to-plaintext.js';

describe('Timing Preservation Strategy', () => {
  // The core principle: preserve timing when converting FROM plaintext (which has rich timing),
  // but use left-pack when converting FROM QASM (which has limited timing)
  
  describe('FROM plaintext: preserve exact timing', () => {
    describe('single qubit timing preservation', () => {
      it('preserves single hyphen spacing', () => {
        const plaintext = 'H-X';
        const qasm = plaintextToQasm(plaintext);
        const result = qasmToPlaintext(qasm);
        expect(result).toEqual('H-X'); // Exact preservation
      });

      it('preserves double hyphen spacing', () => {
        const plaintext = 'H--X';
        const qasm = plaintextToQasm(plaintext);
        const result = qasmToPlaintext(qasm);
        expect(result).toEqual('H--X'); // Exact preservation
      });

      it('preserves triple hyphen spacing', () => {
        const plaintext = 'H---X';
        const qasm = plaintextToQasm(plaintext);
        const result = qasmToPlaintext(qasm);
        expect(result).toEqual('H---X'); // Exact preservation
      });

      it('preserves long spacing sequences', () => {
        const plaintext = 'H-------X';
        const qasm = plaintextToQasm(plaintext);
        const result = qasmToPlaintext(qasm);
        expect(result).toEqual('H-------X'); // Exact preservation
      });

      it('preserves leading hyphens', () => {
        const plaintext = '---H';
        const qasm = plaintextToQasm(plaintext);
        const result = qasmToPlaintext(qasm);
        expect(result).toEqual('---H'); // Exact preservation
      });

      it('preserves trailing hyphens', () => {
        const plaintext = 'H---';
        const qasm = plaintextToQasm(plaintext);
        const result = qasmToPlaintext(qasm);
        expect(result).toEqual('H---'); // Exact preservation
      });

      it('preserves surrounding hyphens', () => {
        const plaintext = '---H---';
        const qasm = plaintextToQasm(plaintext);
        const result = qasmToPlaintext(qasm);
        expect(result).toEqual('---H---'); // Exact preservation
      });

      it('preserves identity gate timing', () => {
        const plaintext = 'H-I-X';
        const qasm = plaintextToQasm(plaintext);
        const result = qasmToPlaintext(qasm);
        expect(result).toEqual('H-I-X'); // Exact preservation
      });

      it('preserves multiple identity timing', () => {
        const plaintext = 'H-I-I-X';
        const qasm = plaintextToQasm(plaintext);
        const result = qasmToPlaintext(qasm);
        expect(result).toEqual('H-I-I-X'); // Exact preservation
      });

      it('preserves mixed timing patterns', () => {
        const plaintext = 'H--I---X--Z';
        const qasm = plaintextToQasm(plaintext);
        const result = qasmToPlaintext(qasm);
        expect(result).toEqual('H--I---X--Z'); // Exact preservation
      });
    });

    describe('multi-qubit timing preservation', () => {
      it('preserves timing alignment across qubits', () => {
        const plaintext = 'H---X\nI---Z';
        const qasm = plaintextToQasm(plaintext);
        const result = qasmToPlaintext(qasm);
        expect(result).toEqual('H---X\nI---Z'); // Exact preservation
      });

      it('preserves staggered timing', () => {
        const plaintext = 'H-I---X\nI-Z---I';
        const qasm = plaintextToQasm(plaintext);
        const result = qasmToPlaintext(qasm);
        expect(result).toEqual('H-I---X\nI-Z---I'); // Exact preservation
      });

      it('preserves controlled gate timing', () => {
        const plaintext = 'H---I\nI---X#0';
        const qasm = plaintextToQasm(plaintext);
        const result = qasmToPlaintext(qasm);
        expect(result).toEqual('H---I\nI---X#0'); // Exact preservation
      });

      it('preserves complex controlled patterns', () => {
        const plaintext = 'H-I---I---X\nI-X#0-I---I\nI-I---H#0-Z';
        const qasm = plaintextToQasm(plaintext);
        const result = qasmToPlaintext(qasm);
        expect(result).toEqual('H-I---I---X\nI-X#0-I---I\nI-I---H#0-Z'); // Exact preservation
      });

      it('preserves identity-only lines with timing', () => {
        const plaintext = 'H---X---Z\nI---I---I\nX---H---I';
        const qasm = plaintextToQasm(plaintext);
        const result = qasmToPlaintext(qasm);
        expect(result).toEqual('H---X---Z\nI---I---I\nX---H---I'); // Exact preservation
      });
    });

    describe('consecutive gate patterns', () => {
      it('preserves consecutive gates without hyphens', () => {
        const plaintext = 'HXZ';
        const qasm = plaintextToQasm(plaintext);
        const result = qasmToPlaintext(qasm);
        expect(result).toEqual('HXZ'); // Exact preservation
      });

      it('preserves mixed consecutive and spaced', () => {
        const plaintext = 'HX-Z--I';
        const qasm = plaintextToQasm(plaintext);
        const result = qasmToPlaintext(qasm);
        expect(result).toEqual('HX-Z--I'); // Exact preservation
      });
    });
  });

  describe('FROM QASM: use left-pack strategy', () => {
    describe('left-pack timing when no timing info available', () => {
      it('left-packs sequential single-qubit gates', () => {
        const qasm = 
          'OPENQASM 2.0;\n' +
          'include "qelib1.inc";\n' +
          'qreg q[1];\n' +
          'h q[0];\n' +
          'x q[0];\n';
        
        const result = qasmToPlaintext(qasm);
        expect(result).toEqual('H-X'); // Left-packed
      });

      it('left-packs multi-qubit independent gates', () => {
        const qasm = 
          'OPENQASM 2.0;\n' +
          'include "qelib1.inc";\n' +
          'qreg q[2];\n' +
          'h q[0];\n' +
          'x q[1];\n';
        
        const result = qasmToPlaintext(qasm);
        expect(result).toEqual('H\nX'); // Left-packed (simultaneous)
      });

      it('left-packs controlled gates properly', () => {
        const qasm = 
          'OPENQASM 2.0;\n' +
          'include "qelib1.inc";\n' +
          'qreg q[2];\n' +
          'h q[0];\n' +
          'cx q[0], q[1];\n';
        
        const result = qasmToPlaintext(qasm);
        expect(result).toEqual('H-I\nI-X#0'); // Left-packed
      });

      it('left-packs complex gate sequences', () => {
        const qasm = 
          'OPENQASM 2.0;\n' +
          'include "qelib1.inc";\n' +
          'qreg q[3];\n' +
          'h q[0];\n' +
          'cx q[0], q[1];\n' +
          'x q[2];\n' +
          'cz q[1], q[2];\n';
        
        const result = qasmToPlaintext(qasm);
        expect(result).toEqual('H-I-I-I\nI-X#0-I-I\nI-I-Z#1-X'); // Left-packed
      });
    });
  });

  describe('round-trip consistency validation', () => {
    describe('plaintext→QASM→plaintext preserves timing', () => {
      const timingPatterns = [
        'H-X',
        'H--X',
        'H---X',
        'H----X',
        'H-----X',
        '---H---',
        'H-I-X',
        'H-I-I-X',
        'HXZ',
        'HX-Z',
        'H---X---Z',
      ];

      timingPatterns.forEach(pattern => {
        it(`preserves pattern: ${pattern}`, () => {
          const qasm = plaintextToQasm(pattern);
          const result = qasmToPlaintext(qasm);
          expect(result).toEqual(pattern); // Must be identical
        });
      });
    });

    describe('QASM→plaintext→QASM is semantically equivalent', () => {
      it('maintains semantic equivalence for basic gates', () => {
        const originalQasm = 
          'OPENQASM 2.0;\n' +
          'include "qelib1.inc";\n' +
          'qreg q[1];\n' +
          'h q[0];\n' +
          'x q[0];\n';
        
        const plaintext = qasmToPlaintext(originalQasm);
        const finalQasm = plaintextToQasm(plaintext);
        
        // Should contain same operations (but may be formatted differently)
        expect(finalQasm).toContain('h q[0];');
        expect(finalQasm).toContain('x q[0];');
      });

      it('maintains semantic equivalence for controlled gates', () => {
        const originalQasm = 
          'OPENQASM 2.0;\n' +
          'include "qelib1.inc";\n' +
          'qreg q[2];\n' +
          'h q[0];\n' +
          'cx q[0], q[1];\n';
        
        const plaintext = qasmToPlaintext(originalQasm);
        const finalQasm = plaintextToQasm(plaintext);
        
        // Should contain same operations
        expect(finalQasm).toContain('h q[0];');
        expect(finalQasm).toContain('cx q[0], q[1];');
      });
    });
  });

  describe('timing preservation edge cases', () => {
    it('handles only hyphens as pure timing', () => {
      const plaintext = '---';
      const qasm = plaintextToQasm(plaintext);
      const result = qasmToPlaintext(qasm);
      expect(result).toEqual('---'); // Preserve pure timing
    });

    it('handles empty string gracefully', () => {
      const plaintext = '';
      const qasm = plaintextToQasm(plaintext);
      const result = qasmToPlaintext(qasm);
      expect(result).toEqual(''); // Empty stays empty for roundtrip compatibility
    });

    it('handles identity-only sequences', () => {
      const plaintext = 'I-I-I';
      const qasm = plaintextToQasm(plaintext);
      const result = qasmToPlaintext(qasm);
      expect(result).toEqual('I-I-I'); // Preserve identity timing
    });

    it('handles very long timing sequences', () => {
      const plaintext = 'H' + '-'.repeat(20) + 'X';
      const qasm = plaintextToQasm(plaintext);
      const result = qasmToPlaintext(qasm);
      expect(result).toEqual(plaintext); // Preserve long timing
    });
  });

  describe('timing preservation with controlled-H decomposition', () => {
    it('preserves timing through controlled-H decomposition', () => {
      const plaintext = 'H#1---X\nI-----I';
      const qasm = plaintextToQasm(plaintext);
      const result = qasmToPlaintext(qasm);
      expect(result).toEqual('H#1---X\nI-----I'); // Preserve timing despite decomposition
    });

    it('handles complex controlled-H with timing', () => {
      const plaintext = 'I---H#2-I\nH#0-I---X\nI---I---I';
      const qasm = plaintextToQasm(plaintext);
      const result = qasmToPlaintext(qasm);
      expect(result).toEqual('I---H#2-I\nH#0-I---X\nI---I---I'); // Preserve complex timing
    });
  });
});