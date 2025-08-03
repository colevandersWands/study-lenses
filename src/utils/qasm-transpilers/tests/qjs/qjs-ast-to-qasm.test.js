import { qjsAstToQasm } from '../../src/qjs/qjs-ast-to-qasm.js';

/**
 * Test suite for converting Q.js AST format to OpenQASM 2.0
 * This is the reverse direction of parseQasmToQjsAst
 */

describe('qjsAstToQasm', () => {
  // Helper function to create minimal Q.js AST structure
  function createQjsAst(qubits, operations, bandwidth = null, timewidth = null) {
    return {
      bandwidth: bandwidth || qubits,
      timewidth: timewidth || (operations.length > 0 ? Math.max(...operations.map(op => op.momentIndex)) + 1 : 1),
      qubits: Array.from({ length: qubits }, (_, i) => ({
        x: i,
        y: 0,
        registerIndex: i + 1 // Q.js uses 1-indexed
      })),
      operations: operations,
      results: [],
      matrix: null,
      needsEvaluation: false,
      history: []
    };
  }

  // Helper function to create gate objects
  function createGate(symbol) {
    return {
      symbol: symbol,
      name: symbol.toLowerCase(),
      applyToQubit: expect.any(Function) // Mock function
    };
  }

  describe('empty and basic circuits', () => {
    it('converts empty AST to minimal QASM', () => {
      const ast = createQjsAst(1, []);
      expect(qjsAstToQasm(ast)).toEqual(
        'OPENQASM 2.0;\n' +
        'include "qelib1.inc";\n' +
        'qreg q[1];\n'
      );
    });

    it('converts single qubit with identity operations', () => {
      const ast = createQjsAst(1, []);
      expect(qjsAstToQasm(ast)).toEqual(
        'OPENQASM 2.0;\n' +
        'include "qelib1.inc";\n' +
        'qreg q[1];\n'
      );
    });

    it('converts multi-qubit empty circuit', () => {
      const ast = createQjsAst(3, []);
      expect(qjsAstToQasm(ast)).toEqual(
        'OPENQASM 2.0;\n' +
        'include "qelib1.inc";\n' +
        'qreg q[3];\n'
      );
    });
  });

  describe('single-qubit gates', () => {
    it('converts single Hadamard gate', () => {
      const operations = [{
        gate: createGate('H'),
        momentIndex: 0,
        registerIndices: [1], // 1-indexed qubit
        isControlled: false,
        operationMomentId: null
      }];
      const ast = createQjsAst(1, operations);
      
      expect(qjsAstToQasm(ast)).toEqual(
        'OPENQASM 2.0;\n' +
        'include "qelib1.inc";\n' +
        'qreg q[1];\n' +
        'h q[0];\n'
      );
    });

    it('converts single X gate', () => {
      const operations = [{
        gate: createGate('X'),
        momentIndex: 0,
        registerIndices: [1],
        isControlled: false,
        operationMomentId: null
      }];
      const ast = createQjsAst(1, operations);
      
      expect(qjsAstToQasm(ast)).toEqual(
        'OPENQASM 2.0;\n' +
        'include "qelib1.inc";\n' +
        'qreg q[1];\n' +
        'x q[0];\n'
      );
    });

    it('converts single Z gate', () => {
      const operations = [{
        gate: createGate('Z'),
        momentIndex: 0,
        registerIndices: [1],
        isControlled: false,
        operationMomentId: null
      }];
      const ast = createQjsAst(1, operations);
      
      expect(qjsAstToQasm(ast)).toEqual(
        'OPENQASM 2.0;\n' +
        'include "qelib1.inc";\n' +
        'qreg q[1];\n' +
        'z q[0];\n'
      );
    });

    it('converts sequence of gates on same qubit', () => {
      const operations = [
        {
          gate: createGate('H'),
          momentIndex: 0,
          registerIndices: [1],
          isControlled: false,
          operationMomentId: null
        },
        {
          gate: createGate('X'),
          momentIndex: 1,
          registerIndices: [1],
          isControlled: false,
          operationMomentId: null
        },
        {
          gate: createGate('Z'),
          momentIndex: 2,
          registerIndices: [1],
          isControlled: false,
          operationMomentId: null
        }
      ];
      const ast = createQjsAst(1, operations);
      
      expect(qjsAstToQasm(ast)).toEqual(
        'OPENQASM 2.0;\n' +
        'include "qelib1.inc";\n' +
        'qreg q[1];\n' +
        'h q[0];\n' +
        'x q[0];\n' +
        'z q[0];\n'
      );
    });
  });

  describe('two-qubit circuits', () => {
    it('converts parallel single-qubit gates', () => {
      const operations = [
        {
          gate: createGate('H'),
          momentIndex: 0,
          registerIndices: [1],
          isControlled: false,
          operationMomentId: null
        },
        {
          gate: createGate('X'),
          momentIndex: 0,
          registerIndices: [2],
          isControlled: false,
          operationMomentId: null
        }
      ];
      const ast = createQjsAst(2, operations);
      
      expect(qjsAstToQasm(ast)).toEqual(
        'OPENQASM 2.0;\n' +
        'include "qelib1.inc";\n' +
        'qreg q[2];\n' +
        'h q[0];\n' +
        'x q[1];\n'
      );
    });

    it('converts CNOT gate', () => {
      const operations = [{
        gate: createGate('X'),
        momentIndex: 0,
        registerIndices: [2, 1], // [target+1, control+1] in Q.js format
        isControlled: true,
        operationMomentId: null
      }];
      const ast = createQjsAst(2, operations);
      
      expect(qjsAstToQasm(ast)).toEqual(
        'OPENQASM 2.0;\n' +
        'include "qelib1.inc";\n' +
        'qreg q[2];\n' +
        'cx q[0], q[1];\n'
      );
    });

    it('converts CNOT with reverse control', () => {
      const operations = [{
        gate: createGate('X'),
        momentIndex: 0,
        registerIndices: [1, 2], // [target+1, control+1]
        isControlled: true,
        operationMomentId: null
      }];
      const ast = createQjsAst(2, operations);
      
      expect(qjsAstToQasm(ast)).toEqual(
        'OPENQASM 2.0;\n' +
        'include "qelib1.inc";\n' +
        'qreg q[2];\n' +
        'cx q[1], q[0];\n'
      );
    });

    it('converts controlled-Z gate', () => {
      const operations = [{
        gate: createGate('Z'),
        momentIndex: 0,
        registerIndices: [2, 1], // [target+1, control+1]
        isControlled: true,
        operationMomentId: null
      }];
      const ast = createQjsAst(2, operations);
      
      expect(qjsAstToQasm(ast)).toEqual(
        'OPENQASM 2.0;\n' +
        'include "qelib1.inc";\n' +
        'qreg q[2];\n' +
        'cz q[0], q[1];\n'
      );
    });

    it('converts Bell state preparation', () => {
      const operations = [
        {
          gate: createGate('H'),
          momentIndex: 0,
          registerIndices: [1],
          isControlled: false,
          operationMomentId: null
        },
        {
          gate: createGate('X'),
          momentIndex: 1,
          registerIndices: [2, 1], // [target+1, control+1]
          isControlled: true,
          operationMomentId: null
        }
      ];
      const ast = createQjsAst(2, operations);
      
      expect(qjsAstToQasm(ast)).toEqual(
        'OPENQASM 2.0;\n' +
        'include "qelib1.inc";\n' +
        'qreg q[2];\n' +
        'h q[0];\n' +
        'cx q[0], q[1];\n'
      );
    });
  });

  describe('controlled-H decomposition', () => {
    it('converts controlled-H to QASM decomposition', () => {
      const operations = [{
        gate: createGate('H'),
        momentIndex: 0,
        registerIndices: [2, 1], // [target+1, control+1]
        isControlled: true,
        operationMomentId: null
      }];
      const ast = createQjsAst(2, operations);
      
      expect(qjsAstToQasm(ast)).toEqual(
        'OPENQASM 2.0;\n' +
        'include "qelib1.inc";\n' +
        'qreg q[2];\n' +
        '// Controlled-H decomposition\n' +
        'ry(0.25*pi) q[1];\n' +
        'cx q[0], q[1];\n' +
        'ry(-0.25*pi) q[1];\n'
      );
    });

    it('handles controlled-H with different qubit ordering', () => {
      const operations = [{
        gate: createGate('H'),
        momentIndex: 0,
        registerIndices: [1, 2], // [target+1, control+1]
        isControlled: true,
        operationMomentId: null
      }];
      const ast = createQjsAst(2, operations);
      
      expect(qjsAstToQasm(ast)).toEqual(
        'OPENQASM 2.0;\n' +
        'include "qelib1.inc";\n' +
        'qreg q[2];\n' +
        '// Controlled-H decomposition\n' +
        'ry(0.25*pi) q[0];\n' +
        'cx q[1], q[0];\n' +
        'ry(-0.25*pi) q[0];\n'
      );
    });

    it('handles multiple controlled-H gates', () => {
      const operations = [
        {
          gate: createGate('H'),
          momentIndex: 0,
          registerIndices: [2, 1], // H controlled by qubit 0 applied to qubit 1
          isControlled: true,
          operationMomentId: null
        },
        {
          gate: createGate('H'),
          momentIndex: 1,
          registerIndices: [1, 2], // H controlled by qubit 1 applied to qubit 0
          isControlled: true,
          operationMomentId: null
        }
      ];
      const ast = createQjsAst(2, operations);
      
      expect(qjsAstToQasm(ast)).toEqual(
        'OPENQASM 2.0;\n' +
        'include "qelib1.inc";\n' +
        'qreg q[2];\n' +
        '// Controlled-H decomposition\n' +
        'ry(0.25*pi) q[1];\n' +
        'cx q[0], q[1];\n' +
        'ry(-0.25*pi) q[1];\n' +
        '// Controlled-H decomposition\n' +
        'ry(0.25*pi) q[0];\n' +
        'cx q[1], q[0];\n' +
        'ry(-0.25*pi) q[0];\n'
      );
    });
  });

  describe('three-qubit circuits', () => {
    it('converts GHZ state preparation', () => {
      const operations = [
        {
          gate: createGate('H'),
          momentIndex: 0,
          registerIndices: [1],
          isControlled: false,
          operationMomentId: null
        },
        {
          gate: createGate('X'),
          momentIndex: 1,
          registerIndices: [2, 1], // CNOT: control=0, target=1
          isControlled: true,
          operationMomentId: null
        },
        {
          gate: createGate('X'),
          momentIndex: 2,
          registerIndices: [3, 1], // CNOT: control=0, target=2
          isControlled: true,
          operationMomentId: null
        }
      ];
      const ast = createQjsAst(3, operations);
      
      expect(qjsAstToQasm(ast)).toEqual(
        'OPENQASM 2.0;\n' +
        'include "qelib1.inc";\n' +
        'qreg q[3];\n' +
        'h q[0];\n' +
        'cx q[0], q[1];\n' +
        'cx q[0], q[2];\n'
      );
    });

    it('converts mixed parallel and controlled operations', () => {
      const operations = [
        {
          gate: createGate('H'),
          momentIndex: 0,
          registerIndices: [1],
          isControlled: false,
          operationMomentId: null
        },
        {
          gate: createGate('X'),
          momentIndex: 0,
          registerIndices: [2],
          isControlled: false,
          operationMomentId: null
        },
        {
          gate: createGate('Z'),
          momentIndex: 0,
          registerIndices: [3],
          isControlled: false,
          operationMomentId: null
        },
        {
          gate: createGate('X'),
          momentIndex: 1,
          registerIndices: [3, 2], // CNOT: control=1, target=2
          isControlled: true,
          operationMomentId: null
        }
      ];
      const ast = createQjsAst(3, operations);
      
      expect(qjsAstToQasm(ast)).toEqual(
        'OPENQASM 2.0;\n' +
        'include "qelib1.inc";\n' +
        'qreg q[3];\n' +
        'h q[0];\n' +
        'x q[1];\n' +
        'z q[2];\n' +
        'cx q[1], q[2];\n'
      );
    });
  });

  describe('timing and moment ordering', () => {
    it('respects moment ordering for sequential operations', () => {
      const operations = [
        {
          gate: createGate('H'),
          momentIndex: 2, // Later moment
          registerIndices: [1],
          isControlled: false,
          operationMomentId: null
        },
        {
          gate: createGate('X'),
          momentIndex: 0, // Earlier moment
          registerIndices: [1],
          isControlled: false,
          operationMomentId: null
        },
        {
          gate: createGate('Z'),
          momentIndex: 1, // Middle moment
          registerIndices: [1],
          isControlled: false,
          operationMomentId: null
        }
      ];
      const ast = createQjsAst(1, operations);
      
      expect(qjsAstToQasm(ast)).toEqual(
        'OPENQASM 2.0;\n' +
        'include "qelib1.inc";\n' +
        'qreg q[1];\n' +
        'x q[0];\n' +
        'z q[0];\n' +
        'h q[0];\n'
      );
    });

    it('handles operations in same moment across different qubits', () => {
      const operations = [
        {
          gate: createGate('H'),
          momentIndex: 0,
          registerIndices: [1],
          isControlled: false,
          operationMomentId: null
        },
        {
          gate: createGate('X'),
          momentIndex: 0,
          registerIndices: [2],
          isControlled: false,
          operationMomentId: null
        },
        {
          gate: createGate('Z'),
          momentIndex: 1,
          registerIndices: [1],
          isControlled: false,
          operationMomentId: null
        }
      ];
      const ast = createQjsAst(2, operations);
      
      expect(qjsAstToQasm(ast)).toEqual(
        'OPENQASM 2.0;\n' +
        'include "qelib1.inc";\n' +
        'qreg q[2];\n' +
        'h q[0];\n' +
        'x q[1];\n' +
        'z q[0];\n'
      );
    });

    it('handles sparse moment indices', () => {
      const operations = [
        {
          gate: createGate('H'),
          momentIndex: 0,
          registerIndices: [1],
          isControlled: false,
          operationMomentId: null
        },
        {
          gate: createGate('X'),
          momentIndex: 5, // Large gap
          registerIndices: [1],
          isControlled: false,
          operationMomentId: null
        }
      ];
      const ast = createQjsAst(1, operations);
      
      expect(qjsAstToQasm(ast)).toEqual(
        'OPENQASM 2.0;\n' +
        'include "qelib1.inc";\n' +
        'qreg q[1];\n' +
        'h q[0];\n' +
        'x q[0];\n'
      );
    });
  });

  describe('complex quantum algorithms', () => {
    it('converts quantum Fourier transform pattern', () => {
      const operations = [
        // H q[0]
        {
          gate: createGate('H'),
          momentIndex: 0,
          registerIndices: [1],
          isControlled: false,
          operationMomentId: null
        },
        // H q[1]
        {
          gate: createGate('H'),
          momentIndex: 1,
          registerIndices: [2],
          isControlled: false,
          operationMomentId: null
        },
        // Controlled-H: control=1, target=0
        {
          gate: createGate('H'),
          momentIndex: 2,
          registerIndices: [1, 2], // [target+1, control+1]
          isControlled: true,
          operationMomentId: null
        },
        // Controlled-H: control=0, target=1
        {
          gate: createGate('H'),
          momentIndex: 3,
          registerIndices: [2, 1], // [target+1, control+1]
          isControlled: true,
          operationMomentId: null
        }
      ];
      const ast = createQjsAst(2, operations);
      
      expect(qjsAstToQasm(ast)).toEqual(
        'OPENQASM 2.0;\n' +
        'include "qelib1.inc";\n' +
        'qreg q[2];\n' +
        'h q[0];\n' +
        'h q[1];\n' +
        '// Controlled-H decomposition\n' +
        'ry(0.25*pi) q[0];\n' +
        'cx q[1], q[0];\n' +
        'ry(-0.25*pi) q[0];\n' +
        '// Controlled-H decomposition\n' +
        'ry(0.25*pi) q[1];\n' +
        'cx q[0], q[1];\n' +
        'ry(-0.25*pi) q[1];\n'
      );
    });

    it('converts Grover diffusion operator', () => {
      const operations = [
        // Initial H gates
        { gate: createGate('H'), momentIndex: 0, registerIndices: [1], isControlled: false, operationMomentId: null },
        { gate: createGate('H'), momentIndex: 0, registerIndices: [2], isControlled: false, operationMomentId: null },
        // X gates
        { gate: createGate('X'), momentIndex: 1, registerIndices: [1], isControlled: false, operationMomentId: null },
        { gate: createGate('X'), momentIndex: 1, registerIndices: [2], isControlled: false, operationMomentId: null },
        // H gates
        { gate: createGate('H'), momentIndex: 2, registerIndices: [1], isControlled: false, operationMomentId: null },
        { gate: createGate('H'), momentIndex: 2, registerIndices: [2], isControlled: false, operationMomentId: null },
        // CNOT
        { gate: createGate('X'), momentIndex: 3, registerIndices: [1, 2], isControlled: true, operationMomentId: null },
        // H gates
        { gate: createGate('H'), momentIndex: 4, registerIndices: [1], isControlled: false, operationMomentId: null },
        { gate: createGate('H'), momentIndex: 4, registerIndices: [2], isControlled: false, operationMomentId: null },
        // X gates
        { gate: createGate('X'), momentIndex: 5, registerIndices: [1], isControlled: false, operationMomentId: null },
        { gate: createGate('X'), momentIndex: 5, registerIndices: [2], isControlled: false, operationMomentId: null },
        // Final H gates
        { gate: createGate('H'), momentIndex: 6, registerIndices: [1], isControlled: false, operationMomentId: null },
        { gate: createGate('H'), momentIndex: 6, registerIndices: [2], isControlled: false, operationMomentId: null }
      ];
      const ast = createQjsAst(2, operations);
      
      expect(qjsAstToQasm(ast)).toEqual(
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
        'h q[1];\n' +
        'x q[0];\n' +
        'x q[1];\n' +
        'h q[0];\n' +
        'h q[1];\n'
      );
    });

    it('converts SWAP circuit using CNOTs', () => {
      const operations = [
        {
          gate: createGate('X'),
          momentIndex: 0,
          registerIndices: [1, 2], // CNOT: control=1, target=0
          isControlled: true,
          operationMomentId: null
        },
        {
          gate: createGate('X'),
          momentIndex: 1,
          registerIndices: [2, 1], // CNOT: control=0, target=1
          isControlled: true,
          operationMomentId: null
        },
        {
          gate: createGate('X'),
          momentIndex: 2,
          registerIndices: [1, 2], // CNOT: control=1, target=0
          isControlled: true,
          operationMomentId: null
        }
      ];
      const ast = createQjsAst(2, operations);
      
      expect(qjsAstToQasm(ast)).toEqual(
        'OPENQASM 2.0;\n' +
        'include "qelib1.inc";\n' +
        'qreg q[2];\n' +
        'cx q[1], q[0];\n' +
        'cx q[0], q[1];\n' +
        'cx q[1], q[0];\n'
      );
    });
  });

  describe('edge cases and validation', () => {
    it('handles AST with no operations', () => {
      const ast = createQjsAst(1, []);
      expect(qjsAstToQasm(ast)).toEqual(
        'OPENQASM 2.0;\n' +
        'include "qelib1.inc";\n' +
        'qreg q[1];\n'
      );
    });

    it('handles large qubit count', () => {
      const operations = [
        {
          gate: createGate('H'),
          momentIndex: 0,
          registerIndices: [10], // 10th qubit (9 in QASM)
          isControlled: false,
          operationMomentId: null
        }
      ];
      const ast = createQjsAst(10, operations);
      
      const result = qjsAstToQasm(ast);
      expect(result).toContain('qreg q[10];');
      expect(result).toContain('h q[9];');
    });

    it('handles operations with same moment but different qubits', () => {
      const operations = [
        {
          gate: createGate('H'),
          momentIndex: 0,
          registerIndices: [1],
          isControlled: false,
          operationMomentId: null
        },
        {
          gate: createGate('X'),
          momentIndex: 0,
          registerIndices: [3],
          isControlled: false,
          operationMomentId: null
        },
        {
          gate: createGate('Z'),
          momentIndex: 0,
          registerIndices: [2],
          isControlled: false,
          operationMomentId: null
        }
      ];
      const ast = createQjsAst(3, operations);
      
      expect(qjsAstToQasm(ast)).toEqual(
        'OPENQASM 2.0;\n' +
        'include "qelib1.inc";\n' +
        'qreg q[3];\n' +
        'h q[0];\n' +
        'z q[1];\n' +
        'x q[2];\n'
      );
    });

    it('throws error for invalid gate type', () => {
      const operations = [{
        gate: createGate('INVALID'),
        momentIndex: 0,
        registerIndices: [1],
        isControlled: false,
        operationMomentId: null
      }];
      const ast = createQjsAst(1, operations);
      
      expect(() => qjsAstToQasm(ast)).toThrow('Unsupported gate type: INVALID');
    });

    it('throws error for missing gate object', () => {
      const operations = [{
        gate: null,
        momentIndex: 0,
        registerIndices: [1],
        isControlled: false,
        operationMomentId: null
      }];
      const ast = createQjsAst(1, operations);
      
      expect(() => qjsAstToQasm(ast)).toThrow('Invalid operation: missing gate');
    });

    it('throws error for invalid qubit indices', () => {
      const operations = [{
        gate: createGate('H'),
        momentIndex: 0,
        registerIndices: [0], // Invalid: Q.js should use 1-indexed
        isControlled: false,
        operationMomentId: null
      }];
      const ast = createQjsAst(1, operations);
      
      expect(() => qjsAstToQasm(ast)).toThrow('Invalid qubit index: 0 (Q.js uses 1-indexed)');
    });

    it('throws error for qubit index exceeding circuit size', () => {
      const operations = [{
        gate: createGate('H'),
        momentIndex: 0,
        registerIndices: [3], // Too high for 2-qubit circuit
        isControlled: false,
        operationMomentId: null
      }];
      const ast = createQjsAst(2, operations);
      
      expect(() => qjsAstToQasm(ast)).toThrow('Qubit index 3 exceeds circuit size (2 qubits)');
    });

    it('throws error for malformed controlled gate', () => {
      const operations = [{
        gate: createGate('X'),
        momentIndex: 0,
        registerIndices: [1], // Missing control qubit for controlled gate
        isControlled: true,
        operationMomentId: null
      }];
      const ast = createQjsAst(2, operations);
      
      expect(() => qjsAstToQasm(ast)).toThrow('Controlled gate must have exactly 2 qubits');
    });
  });

  describe('AST structure validation', () => {
    it('throws error for missing qubits array', () => {
      const ast = {
        bandwidth: 1,
        timewidth: 1,
        operations: [],
        results: [],
        matrix: null,
        needsEvaluation: false,
        history: []
      };
      
      expect(() => qjsAstToQasm(ast)).toThrow('Invalid Q.js AST: missing qubits array');
    });

    it('throws error for missing operations array', () => {
      const ast = {
        bandwidth: 1,
        timewidth: 1,
        qubits: [{ x: 0, y: 0, registerIndex: 1 }],
        results: [],
        matrix: null,
        needsEvaluation: false,
        history: []
      };
      
      expect(() => qjsAstToQasm(ast)).toThrow('Invalid Q.js AST: missing operations array');
    });

    it('throws error for bandwidth mismatch', () => {
      const ast = createQjsAst(2, []);
      ast.bandwidth = 3; // Mismatch with actual qubit count
      
      expect(() => qjsAstToQasm(ast)).toThrow('AST bandwidth (3) does not match qubit count (2)');
    });

    it('handles AST with extra properties gracefully', () => {
      const ast = createQjsAst(1, []);
      ast.extraProperty = 'should be ignored';
      ast.customData = { nested: 'object' };
      
      expect(qjsAstToQasm(ast)).toEqual(
        'OPENQASM 2.0;\n' +
        'include "qelib1.inc";\n' +
        'qreg q[1];\n'
      );
    });
  });
});