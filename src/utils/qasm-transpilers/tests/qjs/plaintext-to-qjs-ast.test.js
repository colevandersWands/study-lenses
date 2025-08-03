import { parseTextToQjsAst } from '../../src/qjs/plaintext-to-qjs-ast.js';

describe('parseTextToQjsAst', () => {
  
  describe('empty and basic cases', () => {
    it('parses empty string to minimal AST', () => {
      const result = parseTextToQjsAst('');
      expect(result).toEqual({
        bandwidth: 1,
        timewidth: 0,
        qubits: [expect.any(Object)], // Q.Qubit instance
        operations: [],
        results: [],
        matrix: null,
        needsEvaluation: true,
        history: expect.any(Object), // Q.History instance
        timingPreservation: {
          source: 'plaintext',
          originalText: ''
        }
      });
    });
    
    it('parses whitespace-only string to minimal AST', () => {
      const result = parseTextToQjsAst('   \n\t  \n  ');
      expect(result).toEqual({
        bandwidth: 1,
        timewidth: 0,
        qubits: [expect.any(Object)],
        operations: [],
        results: [],
        matrix: null,
        needsEvaluation: true,
        history: expect.any(Object),
        timingPreservation: {
          source: 'plaintext',
          originalText: '   \n\t  \n  '
        }
      });
    });
    
    it('parses single H gate', () => {
      const result = parseTextToQjsAst('H');
      expect(result.bandwidth).toBe(1);
      expect(result.timewidth).toBe(1);
      expect(result.operations).toHaveLength(1);
      expect(result.operations[0]).toEqual({
        gate: expect.objectContaining({ symbol: 'H', name: 'Hadamard' }),
        momentIndex: 1,
        registerIndices: [1],
        isControlled: false,
        operationMomentId: null
      });
    });
    
    it('parses single X gate', () => {
      const result = parseTextToQjsAst('X');
      expect(result.operations[0]).toEqual({
        gate: expect.objectContaining({ symbol: 'X', name: 'Pauli X' }),
        momentIndex: 1,
        registerIndices: [1],
        isControlled: false,
        operationMomentId: null
      });
    });
    
    it('parses single Z gate', () => {
      const result = parseTextToQjsAst('Z');
      expect(result.operations[0]).toEqual({
        gate: expect.objectContaining({ symbol: 'Z', name: 'Pauli Z' }),
        momentIndex: 1,
        registerIndices: [1],
        isControlled: false,
        operationMomentId: null
      });
    });
    
    it('parses single identity gate (ignored)', () => {
      const result = parseTextToQjsAst('I');
      expect(result.bandwidth).toBe(1);
      expect(result.timewidth).toBe(1);
      expect(result.operations).toHaveLength(0);
    });
    
    it('handles template literal input', () => {
      const templateLiteral = { raw: ['H-X'] };
      const result = parseTextToQjsAst(templateLiteral);
      expect(result.operations).toHaveLength(2);
      expect(result.operations[0].gate.symbol).toBe('H');
      expect(result.operations[1].gate.symbol).toBe('X');
    });
  });
  
  describe('single-qubit sequences', () => {
    it('parses H-X sequence', () => {
      const result = parseTextToQjsAst('H-X');
      expect(result.bandwidth).toBe(1);
      expect(result.timewidth).toBe(2);
      expect(result.operations).toHaveLength(2);
      
      expect(result.operations[0]).toEqual({
        gate: expect.objectContaining({ symbol: 'H' }),
        momentIndex: 1,
        registerIndices: [1],
        isControlled: false,
        operationMomentId: null
      });
      
      expect(result.operations[1]).toEqual({
        gate: expect.objectContaining({ symbol: 'X' }),
        momentIndex: 2,
        registerIndices: [1],
        isControlled: false,
        operationMomentId: null
      });
    });
    
    it('parses H-X-Z sequence', () => {
      const result = parseTextToQjsAst('H-X-Z');
      expect(result.timewidth).toBe(3);
      expect(result.operations).toHaveLength(3);
      expect(result.operations.map(op => op.momentIndex)).toEqual([1, 2, 3]);
      expect(result.operations.map(op => op.gate.symbol)).toEqual(['H', 'X', 'Z']);
    });
    
    it('parses sequence with identity gates', () => {
      const result = parseTextToQjsAst('H-I-X');
      expect(result.timewidth).toBe(3);
      expect(result.operations).toHaveLength(2);
      expect(result.operations[0].momentIndex).toBe(1);
      expect(result.operations[1].momentIndex).toBe(3);
    });
    
    it('handles timing gaps with multiple hyphens', () => {
      const result = parseTextToQjsAst('H---X');
      expect(result.timewidth).toBe(4);
      expect(result.operations).toHaveLength(2);
      expect(result.operations[0].momentIndex).toBe(1);
      expect(result.operations[1].momentIndex).toBe(4);
    });
    
    it('handles leading hyphens', () => {
      const result = parseTextToQjsAst('---H');
      expect(result.timewidth).toBe(4);
      expect(result.operations).toHaveLength(1);
      expect(result.operations[0].momentIndex).toBe(4);
    });
    
    it('handles trailing hyphens', () => {
      const result = parseTextToQjsAst('H---');
      expect(result.timewidth).toBe(4);
      expect(result.operations).toHaveLength(1);
      expect(result.operations[0].momentIndex).toBe(1);
    });
    
    it('handles only hyphens', () => {
      const result = parseTextToQjsAst('-----');
      expect(result.timewidth).toBe(5);
      expect(result.operations).toHaveLength(0);
    });
  });
  
  describe('multi-qubit circuits', () => {
    it('parses simple two-qubit parallel gates', () => {
      const result = parseTextToQjsAst('H\nX');
      expect(result.bandwidth).toBe(2);
      expect(result.timewidth).toBe(1);
      expect(result.qubits).toHaveLength(2);
      expect(result.operations).toHaveLength(2);
      
      expect(result.operations[0]).toEqual({
        gate: expect.objectContaining({ symbol: 'H' }),
        momentIndex: 1,
        registerIndices: [1],
        isControlled: false,
        operationMomentId: null
      });
      
      expect(result.operations[1]).toEqual({
        gate: expect.objectContaining({ symbol: 'X' }),
        momentIndex: 1,
        registerIndices: [2],
        isControlled: false,
        operationMomentId: null
      });
    });
    
    it('parses three-qubit circuit', () => {
      const result = parseTextToQjsAst('H\nX\nZ');
      expect(result.bandwidth).toBe(3);
      expect(result.qubits).toHaveLength(3);
      expect(result.operations).toHaveLength(3);
      expect(result.operations.map(op => op.registerIndices[0])).toEqual([1, 2, 3]);
    });
    
    it('handles different row lengths (ragged arrays)', () => {
      const result = parseTextToQjsAst('H-X-Z\nI-H\nZ');
      expect(result.bandwidth).toBe(3);
      expect(result.timewidth).toBe(3);
      
      const qubit1Ops = result.operations.filter(op => op.registerIndices[0] === 1);
      const qubit2Ops = result.operations.filter(op => op.registerIndices[0] === 2);
      const qubit3Ops = result.operations.filter(op => op.registerIndices[0] === 3);
      
      expect(qubit1Ops).toHaveLength(3); // H, X, Z
      expect(qubit2Ops).toHaveLength(1); // H at moment 2
      expect(qubit3Ops).toHaveLength(1); // Z at moment 1
    });
    
    it('handles sparse multi-qubit patterns', () => {
      const result = parseTextToQjsAst('H---X\nI-I-I\n--Z--');
      expect(result.bandwidth).toBe(3);
      expect(result.timewidth).toBe(5);
      
      const ops = result.operations;
      expect(ops.filter(op => op.registerIndices[0] === 1)).toHaveLength(2); // H and X
      expect(ops.filter(op => op.registerIndices[0] === 2)).toHaveLength(0); // all identity
      expect(ops.filter(op => op.registerIndices[0] === 3)).toHaveLength(1); // Z
    });
    
    it('handles empty lines in circuit', () => {
      const result = parseTextToQjsAst('H\n\nX');
      expect(result.bandwidth).toBe(2); // Empty line creates qubit slot
      expect(result.operations).toHaveLength(2);
    });
    
    it('handles whitespace-only lines', () => {
      const result = parseTextToQjsAst('H\n   \nX');
      expect(result.bandwidth).toBe(2);
      expect(result.operations).toHaveLength(2);
    });
  });
  
  describe('controlled gates', () => {
    it('parses controlled-X gate (CNOT)', () => {
      const result = parseTextToQjsAst('I\nX#0');
      expect(result.bandwidth).toBe(2);
      expect(result.operations).toHaveLength(1);
      
      expect(result.operations[0]).toEqual({
        gate: expect.objectContaining({ symbol: 'X' }),
        momentIndex: 1,
        registerIndices: expect.arrayContaining([2, 1]), // target qubit 2, control qubit 1
        isControlled: true,
        operationMomentId: null
      });
    });
    
    it('parses controlled-H gate', () => {
      const result = parseTextToQjsAst('H#1\nI');
      expect(result.operations[0]).toEqual({
        gate: expect.objectContaining({ symbol: 'H' }),
        momentIndex: 1,
        registerIndices: expect.arrayContaining([1, 2]), // target qubit 1, control qubit 2
        isControlled: true,
        operationMomentId: null
      });
    });
    
    it('parses controlled-Z gate', () => {
      const result = parseTextToQjsAst('I\nZ#0');
      expect(result.operations[0]).toEqual({
        gate: expect.objectContaining({ symbol: 'Z' }),
        momentIndex: 1,
        registerIndices: expect.arrayContaining([2, 1]),
        isControlled: true,
        operationMomentId: null
      });
    });
    
    it('parses Bell state circuit', () => {
      const result = parseTextToQjsAst('H-I\nI-X#0');
      expect(result.bandwidth).toBe(2);
      expect(result.timewidth).toBe(2);
      expect(result.operations).toHaveLength(2);
      
      expect(result.operations[0]).toEqual({
        gate: expect.objectContaining({ symbol: 'H' }),
        momentIndex: 1,
        registerIndices: [1],
        isControlled: false,
        operationMomentId: null
      });
      
      expect(result.operations[1]).toEqual({
        gate: expect.objectContaining({ symbol: 'X' }),
        momentIndex: 2,
        registerIndices: expect.arrayContaining([2, 1]), // CNOT from qubit 1 to qubit 2
        isControlled: true,
        operationMomentId: null
      });
    });
    
    it('parses GHZ state circuit', () => {
      const result = parseTextToQjsAst('H-I-I\nI-X#0-I\nI-I-X#0');
      expect(result.bandwidth).toBe(3);
      expect(result.operations).toHaveLength(3); // H, CNOT, CNOT
      
      const hGate = result.operations.find(op => op.gate.symbol === 'H');
      const cnotGates = result.operations.filter(op => op.gate.symbol === 'X' && op.isControlled);
      
      expect(hGate.momentIndex).toBe(1);
      expect(cnotGates).toHaveLength(2);
      expect(cnotGates.map(op => op.momentIndex)).toEqual([2, 3]);
    });
    
    it('handles control from higher-numbered qubit', () => {
      const result = parseTextToQjsAst('X#1\nI');
      expect(result.operations[0]).toEqual({
        gate: expect.objectContaining({ symbol: 'X' }),
        momentIndex: 1,
        registerIndices: expect.arrayContaining([1, 2]), // target qubit 1, control qubit 2
        isControlled: true,
        operationMomentId: null
      });
    });
    
    it('handles multiple controlled gates in sequence', () => {
      const result = parseTextToQjsAst('X#1-Z#1\nI---I');
      expect(result.operations).toHaveLength(2);
      expect(result.operations[0].momentIndex).toBe(1);
      expect(result.operations[1].momentIndex).toBe(2);
      expect(result.operations.every(op => op.isControlled)).toBe(true);
    });
    
    it('handles same qubit controlling multiple targets', () => {
      const result = parseTextToQjsAst('I-I\nX#0-I\nI-X#0');
      expect(result.operations).toHaveLength(2);
      expect(result.operations.every(op => op.isControlled)).toBe(true);
    });
    
    it('handles high-numbered control qubits', () => {
      const qubits = Array(10).fill('I').join('\n');
      const circuit = qubits + '\nX#9';
      const result = parseTextToQjsAst(circuit);
      
      expect(result.bandwidth).toBe(11);
      expect(result.operations).toHaveLength(1);
      expect(result.operations[0].registerIndices).toEqual(expect.arrayContaining([11, 10])); // target 11, control 10 (0-indexed becomes 1-indexed)
    });
  });
  
  describe('complex real-world patterns', () => {
    it('parses quantum Fourier transform pattern', () => {
      const result = parseTextToQjsAst('H---------H#1\nI-H-I-H#0-I');
      expect(result.bandwidth).toBe(2);
      expect(result.timewidth).toBe(10);
      
      const hGates = result.operations.filter(op => op.gate.symbol === 'H');
      expect(hGates).toHaveLength(4); // Two regular H, two controlled H
      
      const controlledHGates = hGates.filter(op => op.isControlled);
      expect(controlledHGates).toHaveLength(2); // Two controlled H gates
    });
    
    it('parses Grover diffusion operator pattern', () => {
      const result = parseTextToQjsAst('H-X-H-X#1-H-X-H\nH-X-H-I---H-X-H');
      expect(result.bandwidth).toBe(2);
      
      const operations = result.operations;
      const controlledOps = operations.filter(op => op.isControlled);
      expect(controlledOps).toHaveLength(1); // One controlled gate
    });
    
    it('parses complex example from file', () => {
      const input = 'I---Z#1-I-H-I-X#2-I---I-H\nH#0-Z#0-I-H-I-I---X#0-I-H\nI---Z#0-I-X-H-X#1-X#1-H-X\nI---I---I-I-I-I---I---I-I';
      const result = parseTextToQjsAst(input);
      
      expect(result.bandwidth).toBe(4);
      expect(result.timewidth).toBe(11); // Fixed: correct timewidth based on meaningful gate distribution 
      expect(result.operations.length).toBeGreaterThan(10); // Complex circuit with many operations
      
      const controlledOps = result.operations.filter(op => op.isControlled);
      expect(controlledOps.length).toBeGreaterThan(5); // Many controlled gates
    });
  });
  
  describe('AST structure validation', () => {
    it('sets proper bandwidth for circuit', () => {
      const result = parseTextToQjsAst('H\nX\nZ\nI\nH');
      expect(result.bandwidth).toBe(5);
      expect(result.qubits).toHaveLength(5);
    });
    
    it('calculates correct timewidth', () => {
      const result = parseTextToQjsAst('H-X-Z---I\nI-I');
      expect(result.timewidth).toBe(5); // Longest row determines timewidth
    });
    
    it('initializes qubits array properly', () => {
      const result = parseTextToQjsAst('H\nX');
      expect(result.qubits).toHaveLength(2);
      result.qubits.forEach(qubit => {
        expect(qubit).toHaveProperty('alpha');
        expect(qubit).toHaveProperty('beta');
      });
    });
    
    it('sets default AST fields', () => {
      const result = parseTextToQjsAst('H');
      expect(result.results).toEqual([]);
      expect(result.matrix).toBe(null);
      expect(result.needsEvaluation).toBe(true);
      expect(result.history).toBeDefined();
    });
    
    it('uses 1-indexed registerIndices', () => {
      const result = parseTextToQjsAst('H\nX\nZ');
      const registerIndices = result.operations.map(op => op.registerIndices[0]);
      expect(registerIndices).toEqual([1, 2, 3]); // 1-indexed, not 0-indexed
    });
    
    it('preserves gate instances with proper properties', () => {
      const result = parseTextToQjsAst('H-X-Z');
      
      const hGate = result.operations.find(op => op.gate.symbol === 'H');
      expect(hGate.gate).toHaveProperty('symbol', 'H');
      expect(hGate.gate).toHaveProperty('name', expect.stringMatching(/hadamard/i));
      
      const xGate = result.operations.find(op => op.gate.symbol === 'X');
      expect(xGate.gate).toHaveProperty('symbol', 'X');
      expect(xGate.gate).toHaveProperty('name', expect.stringMatching(/pauli.x/i));
    });
    
    it('sets operationMomentId to null by default', () => {
      const result = parseTextToQjsAst('H-I\nI-X#0');
      result.operations.forEach(op => {
        expect(op.operationMomentId).toBe(null);
      });
    });
  });
  
  describe('whitespace and formatting edge cases', () => {
    it('handles leading and trailing whitespace', () => {
      const result = parseTextToQjsAst('  H-X  ');
      expect(result.operations).toHaveLength(2);
    });
    
    it('handles various line endings', () => {
      const result1 = parseTextToQjsAst('H\nX');  // Unix
      const result2 = parseTextToQjsAst('H\r\nX'); // Windows
      const result3 = parseTextToQjsAst('H\rX');   // Old Mac
      
      [result1, result2, result3].forEach(result => {
        expect(result.bandwidth).toBe(2);
        expect(result.operations).toHaveLength(2);
      });
    });
    
    it('handles mixed whitespace in lines', () => {
      const result = parseTextToQjsAst(' H - X \n  I   Z  ');
      expect(result.bandwidth).toBe(2);
      expect(result.operations).toHaveLength(3); // H, X, Z (I ignored)
    });
    
    it('filters empty lines correctly', () => {
      const result = parseTextToQjsAst('H\n\n\nX');
      expect(result.bandwidth).toBe(2);
      expect(result.operations).toHaveLength(2);
    });
  });
  
  describe('error cases and validation', () => {
    it('throws on invalid gate character', () => {
      expect(() => parseTextToQjsAst('Q')).toThrow();
    });
    
    it('throws on lowercase gates', () => {
      expect(() => parseTextToQjsAst('h')).toThrow();
    });
    
    it('throws on malformed control syntax', () => {
      expect(() => parseTextToQjsAst('X#')).toThrow();
      expect(() => parseTextToQjsAst('X#a')).toThrow();
      expect(() => parseTextToQjsAst('X#-1')).toThrow();
    });
    
    it('throws on invalid characters', () => {
      expect(() => parseTextToQjsAst('H-@-X')).toThrow();
    });
    
    it('handles undefined input gracefully', () => {
      const result = parseTextToQjsAst(undefined);
      expect(result.bandwidth).toBe(3); // Default from Q.Circuit constructor
      expect(result.operations).toHaveLength(0);
    });
  });
  
  describe('boundary conditions', () => {
    it('handles single character input', () => {
      const result = parseTextToQjsAst('H');
      expect(result.bandwidth).toBe(1);
      expect(result.timewidth).toBe(1);
      expect(result.operations).toHaveLength(1);
    });
    
    it('handles maximum reasonable circuit sizes', () => {
      const largeCircuit = Array(20).fill('H').join('\n');
      const result = parseTextToQjsAst(largeCircuit);
      expect(result.bandwidth).toBe(20);
      expect(result.operations).toHaveLength(20);
    });
    
    it('handles very long gate sequences', () => {
      const longSequence = Array(50).fill('H').join('-');
      const result = parseTextToQjsAst(longSequence);
      expect(result.timewidth).toBe(50);
      expect(result.operations).toHaveLength(50);
    });
    
    it('handles circuits with only identity gates', () => {
      const result = parseTextToQjsAst('I-I-I\nI-I-I');
      expect(result.bandwidth).toBe(2);
      expect(result.timewidth).toBe(3);
      expect(result.operations).toHaveLength(0); // All identity gates ignored
    });
  });
});