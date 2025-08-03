import { parseQasmToQjsAst } from '../../src/qjs/qasm-to-qjs-ast.js';

describe('parseQasmToQjsAst', () => {
  
  describe('OpenQASM header validation', () => {
    it('parses minimal valid QASM', () => {
      const qasm = 'OPENQASM 2.0;\ninclude "qelib1.inc";\nqreg q[1];';
      const result = parseQasmToQjsAst(qasm);
      
      expect(result).toEqual({
        bandwidth: 1,
        timewidth: 0,
        qubits: [expect.any(Object)],
        operations: [],
        results: [],
        matrix: null,
        needsEvaluation: true,
        history: expect.any(Object)
      });
    });
    
    it('parses minimal QASM with multiple qubits', () => {
      const qasm = 'OPENQASM 2.0;\ninclude "qelib1.inc";\nqreg q[3];';
      const result = parseQasmToQjsAst(qasm);
      
      expect(result.bandwidth).toBe(3);
      expect(result.qubits).toHaveLength(3);
      expect(result.operations).toHaveLength(0);
    });
    
    it('handles whitespace variations in header', () => {
      const qasm = '  OPENQASM 2.0;  \n  include "qelib1.inc";  \n  qreg q[2];  ';
      const result = parseQasmToQjsAst(qasm);
      
      expect(result.bandwidth).toBe(2);
      expect(result.operations).toHaveLength(0);
    });
    
    it('handles comments in header', () => {
      const qasm = 'OPENQASM 2.0; // Version comment\ninclude "qelib1.inc"; // Include comment\nqreg q[1]; // Register comment';
      const result = parseQasmToQjsAst(qasm);
      
      expect(result.bandwidth).toBe(1);
      expect(result.operations).toHaveLength(0);
    });
    
    it('handles empty lines and extra whitespace', () => {
      const qasm = 'OPENQASM 2.0;\n\ninclude "qelib1.inc";\n\n\nqreg q[1];\n\n';
      const result = parseQasmToQjsAst(qasm);
      
      expect(result.bandwidth).toBe(1);
      expect(result.operations).toHaveLength(0);
    });
    
    it('throws on missing OPENQASM version', () => {
      const qasm = 'include "qelib1.inc";\nqreg q[1];';
      expect(() => parseQasmToQjsAst(qasm)).toThrow('Missing OPENQASM version declaration');
    });
    
    it('throws on wrong OPENQASM version', () => {
      const qasm = 'OPENQASM 3.0;\ninclude "qelib1.inc";\nqreg q[1];';
      expect(() => parseQasmToQjsAst(qasm)).toThrow('Unsupported OPENQASM version: 3.0');
    });
    
    it('throws on missing qelib1.inc include', () => {
      const qasm = 'OPENQASM 2.0;\nqreg q[1];';
      expect(() => parseQasmToQjsAst(qasm)).toThrow('Missing qelib1.inc include');
    });
    
    it('throws on missing qreg declaration', () => {
      const qasm = 'OPENQASM 2.0;\ninclude "qelib1.inc";\nh q[0];';
      expect(() => parseQasmToQjsAst(qasm)).toThrow('Missing qreg declaration');
    });
    
    it('throws on invalid qreg size', () => {
      const qasm = 'OPENQASM 2.0;\ninclude "qelib1.inc";\nqreg q[0];';
      expect(() => parseQasmToQjsAst(qasm)).toThrow('Invalid qreg size: 0');
    });
    
    it('throws on malformed qreg declaration', () => {
      const qasm = 'OPENQASM 2.0;\ninclude "qelib1.inc";\nqreg q;';
      expect(() => parseQasmToQjsAst(qasm)).toThrow('Malformed qreg declaration: qreg q;');
    });
  });
  
  describe('single-qubit gate parsing', () => {
    it('parses single Hadamard gate', () => {
      const qasm = 'OPENQASM 2.0;\ninclude "qelib1.inc";\nqreg q[1];\nh q[0];';
      const result = parseQasmToQjsAst(qasm);
      
      expect(result.bandwidth).toBe(1);
      expect(result.timewidth).toBe(1);
      expect(result.operations).toHaveLength(1);
      expect(result.operations[0]).toEqual({
        gate: expect.objectContaining({ symbol: 'H', name: expect.stringMatching(/hadamard/i) }),
        momentIndex: 1,
        registerIndices: [1],
        isControlled: false,
        operationMomentId: null
      });
    });
    
    it('parses single X gate', () => {
      const qasm = 'OPENQASM 2.0;\ninclude "qelib1.inc";\nqreg q[1];\nx q[0];';
      const result = parseQasmToQjsAst(qasm);
      
      expect(result.operations[0]).toEqual({
        gate: expect.objectContaining({ symbol: 'X', name: expect.stringMatching(/pauli.x/i) }),
        momentIndex: 1,
        registerIndices: [1],
        isControlled: false,
        operationMomentId: null
      });
    });
    
    it('parses single Z gate', () => {
      const qasm = 'OPENQASM 2.0;\ninclude "qelib1.inc";\nqreg q[1];\nz q[0];';
      const result = parseQasmToQjsAst(qasm);
      
      expect(result.operations[0]).toEqual({
        gate: expect.objectContaining({ symbol: 'Z', name: expect.stringMatching(/pauli.z/i) }),
        momentIndex: 1,
        registerIndices: [1],
        isControlled: false,
        operationMomentId: null
      });
    });
    
    it('parses sequential gates with incrementing momentIndex', () => {
      const qasm = 'OPENQASM 2.0;\ninclude "qelib1.inc";\nqreg q[1];\nh q[0];\nx q[0];\nz q[0];';
      const result = parseQasmToQjsAst(qasm);
      
      expect(result.timewidth).toBe(3);
      expect(result.operations).toHaveLength(3);
      expect(result.operations.map(op => op.momentIndex)).toEqual([1, 2, 3]);
      expect(result.operations.map(op => op.gate.symbol)).toEqual(['H', 'X', 'Z']);
    });
    
    it('handles QASM 0-indexed to Q.js 1-indexed conversion', () => {
      const qasm = 'OPENQASM 2.0;\ninclude "qelib1.inc";\nqreg q[3];\nh q[0];\nx q[1];\nz q[2];';
      const result = parseQasmToQjsAst(qasm);
      
      expect(result.operations.map(op => op.registerIndices[0])).toEqual([1, 2, 3]);
    });
    
    it('handles gate spacing and semicolons', () => {
      const qasm = 'OPENQASM 2.0;\ninclude "qelib1.inc";\nqreg q[1];\n  h q[0];  \n  x q[0];  ';
      const result = parseQasmToQjsAst(qasm);
      
      expect(result.operations).toHaveLength(2);
      expect(result.operations.map(op => op.gate.symbol)).toEqual(['H', 'X']);
    });
    
    it('validates gate case sensitivity', () => {
      const qasm = 'OPENQASM 2.0;\ninclude "qelib1.inc";\nqreg q[1];\nH q[0];'; // Uppercase H should work
      const result = parseQasmToQjsAst(qasm);
      
      expect(result.operations[0].gate.symbol).toBe('H');
    });
  });
  
  describe('multi-qubit parallel gates', () => {
    it('parses parallel gates with same momentIndex', () => {
      const qasm = 'OPENQASM 2.0;\ninclude "qelib1.inc";\nqreg q[2];\nh q[0];\nx q[1];';
      const result = parseQasmToQjsAst(qasm);
      
      expect(result.bandwidth).toBe(2);
      expect(result.timewidth).toBe(1);
      expect(result.operations).toHaveLength(2);
      expect(result.operations.every(op => op.momentIndex === 1)).toBe(true);
      expect(result.operations.map(op => op.registerIndices[0])).toEqual([1, 2]);
    });
    
    it('parses mixed parallel gates', () => {
      const qasm = 'OPENQASM 2.0;\ninclude "qelib1.inc";\nqreg q[3];\nh q[0];\nx q[1];\nz q[2];';
      const result = parseQasmToQjsAst(qasm);
      
      expect(result.bandwidth).toBe(3);
      expect(result.operations).toHaveLength(3);
      expect(result.operations.every(op => op.momentIndex === 1)).toBe(true);
      expect(result.operations.map(op => op.gate.symbol)).toEqual(['H', 'X', 'Z']);
    });
    
    it('calculates bandwidth from maximum qubit index', () => {
      const qasm = 'OPENQASM 2.0;\ninclude "qelib1.inc";\nqreg q[5];\nh q[4];'; // Only use highest qubit
      const result = parseQasmToQjsAst(qasm);
      
      expect(result.bandwidth).toBe(5);
      expect(result.operations[0].registerIndices[0]).toBe(5); // 1-indexed
    });
    
    it('implements left-pack timing strategy', () => {
      const qasm = 'OPENQASM 2.0;\ninclude "qelib1.inc";\nqreg q[2];\nh q[0];\nx q[1];\nz q[0];'; // H and X parallel, then Z
      const result = parseQasmToQjsAst(qasm);
      
      expect(result.timewidth).toBe(2);
      expect(result.operations).toHaveLength(3);
      
      const hGate = result.operations.find(op => op.gate.symbol === 'H');
      const xGate = result.operations.find(op => op.gate.symbol === 'X');
      const zGate = result.operations.find(op => op.gate.symbol === 'Z');
      
      expect(hGate.momentIndex).toBe(1);
      expect(xGate.momentIndex).toBe(1); // Parallel with H
      expect(zGate.momentIndex).toBe(2); // Sequential after H
    });
    
    it('handles different gate orderings', () => {
      const qasm = 'OPENQASM 2.0;\ninclude "qelib1.inc";\nqreg q[3];\nz q[2];\nh q[0];\nx q[1];';
      const result = parseQasmToQjsAst(qasm);
      
      expect(result.operations).toHaveLength(3);
      expect(result.operations.every(op => op.momentIndex === 1)).toBe(true); // All parallel
    });
  });
  
  describe('controlled gate parsing', () => {
    it('parses CNOT gate', () => {
      const qasm = 'OPENQASM 2.0;\ninclude "qelib1.inc";\nqreg q[2];\ncx q[0], q[1];';
      const result = parseQasmToQjsAst(qasm);
      
      expect(result.operations).toHaveLength(1);
      expect(result.operations[0]).toEqual({
        gate: expect.objectContaining({ symbol: 'X' }),
        momentIndex: 1,
        registerIndices: [2, 1], // [target+1, control+1]
        isControlled: true,
        operationMomentId: null
      });
    });
    
    it('parses CNOT with reversed qubits', () => {
      const qasm = 'OPENQASM 2.0;\ninclude "qelib1.inc";\nqreg q[2];\ncx q[1], q[0];';
      const result = parseQasmToQjsAst(qasm);
      
      expect(result.operations[0]).toEqual({
        gate: expect.objectContaining({ symbol: 'X' }),
        momentIndex: 1,
        registerIndices: [1, 2], // [target+1, control+1]
        isControlled: true,
        operationMomentId: null
      });
    });
    
    it('parses controlled-Z gate', () => {
      const qasm = 'OPENQASM 2.0;\ninclude "qelib1.inc";\nqreg q[2];\ncz q[0], q[1];';
      const result = parseQasmToQjsAst(qasm);
      
      expect(result.operations[0]).toEqual({
        gate: expect.objectContaining({ symbol: 'Z' }),
        momentIndex: 1,
        registerIndices: [2, 1],
        isControlled: true,
        operationMomentId: null
      });
    });
    
    it('parses Bell state circuit', () => {
      const qasm = 'OPENQASM 2.0;\ninclude "qelib1.inc";\nqreg q[2];\nh q[0];\ncx q[0], q[1];';
      const result = parseQasmToQjsAst(qasm);
      
      expect(result.operations).toHaveLength(2);
      
      const hGate = result.operations.find(op => op.gate.symbol === 'H');
      const cxGate = result.operations.find(op => op.gate.symbol === 'X' && op.isControlled);
      
      expect(hGate.momentIndex).toBe(1);
      expect(cxGate.momentIndex).toBe(2);
      expect(cxGate.registerIndices).toEqual([2, 1]);
    });
    
    it('parses GHZ state circuit', () => {
      const qasm = 'OPENQASM 2.0;\ninclude "qelib1.inc";\nqreg q[3];\nh q[0];\ncx q[0], q[1];\ncx q[0], q[2];';
      const result = parseQasmToQjsAst(qasm);
      
      expect(result.operations).toHaveLength(3);
      
      const hGate = result.operations.find(op => op.gate.symbol === 'H');
      const cxGates = result.operations.filter(op => op.gate.symbol === 'X' && op.isControlled);
      
      expect(hGate.momentIndex).toBe(1);
      expect(cxGates).toHaveLength(2);
      expect(cxGates.map(op => op.momentIndex)).toEqual([2, 3]);
    });
    
    it('handles various control qubit combinations', () => {
      const qasm = 'OPENQASM 2.0;\ninclude "qelib1.inc";\nqreg q[4];\ncx q[0], q[3];\ncx q[2], q[1];';
      const result = parseQasmToQjsAst(qasm);
      
      expect(result.operations).toHaveLength(2);
      expect(result.operations[0].registerIndices).toEqual([4, 1]); // target q[3]+1, control q[0]+1
      expect(result.operations[1].registerIndices).toEqual([2, 3]); // target q[1]+1, control q[2]+1
    });
    
    it('validates self-control throws error', () => {
      const qasm = 'OPENQASM 2.0;\ninclude "qelib1.inc";\nqreg q[2];\ncx q[0], q[0];';
      expect(() => parseQasmToQjsAst(qasm)).toThrow('Control and target cannot be the same qubit: 0');
    });
    
    it('handles high-numbered qubits in controlled gates', () => {
      const qasm = 'OPENQASM 2.0;\ninclude "qelib1.inc";\nqreg q[10];\ncx q[7], q[9];';
      const result = parseQasmToQjsAst(qasm);
      
      expect(result.bandwidth).toBe(10);
      expect(result.operations[0].registerIndices).toEqual([10, 8]); // [target+1, control+1]
    });
  });
  
  describe('controlled-H decomposition recognition', () => {
    it('recognizes controlled-H decomposition pattern', () => {
      const qasm = 'OPENQASM 2.0;\ninclude "qelib1.inc";\nqreg q[2];\n' +
                   '// Controlled-H decomposition\n' +
                   'ry(0.25*pi) q[1];\ncx q[0], q[1];\nry(-0.25*pi) q[1];';
      const result = parseQasmToQjsAst(qasm);
      
      expect(result.operations).toHaveLength(1);
      expect(result.operations[0]).toEqual({
        gate: expect.objectContaining({ symbol: 'H' }),
        momentIndex: 1,
        registerIndices: [2, 1], // [target+1, control+1]
        isControlled: true,
        operationMomentId: null
      });
    });
    
    it('recognizes controlled-H with different qubit order', () => {
      const qasm = 'OPENQASM 2.0;\ninclude "qelib1.inc";\nqreg q[2];\n' +
                   '// Controlled-H decomposition\n' +
                   'ry(0.25*pi) q[0];\ncx q[1], q[0];\nry(-0.25*pi) q[0];';
      const result = parseQasmToQjsAst(qasm);
      
      expect(result.operations[0]).toEqual({
        gate: expect.objectContaining({ symbol: 'H' }),
        momentIndex: 1,
        registerIndices: [1, 2], // [target+1, control+1]
        isControlled: true,
        operationMomentId: null
      });
    });
    
    it('handles multiple controlled-H gates', () => {
      const qasm = 'OPENQASM 2.0;\ninclude "qelib1.inc";\nqreg q[3];\n' +
                   '// Controlled-H decomposition\n' +
                   'ry(0.25*pi) q[1];\ncx q[0], q[1];\nry(-0.25*pi) q[1];\n' +
                   '// Controlled-H decomposition\n' +
                   'ry(0.25*pi) q[2];\ncx q[1], q[2];\nry(-0.25*pi) q[2];';
      const result = parseQasmToQjsAst(qasm);
      
      expect(result.operations).toHaveLength(2);
      expect(result.operations.every(op => op.gate.symbol === 'H' && op.isControlled)).toBe(true);
      expect(result.operations.map(op => op.momentIndex)).toEqual([1, 2]);
    });
    
    it('handles controlled-H mixed with other gates', () => {
      const qasm = 'OPENQASM 2.0;\ninclude "qelib1.inc";\nqreg q[2];\n' +
                   'h q[0];\n' +
                   '// Controlled-H decomposition\n' +
                   'ry(0.25*pi) q[1];\ncx q[0], q[1];\nry(-0.25*pi) q[1];\n' +
                   'x q[0];';
      const result = parseQasmToQjsAst(qasm);
      
      expect(result.operations).toHaveLength(3);
      
      const hGate = result.operations.find(op => op.gate.symbol === 'H' && !op.isControlled);
      const controlledH = result.operations.find(op => op.gate.symbol === 'H' && op.isControlled);
      const xGate = result.operations.find(op => op.gate.symbol === 'X');
      
      expect(hGate.momentIndex).toBe(1);
      expect(controlledH.momentIndex).toBe(2);
      expect(xGate.momentIndex).toBe(3);
    });
    
    it('ignores incomplete controlled-H patterns', () => {
      const qasm = 'OPENQASM 2.0;\ninclude "qelib1.inc";\nqreg q[2];\n' +
                   'ry(0.25*pi) q[1];\ncx q[0], q[1];'; // Missing final ry
      const result = parseQasmToQjsAst(qasm);
      
      // Should parse as separate gates, not controlled-H
      expect(result.operations).toHaveLength(1); // Only the cx gate (ry ignored as unsupported)
      expect(result.operations[0].gate.symbol).toBe('X');
      expect(result.operations[0].isControlled).toBe(true);
    });
    
    it('ignores malformed controlled-H patterns', () => {
      const qasm = 'OPENQASM 2.0;\ninclude "qelib1.inc";\nqreg q[2];\n' +
                   'ry(0.5*pi) q[1];\ncx q[0], q[1];\nry(-0.25*pi) q[1];'; // Wrong first angle
      const result = parseQasmToQjsAst(qasm);
      
      // Should parse as separate gates
      expect(result.operations).toHaveLength(1); // Only cx gate
      expect(result.operations[0].gate.symbol).toBe('X');
    });
    
    it('handles case variations in controlled-H comment', () => {
      const variations = [
        '// Controlled-H decomposition',
        '// controlled-h decomposition',
        '// CONTROLLED-H DECOMPOSITION',
        '//Controlled-H decomposition'
      ];
      
      variations.forEach(comment => {
        const qasm = 'OPENQASM 2.0;\ninclude "qelib1.inc";\nqreg q[2];\n' +
                     comment + '\n' +
                     'ry(0.25*pi) q[1];\ncx q[0], q[1];\nry(-0.25*pi) q[1];';
        const result = parseQasmToQjsAst(qasm);
        
        expect(result.operations).toHaveLength(1);
        expect(result.operations[0].gate.symbol).toBe('H');
        expect(result.operations[0].isControlled).toBe(true);
      });
    });
  });
  
  describe('timing and left-pack strategy', () => {
    it('implements left-pack for sequential operations', () => {
      const qasm = 'OPENQASM 2.0;\ninclude "qelib1.inc";\nqreg q[1];\nh q[0];\nx q[0];\nz q[0];';
      const result = parseQasmToQjsAst(qasm);
      
      expect(result.timewidth).toBe(3);
      expect(result.operations.map(op => op.momentIndex)).toEqual([1, 2, 3]);
    });
    
    it('implements left-pack for parallel operations', () => {
      const qasm = 'OPENQASM 2.0;\ninclude "qelib1.inc";\nqreg q[3];\nh q[0];\nx q[1];\nz q[2];';
      const result = parseQasmToQjsAst(qasm);
      
      expect(result.timewidth).toBe(1);
      expect(result.operations.every(op => op.momentIndex === 1)).toBe(true);
    });
    
    it('implements left-pack for mixed patterns', () => {
      const qasm = 'OPENQASM 2.0;\ninclude "qelib1.inc";\nqreg q[2];\nh q[0];\nx q[1];\nz q[0];\nh q[1];';
      const result = parseQasmToQjsAst(qasm);
      
      expect(result.timewidth).toBe(2);
      
      const qubit1Ops = result.operations.filter(op => op.registerIndices[0] === 1);
      const qubit2Ops = result.operations.filter(op => op.registerIndices[0] === 2);
      
      expect(qubit1Ops.map(op => op.momentIndex)).toEqual([1, 2]); // H then Z
      expect(qubit2Ops.map(op => op.momentIndex)).toEqual([1, 2]); // X then H
    });
    
    it('calculates timewidth from operations', () => {
      const qasm = 'OPENQASM 2.0;\ninclude "qelib1.inc";\nqreg q[3];\n' +
                   'h q[0];\nx q[1];\n' + // Moment 1
                   'z q[0];\n' +           // Moment 2
                   'h q[2];';             // Moment 2 (parallel with Z)
      const result = parseQasmToQjsAst(qasm);
      
      expect(result.timewidth).toBe(2);
    });
    
    it('handles controlled gates in left-pack timing', () => {
      const qasm = 'OPENQASM 2.0;\ninclude "qelib1.inc";\nqreg q[3];\n' +
                   'h q[0];\nh q[1];\n' +      // Moment 1
                   'cx q[0], q[2];\n' +        // Moment 2
                   'x q[1];';                  // Moment 2 (parallel with cx)
      const result = parseQasmToQjsAst(qasm);
      
      expect(result.timewidth).toBe(2);
      
      const hGates = result.operations.filter(op => op.gate.symbol === 'H' && !op.isControlled);
      const cxGate = result.operations.find(op => op.isControlled && op.gate.symbol === 'X');
      const xGate = result.operations.find(op => !op.isControlled && op.gate.symbol === 'X');
      
      expect(hGates.every(op => op.momentIndex === 1)).toBe(true);
      expect(cxGate.momentIndex).toBe(2);
      expect(xGate.momentIndex).toBe(2);
    });
  });
  
  describe('complex real-world patterns', () => {
    it('parses Bell state preparation', () => {
      const qasm = 'OPENQASM 2.0;\ninclude "qelib1.inc";\nqreg q[2];\nh q[0];\ncx q[0], q[1];';
      const result = parseQasmToQjsAst(qasm);
      
      expect(result.bandwidth).toBe(2);
      expect(result.operations).toHaveLength(2);
      
      const hGate = result.operations.find(op => op.gate.symbol === 'H');
      const cxGate = result.operations.find(op => op.isControlled);
      
      expect(hGate.momentIndex).toBe(1);
      expect(cxGate.momentIndex).toBe(2);
    });
    
    it('parses quantum Fourier transform with controlled-H', () => {
      const qasm = 'OPENQASM 2.0;\ninclude "qelib1.inc";\nqreg q[2];\n' +
                   'h q[0];\nh q[1];\n' +
                   '// Controlled-H decomposition\n' +
                   'ry(0.25*pi) q[0];\ncx q[1], q[0];\nry(-0.25*pi) q[0];\n' +
                   '// Controlled-H decomposition\n' +
                   'ry(0.25*pi) q[1];\ncx q[0], q[1];\nry(-0.25*pi) q[1];';
      const result = parseQasmToQjsAst(qasm);
      
      expect(result.operations).toHaveLength(4); // 2 H + 2 controlled-H
      
      const hGates = result.operations.filter(op => op.gate.symbol === 'H');
      expect(hGates).toHaveLength(4);
      
      const controlledH = hGates.filter(op => op.isControlled);
      expect(controlledH).toHaveLength(2);
    });
    
    it('parses Grover diffusion operator', () => {
      const qasm = 'OPENQASM 2.0;\ninclude "qelib1.inc";\nqreg q[2];\n' +
                   'h q[0];\nh q[1];\nx q[0];\nx q[1];\nh q[0];\nh q[1];\n' +
                   'cx q[1], q[0];\nh q[0];\nh q[1];\nx q[0];\nx q[1];\nh q[0];\nh q[1];';
      const result = parseQasmToQjsAst(qasm);
      
      expect(result.operations.length).toBeGreaterThan(10);
      
      const hGates = result.operations.filter(op => op.gate.symbol === 'H');
      const xGates = result.operations.filter(op => op.gate.symbol === 'X');
      const cxGates = result.operations.filter(op => op.isControlled);
      
      expect(hGates.length).toBeGreaterThanOrEqual(8); // Fixed: should be >= 8, not > 8
      expect(xGates.length).toBeGreaterThan(4);
      expect(cxGates).toHaveLength(1);
    });
    
    it('parses teleportation protocol', () => {
      const qasm = 'OPENQASM 2.0;\ninclude "qelib1.inc";\nqreg q[3];\n' +
                   'h q[1];\ncx q[1], q[2];\ncx q[0], q[1];\nh q[0];\ncx q[1], q[2];\ncz q[0], q[2];';
      const result = parseQasmToQjsAst(qasm);
      
      expect(result.bandwidth).toBe(3);
      expect(result.operations.length).toBeGreaterThan(5);
      
      const cxGates = result.operations.filter(op => op.isControlled && op.gate.symbol === 'X');
      const czGates = result.operations.filter(op => op.isControlled && op.gate.symbol === 'Z');
      
      expect(cxGates).toHaveLength(3);
      expect(czGates).toHaveLength(1);
    });
  });
  
  describe('AST structure validation', () => {
    it('creates complete Q.js AST structure', () => {
      const qasm = 'OPENQASM 2.0;\ninclude "qelib1.inc";\nqreg q[2];\nh q[0];';
      const result = parseQasmToQjsAst(qasm);
      
      expect(result).toHaveProperty('bandwidth', 2);
      expect(result).toHaveProperty('timewidth', 1);
      expect(result).toHaveProperty('qubits');
      expect(result).toHaveProperty('operations');
      expect(result).toHaveProperty('results');
      expect(result).toHaveProperty('matrix');
      expect(result).toHaveProperty('needsEvaluation');
      expect(result).toHaveProperty('history');
    });
    
    it('initializes qubits array properly', () => {
      const qasm = 'OPENQASM 2.0;\ninclude "qelib1.inc";\nqreg q[3];';
      const result = parseQasmToQjsAst(qasm);
      
      expect(result.qubits).toHaveLength(3);
      result.qubits.forEach(qubit => {
        expect(qubit).toHaveProperty('alpha');
        expect(qubit).toHaveProperty('beta');
      });
    });
    
    it('sets correct default values', () => {
      const qasm = 'OPENQASM 2.0;\ninclude "qelib1.inc";\nqreg q[1];';
      const result = parseQasmToQjsAst(qasm);
      
      expect(result.results).toEqual([]);
      expect(result.matrix).toBe(null);
      expect(result.needsEvaluation).toBe(true);
      expect(result.history).toBeDefined();
    });
    
    it('creates proper gate instances', () => {
      const qasm = 'OPENQASM 2.0;\ninclude "qelib1.inc";\nqreg q[1];\nh q[0];\nx q[0];\nz q[0];';
      const result = parseQasmToQjsAst(qasm);
      
      result.operations.forEach(op => {
        expect(op.gate).toHaveProperty('symbol');
        expect(op.gate).toHaveProperty('name');
        expect(['H', 'X', 'Z']).toContain(op.gate.symbol);
      });
    });
    
    it('sets operationMomentId to null by default', () => {
      const qasm = 'OPENQASM 2.0;\ninclude "qelib1.inc";\nqreg q[2];\nh q[0];\ncx q[0], q[1];';
      const result = parseQasmToQjsAst(qasm);
      
      result.operations.forEach(op => {
        expect(op.operationMomentId).toBe(null);
      });
    });
  });
  
  describe('error cases', () => {
    it('parses Y gate', () => {
      const qasm = 'OPENQASM 2.0;\ninclude "qelib1.inc";\nqreg q[1];\ny q[0];';
      const result = parseQasmToQjsAst(qasm);
      expect(result.operations).toHaveLength(1);
      expect(result.operations[0].gate.symbol).toBe('Y');
    });
    
    it('throws on malformed gate syntax', () => {
      const qasm = 'OPENQASM 2.0;\ninclude "qelib1.inc";\nqreg q[1];\nh q;';
      expect(() => parseQasmToQjsAst(qasm)).toThrow('Malformed gate syntax: h q;');
    });
    
    it('throws on invalid qubit index', () => {
      const qasm = 'OPENQASM 2.0;\ninclude "qelib1.inc";\nqreg q[2];\nh q[2];';
      expect(() => parseQasmToQjsAst(qasm)).toThrow('Invalid qubit index: 2 (circuit has 2 qubits)');
    });
    
    it('throws on negative qubit index', () => {
      const qasm = 'OPENQASM 2.0;\ninclude "qelib1.inc";\nqreg q[2];\nh q[-1];';
      expect(() => parseQasmToQjsAst(qasm)).toThrow('Negative qubit index: -1');
    });
    
    it('throws on malformed controlled gate', () => {
      const qasm = 'OPENQASM 2.0;\ninclude "qelib1.inc";\nqreg q[2];\ncx q[0];';
      expect(() => parseQasmToQjsAst(qasm)).toThrow('Malformed controlled gate: cx q[0];');
    });
    
    it('throws on invalid controlled gate qubit indices', () => {
      const qasm = 'OPENQASM 2.0;\ninclude "qelib1.inc";\nqreg q[2];\ncx q[0], q[3];';
      expect(() => parseQasmToQjsAst(qasm)).toThrow('Invalid qubit index: 3 (circuit has 2 qubits)');
    });
    
    it('handles missing semicolons gracefully', () => {
      const qasm = 'OPENQASM 2.0;\ninclude "qelib1.inc";\nqreg q[1];\nh q[0]'; // Missing semicolon
      const result = parseQasmToQjsAst(qasm);
      
      expect(result.operations).toHaveLength(1);
      expect(result.operations[0].gate.symbol).toBe('H');
    });
  });
  
  describe('boundary conditions', () => {
    it('handles single qubit circuit', () => {
      const qasm = 'OPENQASM 2.0;\ninclude "qelib1.inc";\nqreg q[1];\nh q[0];';
      const result = parseQasmToQjsAst(qasm);
      
      expect(result.bandwidth).toBe(1);
      expect(result.operations).toHaveLength(1);
    });
    
    it('handles maximum reasonable qubits', () => {
      const qasm = 'OPENQASM 2.0;\ninclude "qelib1.inc";\nqreg q[50];\nh q[49];';
      const result = parseQasmToQjsAst(qasm);
      
      expect(result.bandwidth).toBe(50);
      expect(result.operations[0].registerIndices[0]).toBe(50);
    });
    
    it('handles very long gate sequences', () => {
      let qasm = 'OPENQASM 2.0;\ninclude "qelib1.inc";\nqreg q[1];\n';
      for (let i = 0; i < 100; i++) {
        qasm += 'h q[0];\n';
      }
      const result = parseQasmToQjsAst(qasm);
      
      expect(result.operations).toHaveLength(100);
      expect(result.timewidth).toBe(100);
    });
    
    it('handles circuit with only controlled gates', () => {
      const qasm = 'OPENQASM 2.0;\ninclude "qelib1.inc";\nqreg q[3];\ncx q[0], q[1];\ncx q[1], q[2];\ncx q[0], q[2];';
      const result = parseQasmToQjsAst(qasm);
      
      expect(result.operations).toHaveLength(3);
      expect(result.operations.every(op => op.isControlled)).toBe(true);
    });
    
    it('handles empty circuit with only header', () => {
      const qasm = 'OPENQASM 2.0;\ninclude "qelib1.inc";\nqreg q[5];';
      const result = parseQasmToQjsAst(qasm);
      
      expect(result.bandwidth).toBe(5);
      expect(result.timewidth).toBe(0);
      expect(result.operations).toHaveLength(0);
    });
  });
});