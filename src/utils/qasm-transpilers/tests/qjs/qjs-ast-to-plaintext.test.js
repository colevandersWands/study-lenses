import { qjsAstToText } from '../../src/qjs/qjs-ast-to-plaintext.js';

describe('qjsAstToText', () => {
  
  // Helper function to create minimal AST structure
  function createMinimalAst(bandwidth = 1, timewidth = 0, operations = []) {
    return {
      bandwidth,
      timewidth,
      qubits: Array(bandwidth).fill({ 
        alpha: { real: 1, imaginary: 0 }, 
        beta: { real: 0, imaginary: 0 } 
      }),
      operations,
      results: [],
      matrix: null,
      needsEvaluation: true,
      history: {}
    };
  }
  
  // Helper function to create gate objects
  function createGate(symbol, name) {
    return { symbol, name, symbolDisplay: symbol };
  }
  
  describe('empty and minimal ASTs', () => {
    it('converts empty AST to empty output', () => {
      const ast = createMinimalAst(1, 0, []);
      const result = qjsAstToText(ast);
      expect(result).toBe('\nI'); // Single qubit with no operations shows identity
    });
    
    it('converts AST with no operations', () => {
      const ast = createMinimalAst(2, 0, []);
      const result = qjsAstToText(ast);
      expect(result).toBe('\nI\nI'); // Two qubits with no operations show identities
    });
    
    it('handles AST with identity-only timewidth', () => {
      const ast = createMinimalAst(1, 3, []); // 3 moments but no operations
      const result = qjsAstToText(ast);
      expect(result).toBe('\nI-I-I'); // Should show identity gates for timing
    });
  });
  
  describe('single-qubit operations', () => {
    it('converts single H gate', () => {
      const ast = createMinimalAst(1, 1, [
        {
          gate: createGate('H', 'Hadamard'),
          momentIndex: 1,
          registerIndices: [1],
          isControlled: false,
          operationMomentId: null
        }
      ]);
      const result = qjsAstToText(ast);
      expect(result).toBe('\nH');
    });
    
    it('converts single X gate', () => {
      const ast = createMinimalAst(1, 1, [
        {
          gate: createGate('X', 'Pauli X'),
          momentIndex: 1,
          registerIndices: [1],
          isControlled: false,
          operationMomentId: null
        }
      ]);
      const result = qjsAstToText(ast);
      expect(result).toBe('\nX');
    });
    
    it('converts single Z gate', () => {
      const ast = createMinimalAst(1, 1, [
        {
          gate: createGate('Z', 'Pauli Z'),
          momentIndex: 1,
          registerIndices: [1],
          isControlled: false,
          operationMomentId: null
        }
      ]);
      const result = qjsAstToText(ast);
      expect(result).toBe('\nZ');
    });
    
    it('converts H-X sequence', () => {
      const ast = createMinimalAst(1, 2, [
        {
          gate: createGate('H', 'Hadamard'),
          momentIndex: 1,
          registerIndices: [1],
          isControlled: false,
          operationMomentId: null
        },
        {
          gate: createGate('X', 'Pauli X'),
          momentIndex: 2,
          registerIndices: [1],
          isControlled: false,
          operationMomentId: null
        }
      ]);
      const result = qjsAstToText(ast);
      expect(result).toBe('\nH-X');
    });
    
    it('converts H-X-Z sequence', () => {
      const ast = createMinimalAst(1, 3, [
        {
          gate: createGate('H', 'Hadamard'),
          momentIndex: 1,
          registerIndices: [1],
          isControlled: false,
          operationMomentId: null
        },
        {
          gate: createGate('X', 'Pauli X'),
          momentIndex: 2,
          registerIndices: [1],
          isControlled: false,
          operationMomentId: null
        },
        {
          gate: createGate('Z', 'Pauli Z'),
          momentIndex: 3,
          registerIndices: [1],
          isControlled: false,
          operationMomentId: null
        }
      ]);
      const result = qjsAstToText(ast);
      expect(result).toBe('\nH-X-Z');
    });
  });
  
  describe('timing and spacing', () => {
    it('handles timing gaps with identity padding', () => {
      const ast = createMinimalAst(1, 4, [
        {
          gate: createGate('H', 'Hadamard'),
          momentIndex: 1,
          registerIndices: [1],
          isControlled: false,
          operationMomentId: null
        },
        {
          gate: createGate('X', 'Pauli X'),
          momentIndex: 4,
          registerIndices: [1],
          isControlled: false,
          operationMomentId: null
        }
      ]);
      const result = qjsAstToText(ast);
      expect(result).toBe('\nH-I-I-X');
    });
    
    it('handles leading timing gaps', () => {
      const ast = createMinimalAst(1, 4, [
        {
          gate: createGate('H', 'Hadamard'),
          momentIndex: 4,
          registerIndices: [1],
          isControlled: false,
          operationMomentId: null
        }
      ]);
      const result = qjsAstToText(ast);
      expect(result).toBe('\nI-I-I-H');
    });
    
    it('handles trailing timing gaps', () => {
      const ast = createMinimalAst(1, 4, [
        {
          gate: createGate('H', 'Hadamard'),
          momentIndex: 1,
          registerIndices: [1],
          isControlled: false,
          operationMomentId: null
        }
      ]);
      const result = qjsAstToText(ast);
      expect(result).toBe('\nH-I-I-I');
    });
    
    it('handles makeAllMomentsEqualWidth parameter', () => {
      const ast = createMinimalAst(1, 2, [
        {
          gate: createGate('H', 'Hadamard'),
          momentIndex: 1,
          registerIndices: [1],
          isControlled: false,
          operationMomentId: null
        },
        {
          gate: createGate('X', 'Pauli X'),
          momentIndex: 2,
          registerIndices: [1],
          isControlled: false,
          operationMomentId: null
        }
      ]);
      
      const normalResult = qjsAstToText(ast, false);
      const equalWidthResult = qjsAstToText(ast, true);
      
      // Both should have same content but potentially different spacing
      expect(normalResult).toContain('H');
      expect(normalResult).toContain('X');
      expect(equalWidthResult).toContain('H');
      expect(equalWidthResult).toContain('X');
    });
  });
  
  describe('multi-qubit circuits', () => {
    it('converts parallel gates on different qubits', () => {
      const ast = createMinimalAst(2, 1, [
        {
          gate: createGate('H', 'Hadamard'),
          momentIndex: 1,
          registerIndices: [1],
          isControlled: false,
          operationMomentId: null
        },
        {
          gate: createGate('X', 'Pauli X'),
          momentIndex: 1,
          registerIndices: [2],
          isControlled: false,
          operationMomentId: null
        }
      ]);
      const result = qjsAstToText(ast);
      expect(result).toBe('\nH\nX');
    });
    
    it('converts three-qubit parallel gates', () => {
      const ast = createMinimalAst(3, 1, [
        {
          gate: createGate('H', 'Hadamard'),
          momentIndex: 1,
          registerIndices: [1],
          isControlled: false,
          operationMomentId: null
        },
        {
          gate: createGate('X', 'Pauli X'),
          momentIndex: 1,
          registerIndices: [2],
          isControlled: false,
          operationMomentId: null
        },
        {
          gate: createGate('Z', 'Pauli Z'),
          momentIndex: 1,
          registerIndices: [3],
          isControlled: false,
          operationMomentId: null
        }
      ]);
      const result = qjsAstToText(ast);
      expect(result).toBe('\nH\nX\nZ');
    });
    
    it('handles mixed timing across qubits', () => {
      const ast = createMinimalAst(2, 2, [
        {
          gate: createGate('H', 'Hadamard'),
          momentIndex: 1,
          registerIndices: [1],
          isControlled: false,
          operationMomentId: null
        },
        {
          gate: createGate('X', 'Pauli X'),
          momentIndex: 2,
          registerIndices: [1],
          isControlled: false,
          operationMomentId: null
        },
        {
          gate: createGate('Z', 'Pauli Z'),
          momentIndex: 1,
          registerIndices: [2],
          isControlled: false,
          operationMomentId: null
        }
      ]);
      const result = qjsAstToText(ast);
      expect(result).toBe('\nH-X\nZ-I'); // Second qubit has identity at moment 2
    });
    
    it('handles sparse operation patterns', () => {
      const ast = createMinimalAst(3, 3, [
        {
          gate: createGate('H', 'Hadamard'),
          momentIndex: 1,
          registerIndices: [1],
          isControlled: false,
          operationMomentId: null
        },
        {
          gate: createGate('X', 'Pauli X'),
          momentIndex: 3,
          registerIndices: [1],
          isControlled: false,
          operationMomentId: null
        },
        {
          gate: createGate('Z', 'Pauli Z'),
          momentIndex: 2,
          registerIndices: [3],
          isControlled: false,
          operationMomentId: null
        }
      ]);
      const result = qjsAstToText(ast);
      expect(result).toBe('\nH-I-X\nI-I-I\nI-Z-I');
    });
    
    it('handles different numbers of operations per qubit', () => {
      const ast = createMinimalAst(2, 4, [
        {
          gate: createGate('H', 'Hadamard'),
          momentIndex: 1,
          registerIndices: [1],
          isControlled: false,
          operationMomentId: null
        },
        {
          gate: createGate('X', 'Pauli X'),
          momentIndex: 2,
          registerIndices: [1],
          isControlled: false,
          operationMomentId: null
        },
        {
          gate: createGate('Z', 'Pauli Z'),
          momentIndex: 3,
          registerIndices: [1],
          isControlled: false,
          operationMomentId: null
        },
        {
          gate: createGate('H', 'Hadamard'),
          momentIndex: 4,
          registerIndices: [1],
          isControlled: false,
          operationMomentId: null
        },
        {
          gate: createGate('Z', 'Pauli Z'),
          momentIndex: 2,
          registerIndices: [2],
          isControlled: false,
          operationMomentId: null
        }
      ]);
      const result = qjsAstToText(ast);
      expect(result).toBe('\nH-X-Z-H\nI-Z-I-I');
    });
  });
  
  describe('controlled gates', () => {
    it('converts controlled-X gate (CNOT)', () => {
      const ast = createMinimalAst(2, 1, [
        {
          gate: createGate('X', 'Pauli X'),
          momentIndex: 1,
          registerIndices: [2, 1], // target qubit 2, control qubit 1
          isControlled: true,
          operationMomentId: null
        }
      ]);
      const result = qjsAstToText(ast);
      expect(result).toBe('\nI\nX#0'); // Control from qubit 0 (0-indexed in display)
    });
    
    it('converts controlled-H gate', () => {
      const ast = createMinimalAst(2, 1, [
        {
          gate: createGate('H', 'Hadamard'),
          momentIndex: 1,
          registerIndices: [2, 1], // target qubit 2, control qubit 1  
          isControlled: true,
          operationMomentId: null
        }
      ]);
      const result = qjsAstToText(ast);
      expect(result).toBe('\nI\nH#0');
    });
    
    it('converts controlled-Z gate', () => {
      const ast = createMinimalAst(2, 1, [
        {
          gate: createGate('Z', 'Pauli Z'),
          momentIndex: 1,
          registerIndices: [2, 1],
          isControlled: true,
          operationMomentId: null
        }
      ]);
      const result = qjsAstToText(ast);
      expect(result).toBe('\nI\nZ#0');
    });
    
    it('converts Bell state AST', () => {
      const ast = createMinimalAst(2, 2, [
        {
          gate: createGate('H', 'Hadamard'),
          momentIndex: 1,
          registerIndices: [1],
          isControlled: false,
          operationMomentId: null
        },
        {
          gate: createGate('X', 'Pauli X'),
          momentIndex: 2,
          registerIndices: [2, 1], // CNOT from qubit 1 to qubit 2
          isControlled: true,
          operationMomentId: null
        }
      ]);
      const result = qjsAstToText(ast);
      expect(result).toBe('\nH-I\nI-X#0');
    });
    
    it('converts GHZ state AST', () => {
      const ast = createMinimalAst(3, 3, [
        {
          gate: createGate('H', 'Hadamard'),
          momentIndex: 1,
          registerIndices: [1],
          isControlled: false,
          operationMomentId: null
        },
        {
          gate: createGate('X', 'Pauli X'),
          momentIndex: 2,
          registerIndices: [2, 1],
          isControlled: true,
          operationMomentId: null
        },
        {
          gate: createGate('X', 'Pauli X'),
          momentIndex: 3,
          registerIndices: [3, 1],
          isControlled: true,
          operationMomentId: null
        }
      ]);
      const result = qjsAstToText(ast);
      expect(result).toBe('\nH-I-I\nI-X#0-I\nI-I-X#0');
    });
    
    it('handles control from higher-numbered qubit', () => {
      const ast = createMinimalAst(2, 1, [
        {
          gate: createGate('X', 'Pauli X'),
          momentIndex: 1,
          registerIndices: [1, 2], // target qubit 1, control qubit 2
          isControlled: true,
          operationMomentId: null
        }
      ]);
      const result = qjsAstToText(ast);
      expect(result).toBe('\nX#1\nI'); // Control from qubit 1 (0-indexed becomes 1)
    });
    
    it('handles multiple controlled gates', () => {
      const ast = createMinimalAst(3, 2, [
        {
          gate: createGate('X', 'Pauli X'),
          momentIndex: 1,
          registerIndices: [2, 1],
          isControlled: true,
          operationMomentId: null
        },
        {
          gate: createGate('Z', 'Pauli Z'),
          momentIndex: 2,
          registerIndices: [3, 1],
          isControlled: true,
          operationMomentId: null
        }
      ]);
      const result = qjsAstToText(ast);
      expect(result).toBe('\nI-I\nX#0-I\nI-Z#0');
    });
    
    it('handles same control qubit for multiple targets', () => {
      const ast = createMinimalAst(3, 2, [
        {
          gate: createGate('X', 'Pauli X'),
          momentIndex: 1,
          registerIndices: [2, 1], // control qubit 1, target qubit 2
          isControlled: true,
          operationMomentId: null
        },
        {
          gate: createGate('X', 'Pauli X'),
          momentIndex: 2,
          registerIndices: [3, 1], // control qubit 1, target qubit 3
          isControlled: true,
          operationMomentId: null
        }
      ]);
      const result = qjsAstToText(ast);
      expect(result).toBe('\nI-I\nX#0-I\nI-X#0');
    });
  });
  
  describe('complex real-world patterns', () => {
    it('converts quantum Fourier transform AST', () => {
      const ast = createMinimalAst(2, 5, [
        {
          gate: createGate('H', 'Hadamard'),
          momentIndex: 1,
          registerIndices: [1],
          isControlled: false,
          operationMomentId: null
        },
        {
          gate: createGate('H', 'Hadamard'),
          momentIndex: 2,
          registerIndices: [2],
          isControlled: false,
          operationMomentId: null
        },
        {
          gate: createGate('H', 'Hadamard'),
          momentIndex: 3,
          registerIndices: [1, 2], // controlled H
          isControlled: true,
          operationMomentId: null
        },
        {
          gate: createGate('H', 'Hadamard'),
          momentIndex: 4,
          registerIndices: [2, 1], // controlled H  
          isControlled: true,
          operationMomentId: null
        }
      ]);
      const result = qjsAstToText(ast);
      expect(result).toContain('H');
      expect(result).toContain('#');
    });
    
    it('converts Grover diffusion operator AST', () => {
      const ast = createMinimalAst(2, 7, [
        // H gates on both qubits
        {
          gate: createGate('H', 'Hadamard'),
          momentIndex: 1,
          registerIndices: [1],
          isControlled: false,
          operationMomentId: null
        },
        {
          gate: createGate('H', 'Hadamard'),
          momentIndex: 1,
          registerIndices: [2],
          isControlled: false,
          operationMomentId: null
        },
        // X gates
        {
          gate: createGate('X', 'Pauli X'),
          momentIndex: 2,
          registerIndices: [1],
          isControlled: false,
          operationMomentId: null
        },
        {
          gate: createGate('X', 'Pauli X'),
          momentIndex: 2,
          registerIndices: [2],
          isControlled: false,
          operationMomentId: null
        },
        // More H gates
        {
          gate: createGate('H', 'Hadamard'),
          momentIndex: 3,
          registerIndices: [1],
          isControlled: false,
          operationMomentId: null
        },
        {
          gate: createGate('H', 'Hadamard'),
          momentIndex: 3,
          registerIndices: [2],
          isControlled: false,
          operationMomentId: null
        },
        // Controlled gate
        {
          gate: createGate('X', 'Pauli X'),
          momentIndex: 4,
          registerIndices: [1, 2],
          isControlled: true,
          operationMomentId: null
        }
      ]);
      const result = qjsAstToText(ast);
      expect(result).toContain('H-X-H');
      expect(result).toContain('#');
    });
    
    it('converts teleportation protocol AST', () => {
      const ast = createMinimalAst(3, 6, [
        {
          gate: createGate('H', 'Hadamard'),
          momentIndex: 1,
          registerIndices: [2],
          isControlled: false,
          operationMomentId: null
        },
        {
          gate: createGate('X', 'Pauli X'),
          momentIndex: 2,
          registerIndices: [3, 2],
          isControlled: true,
          operationMomentId: null
        },
        {
          gate: createGate('X', 'Pauli X'),
          momentIndex: 3,
          registerIndices: [2, 1],
          isControlled: true,
          operationMomentId: null
        },
        {
          gate: createGate('H', 'Hadamard'),
          momentIndex: 4,
          registerIndices: [1],
          isControlled: false,
          operationMomentId: null
        }
      ]);
      const result = qjsAstToText(ast);
      expect(result).toContain('H');
      expect(result).toContain('X#');
    });
  });
  
  describe('registerIndices interpretation', () => {
    it('handles sparse registerIndices arrays', () => {
      const ast = createMinimalAst(4, 1, [
        {
          gate: createGate('X', 'Pauli X'),
          momentIndex: 1,
          registerIndices: [, , 3, 1], // sparse array: target=3, control=1
          isControlled: true,
          operationMomentId: null
        }
      ]);
      const result = qjsAstToText(ast);
      expect(result).toContain('X#0'); // Control from qubit 0 (1-indexed becomes 0-indexed)
    });
    
    it('handles various registerIndices patterns', () => {
      const ast = createMinimalAst(3, 3, [
        {
          gate: createGate('X', 'Pauli X'),
          momentIndex: 1,
          registerIndices: [1], // Single qubit
          isControlled: false,
          operationMomentId: null
        },
        {
          gate: createGate('X', 'Pauli X'),
          momentIndex: 2,
          registerIndices: [2, 1], // Two qubits: target, control
          isControlled: true,
          operationMomentId: null
        },
        {
          gate: createGate('Z', 'Pauli Z'),
          momentIndex: 3,
          registerIndices: [3, 2], // Different control pattern
          isControlled: true,
          operationMomentId: null
        }
      ]);
      const result = qjsAstToText(ast);
      expect(result).toBe('\nX-I-I\nI-X#0-I\nI-I-Z#1');
    });
    
    it('properly converts 1-indexed registerIndices to 0-indexed display', () => {
      const ast = createMinimalAst(5, 1, [
        {
          gate: createGate('X', 'Pauli X'),
          momentIndex: 1,
          registerIndices: [5, 3], // target qubit 5, control qubit 3 (1-indexed)
          isControlled: true,
          operationMomentId: null
        }
      ]);
      const result = qjsAstToText(ast);
      const lines = result.split('\n');
      expect(lines[5]).toBe('X#2'); // Control from qubit 2 (0-indexed display)
    });
  });
  
  describe('AST field handling', () => {
    it('ignores unused AST fields', () => {
      const ast = {
        bandwidth: 1,
        timewidth: 1,
        qubits: [{}],
        operations: [
          {
            gate: createGate('H', 'Hadamard'),
            momentIndex: 1,
            registerIndices: [1],
            isControlled: false,
            operationMomentId: null
          }
        ],
        results: ['some', 'results'],
        matrix: [[1, 0], [0, 1]],
        needsEvaluation: false,
        history: { some: 'history' },
        extraField: 'should be ignored'
      };
      
      const result = qjsAstToText(ast);
      expect(result).toBe('\nH'); // Should work despite extra fields
    });
    
    it('handles missing optional AST fields gracefully', () => {
      const ast = {
        bandwidth: 1,
        timewidth: 1,
        qubits: [{}],
        operations: [
          {
            gate: createGate('H', 'Hadamard'),
            momentIndex: 1,
            registerIndices: [1],
            isControlled: false,
            operationMomentId: null
          }
        ]
        // Missing results, matrix, needsEvaluation, history
      };
      
      const result = qjsAstToText(ast);
      expect(result).toBe('\nH');
    });
    
    it('uses operationMomentId when present', () => {
      const ast = createMinimalAst(1, 1, [
        {
          gate: createGate('H', 'Hadamard'),
          momentIndex: 1,
          registerIndices: [1],
          isControlled: false,
          operationMomentId: 'group1'
        }
      ]);
      
      // Should still convert normally - operationMomentId is for internal grouping
      const result = qjsAstToText(ast);
      expect(result).toBe('\nH');
    });
  });
  
  describe('formatting and output structure', () => {
    it('starts output with newline', () => {
      const ast = createMinimalAst(1, 1, [
        {
          gate: createGate('H', 'Hadamard'),
          momentIndex: 1,
          registerIndices: [1],
          isControlled: false,
          operationMomentId: null
        }
      ]);
      const result = qjsAstToText(ast);
      expect(result.charAt(0)).toBe('\n');
    });
    
    it('uses hyphens for gate separation', () => {
      const ast = createMinimalAst(1, 2, [
        {
          gate: createGate('H', 'Hadamard'),
          momentIndex: 1,
          registerIndices: [1],
          isControlled: false,
          operationMomentId: null
        },
        {
          gate: createGate('X', 'Pauli X'),
          momentIndex: 2,
          registerIndices: [1],
          isControlled: false,
          operationMomentId: null
        }
      ]);
      const result = qjsAstToText(ast);
      expect(result).toBe('\nH-X');
    });
    
    it('uses newlines for qubit separation', () => {
      const ast = createMinimalAst(2, 1, [
        {
          gate: createGate('H', 'Hadamard'),
          momentIndex: 1,
          registerIndices: [1],
          isControlled: false,
          operationMomentId: null
        },
        {
          gate: createGate('X', 'Pauli X'),
          momentIndex: 1,
          registerIndices: [2],
          isControlled: false,
          operationMomentId: null
        }
      ]);
      const result = qjsAstToText(ast);
      expect(result).toBe('\nH\nX');
    });
    
    it('pads with identity gates for timing consistency', () => {
      const ast = createMinimalAst(2, 3, [
        {
          gate: createGate('H', 'Hadamard'),
          momentIndex: 1,
          registerIndices: [1],
          isControlled: false,
          operationMomentId: null
        },
        {
          gate: createGate('X', 'Pauli X'),
          momentIndex: 3,
          registerIndices: [2],
          isControlled: false,
          operationMomentId: null
        }
      ]);
      const result = qjsAstToText(ast);
      expect(result).toBe('\nH-I-I\nI-I-X');
    });
  });
  
  describe('error cases and edge conditions', () => {
    it('handles invalid AST structure gracefully', () => {
      expect(() => qjsAstToText(null)).toThrow();
      expect(() => qjsAstToText(undefined)).toThrow();
      expect(() => qjsAstToText({})).toThrow();
    });
    
    it('handles missing required AST fields', () => {
      const invalidAst = { bandwidth: 1 }; // Missing timewidth, operations, etc.
      expect(() => qjsAstToText(invalidAst)).toThrow();
    });
    
    it('handles operations with invalid momentIndex', () => {
      const ast = createMinimalAst(1, 1, [
        {
          gate: createGate('H', 'Hadamard'),
          momentIndex: 0, // Invalid: should be 1-indexed
          registerIndices: [1],
          isControlled: false,
          operationMomentId: null
        }
      ]);
      expect(() => qjsAstToText(ast)).toThrow();
    });
    
    it('handles operations with invalid registerIndices', () => {
      const ast = createMinimalAst(1, 1, [
        {
          gate: createGate('H', 'Hadamard'),
          momentIndex: 1,
          registerIndices: [], // Empty array
          isControlled: false,
          operationMomentId: null
        }
      ]);
      expect(() => qjsAstToText(ast)).toThrow();
    });
    
    it('handles gate objects without required properties', () => {
      const ast = createMinimalAst(1, 1, [
        {
          gate: {}, // Missing symbol property
          momentIndex: 1,
          registerIndices: [1],
          isControlled: false,
          operationMomentId: null
        }
      ]);
      expect(() => qjsAstToText(ast)).toThrow();
    });
  });
  
  describe('boundary conditions', () => {
    it('handles single operation AST', () => {
      const ast = createMinimalAst(1, 1, [
        {
          gate: createGate('H', 'Hadamard'),
          momentIndex: 1,
          registerIndices: [1],
          isControlled: false,
          operationMomentId: null
        }
      ]);
      const result = qjsAstToText(ast);
      expect(result).toBe('\nH');
    });
    
    it('handles large bandwidth ASTs', () => {
      const operations = Array.from({ length: 20 }, (_, i) => ({
        gate: createGate('H', 'Hadamard'),
        momentIndex: 1,
        registerIndices: [i + 1],
        isControlled: false,
        operationMomentId: null
      }));
      
      const ast = createMinimalAst(20, 1, operations);
      const result = qjsAstToText(ast);
      const lines = result.split('\n').filter(line => line.length > 0);
      expect(lines).toHaveLength(20);
      expect(lines.every(line => line === 'H')).toBe(true);
    });
    
    it('handles large timewidth ASTs', () => {
      const operations = Array.from({ length: 50 }, (_, i) => ({
        gate: createGate('H', 'Hadamard'),
        momentIndex: i + 1,
        registerIndices: [1],
        isControlled: false,
        operationMomentId: null
      }));
      
      const ast = createMinimalAst(1, 50, operations);
      const result = qjsAstToText(ast);
      expect(result).toBe('\n' + Array(50).fill('H').join('-'));
    });
    
    it('handles AST with no operations but non-zero timewidth', () => {
      const ast = createMinimalAst(2, 3, []);
      const result = qjsAstToText(ast);
      expect(result).toBe('\nI-I-I\nI-I-I');
    });
  });
});