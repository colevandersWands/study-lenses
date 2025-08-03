import { plaintextToQasm } from '../src/plaintext-to-qasm.js';
import { qasmToPlaintext } from '../src/qasm-to-plaintext.js';

describe('roundtrip conversions', () => {
  const testRoundtrip = (plaintext, description) => {
    it(`preserves ${description}`, () => {
      const qasm = plaintextToQasm(plaintext);
      const result = qasmToPlaintext(qasm);
      expect(result).toEqual(plaintext);
    });
  };

  describe('single qubit', () => {
    testRoundtrip('H', 'Hadamard gate');
    testRoundtrip('X', 'X gate');
    testRoundtrip('Z', 'Z gate');
    testRoundtrip('I', 'Identity gate');
    testRoundtrip('H-X-Z', 'gate sequence');
    testRoundtrip('H-I-X', 'sequence with identity');
    testRoundtrip('H---X', 'sequence with multiple time steps');
    testRoundtrip('I-I-I', 'multiple identities');
    testRoundtrip('H-X-Z-I-H-X', 'long gate sequence');
    testRoundtrip('HXZ', 'gates without spacing');
    testRoundtrip('H--X--Z', 'double spacing');
    testRoundtrip('---H---', 'gate with padding');
    testRoundtrip('H---', 'ending with hyphens');
    testRoundtrip('---X', 'starting with hyphens');
  });

  describe('two qubits', () => {
    testRoundtrip('H\nH', 'parallel Hadamards');
    testRoundtrip('H-I\nI-X#0', 'Bell state');  // Fixed: proper Bell state
    testRoundtrip('I\nX#0', 'simple CNOT');  // Fixed: qubit 1 controlled by qubit 0
    testRoundtrip('I\nZ#0', 'controlled-Z');  // Fixed: qubit 1 controlled by qubit 0
    testRoundtrip('H-X\nZ-I', 'mixed operations');
    testRoundtrip('I\nX#0', 'CNOT with control from qubit 0');  // Fixed: renamed and corrected
    testRoundtrip('X#1\nI', 'CNOT on first qubit');  // This one is correct
    testRoundtrip('H-I-X\nI-H-Z', 'staggered operations');
    testRoundtrip('I---I\nX#0-Z#0', 'multiple controlled gates');  // Fixed: proper control structure
    testRoundtrip('H---I\nI---H', 'spacing alignment');
    testRoundtrip('I-I-I\nI-I-I', 'all identity');
    testRoundtrip('H-X-Z\nI-I-I', 'operations on one qubit only');
    testRoundtrip('I-I-I\nH-X-Z', 'operations on second qubit only');
  });

  describe('three qubits', () => {
    testRoundtrip('H-I---I\nI-X#0-I\nI-I---X#0', 'GHZ state');  // Fixed: proper GHZ state
    testRoundtrip('I-H-I---I-I\nI-I-X#0-I-I\nI-I-X#1-I-I', 'example circuit');  // Fixed: proper control
    testRoundtrip('H\nX\nZ', 'single gates on each qubit');
    testRoundtrip('H-I-I\nI-X-I\nI-I-Z', 'diagonal pattern');
    testRoundtrip('I---X#1-I\nX#0-I---X#2\nI---I---I', 'chain of CNOTs');  // Fixed: proper control chain
    testRoundtrip('I---I\nH#0-I\nI---H#1', 'controlled Hadamards');  // Fixed: proper controlled-H
    testRoundtrip('I-I-I\nI-I-I\nI-I-I', 'all identity 3-qubit');
    testRoundtrip('H-X-Z\nH-X-Z\nH-X-Z', 'same sequence on all qubits');
  });

  describe('complex timing patterns', () => {
    const circuits = [
      'H---X---Z',
      'H-I---X\nI-H---Z',
      'H-------X',
      '---H---',
      'I-I-I-I-I',
      'H-----X-----Z',
      'H--I--X--I--Z',
      'I---I---I---I---I',
    ];

    circuits.forEach((circuit) => {
      testRoundtrip(circuit, `timing pattern: ${circuit.replace(/\n/g, ' | ')}`);
    });
  });

  describe('all control patterns', () => {
    const circuits = [
      'I\nX#0',     // Fixed: qubit 1 controlled by qubit 0
      'I\nI\nX#1', // Fixed: qubit 2 controlled by qubit 1
      'I\nZ#0',     // Fixed: qubit 1 controlled by qubit 0
      'I\nI\nZ#1', // Fixed: qubit 2 controlled by qubit 1
      'I---Z#1\nX#0-I', // Fixed: proper cross-qubit control
      'I\nI\nX#0', // Fixed: qubit 2 controlled by qubit 0
      'I\nH#0',     // Fixed: qubit 1 controlled by qubit 0
      'I\nI\nH#1', // Fixed: qubit 2 controlled by qubit 1
      'I---I---I\nX#0-X#2-I\nI---I---X#1', // Fixed: proper control chain
      'I---I---I\nI---X#2-I\nX#0-I---X#1', // Fixed: proper control distribution
    ];

    circuits.forEach((circuit) => {
      testRoundtrip(circuit, `control pattern: ${circuit.replace(/\n/g, ' | ')}`);
    });
  });

  describe('edge cases', () => {
    testRoundtrip('I', 'single identity');
    testRoundtrip('', 'empty circuit');
    testRoundtrip('H\n\nX', 'empty line in circuit');
    testRoundtrip('H\n', 'trailing newline');
    testRoundtrip('\nH', 'leading newline');
    testRoundtrip('H---------X', 'many hyphens');
    testRoundtrip('HXZI', 'all gates concatenated');
    testRoundtrip('---', 'only hyphens');
    testRoundtrip('I---I---I\nI---I---I', 'spaced identities');
  });

  describe('four and five qubit circuits', () => {
    testRoundtrip('H\nI\nI\nX', '4 qubits simple');
    testRoundtrip('I\nI\nI\nX#0', '4 qubits with control');  // Fixed: qubit 3 controlled by qubit 0
    testRoundtrip('H-I---I\nI-X#0-I\nI-I---X#1\nI-I---I', '4 qubits complex');  // Fixed: proper control
    testRoundtrip('I\nI\nI\nI\nI', '5 qubits all identity');
    testRoundtrip('H\nX\nZ\nH\nX', '5 qubits single gates');
    testRoundtrip(
      'I---I---I\nX#0-I---I\nI---X#1-I\nI---I---X#2\nI---I---I',  // Fixed: proper cascade control
      '5 qubits cascade',
    );
  });

  describe('special patterns', () => {
    testRoundtrip('I---X#1-I\nX#0-I---X#0', 'swap circuit');  // Fixed: proper swap pattern
    testRoundtrip('H-X-H\nH-X-H', 'parallel sequences');
    testRoundtrip('H-I---H\nI-Z#0-I', 'controlled in middle');  // Fixed: proper control
    testRoundtrip('I---I-I\nX#0-I-X#0', 'repeated control');  // Fixed: proper repeated control
    testRoundtrip('H-X-Z-H-X-Z\nI-I-I-I-I-I', 'repeated pattern');
  });

  describe('stress tests', () => {
    // Very long single qubit sequence
    const longSequence = Array(20).fill('H-X').join('-');
    testRoundtrip(longSequence, 'very long sequence');

    // Many qubits
    const manyQubits = Array(10).fill('H').join('\n');
    testRoundtrip(manyQubits, '10 qubit circuit');

    // Complex timing on many qubits
    const complexTiming = Array(5).fill('H---X---Z').join('\n');
    testRoundtrip(complexTiming, 'complex timing on 5 qubits');

    // All gates
    testRoundtrip('H-X-Z-I-H-X-Z-I', 'all gate types repeated');

    // Maximum controls
    const maxControls = 'I---I---I---I\nX#0-X#2-X#3-I\nI---I---I---X#1\nI---I---I---I';  // Fixed: remove self-control
    testRoundtrip(maxControls, 'maximum control indices');
  });

  describe('known problematic patterns', () => {
    // These patterns have caused issues in implementations
    testRoundtrip(
      'H-I-I-H-I-I---I---I-H\n' +  // Fixed: removed all self-control
        'I-Z-I-H-I-I---X#0-I-H\n' +
        'I-I-I-X-H-I---I---H-X\n' +
        'I-I-I-I-I-I---I---I-I',
      'complex circuit from examples',
    );

    testRoundtrip('I-I-I---I-I', 'mixed spacing with identities');

    testRoundtrip(
      'H-I-----I---I\n' + 'I-X#0-I-X#2-I\n' + 'I-I---X#0-H-I',  // Fixed: removed self-control
      'W state preparation',
    );

    testRoundtrip('H---------I\nI-H-I-H#0-I', 'QFT pattern');  // Fixed: remove self-control
  });

  describe('ensures no information loss', () => {
    it('preserves exact timing information', () => {
      const circuits = [
        { input: 'H--X', hyphens: 2 },
        { input: 'H---X', hyphens: 3 },
        { input: 'H----X', hyphens: 4 },
        { input: 'H-----X', hyphens: 5 },
      ];

      circuits.forEach(({ input, hyphens }) => {
        const qasm = plaintextToQasm(input);
        const result = qasmToPlaintext(qasm);
        expect(result).toEqual(input);
        // Count hyphens to ensure exact preservation
        const hyphenCount = (result.match(/-/g) || []).length;
        expect(hyphenCount).toBe(hyphens);
      });
    });

    it('preserves qubit ordering', () => {
      const circuit = 'H\nX\nZ\nI\nH';
      const qasm = plaintextToQasm(circuit);
      const result = qasmToPlaintext(qasm);
      const lines = result.split('\n');
      expect(lines).toHaveLength(5);
      expect(lines[0]).toContain('H');
      expect(lines[1]).toContain('X');
      expect(lines[2]).toContain('Z');
      expect(lines[3]).toContain('I');
      expect(lines[4]).toContain('H');
    });

    it('preserves control relationships', () => {
      const circuit = 'X#2-Z#1-H#1\nI---I---I\nI---I---I';  // Fixed: H#1 instead of H#0
      const qasm = plaintextToQasm(circuit);
      const result = qasmToPlaintext(qasm);
      expect(result).toEqual(circuit);
      // Verify control indices are preserved
      expect(result).toContain('X#2');
      expect(result).toContain('Z#1');
      expect(result).toContain('H#1');  // Fixed: H#1 instead of H#0
    });
  });
});
