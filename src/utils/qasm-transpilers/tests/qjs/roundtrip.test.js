import { parseTextToQjsAst } from '../../src/qjs/plaintext-to-qjs-ast.js';
import { qjsAstToText } from '../../src/qjs/qjs-ast-to-plaintext.js';

describe('Q.js Pure Functions Round-Trip Validation', () => {
  
  describe('basic round-trip consistency', () => {
    it('handles single gate round-trip', () => {
      const originalText = 'H';
      const ast = parseTextToQjsAst(originalText);
      const reconstructedText = qjsAstToText(ast);
      const finalAst = parseTextToQjsAst(reconstructedText);
      
      // AST structure should be equivalent
      expect(finalAst.bandwidth).toBe(ast.bandwidth);
      expect(finalAst.timewidth).toBe(ast.timewidth);
      expect(finalAst.operations).toHaveLength(ast.operations.length);
      expect(finalAst.operations[0].gate.symbol).toBe(ast.operations[0].gate.symbol);
    });
    
    it('handles gate sequence round-trip', () => {
      const originalText = 'H-X-Z';
      const ast = parseTextToQjsAst(originalText);
      const reconstructedText = qjsAstToText(ast);
      const finalAst = parseTextToQjsAst(reconstructedText);
      
      expect(finalAst.operations).toHaveLength(3);
      expect(finalAst.operations.map(op => op.gate.symbol)).toEqual(['H', 'X', 'Z']);
      expect(finalAst.operations.map(op => op.momentIndex)).toEqual([1, 2, 3]);
    });
    
    it('handles multi-qubit parallel gates round-trip', () => {
      const originalText = 'H\nX\nZ';
      const ast = parseTextToQjsAst(originalText);
      const reconstructedText = qjsAstToText(ast);
      const finalAst = parseTextToQjsAst(reconstructedText);
      
      expect(finalAst.bandwidth).toBe(3);
      expect(finalAst.operations).toHaveLength(3);
      expect(finalAst.operations.map(op => op.registerIndices[0])).toEqual([1, 2, 3]);
    });
  });
  
  describe('timing and spacing round-trip', () => {
    it('preserves timing gaps', () => {
      const originalText = 'H---X';
      const ast = parseTextToQjsAst(originalText);
      const reconstructedText = qjsAstToText(ast);
      const finalAst = parseTextToQjsAst(reconstructedText);
      
      expect(finalAst.timewidth).toBe(ast.timewidth);
      expect(finalAst.operations).toHaveLength(2);
      expect(finalAst.operations[0].momentIndex).toBe(1);
      expect(finalAst.operations[1].momentIndex).toBe(4);
    });
    
    it('handles mixed sparse patterns', () => {
      const originalText = 'H--X\nI-Z';
      const ast = parseTextToQjsAst(originalText);
      const reconstructedText = qjsAstToText(ast);
      const finalAst = parseTextToQjsAst(reconstructedText);
      
      expect(finalAst.bandwidth).toBe(ast.bandwidth);
      expect(finalAst.timewidth).toBe(ast.timewidth);
      
      const qubit1Ops = finalAst.operations.filter(op => op.registerIndices[0] === 1);
      const qubit2Ops = finalAst.operations.filter(op => op.registerIndices[0] === 2);
      
      expect(qubit1Ops).toHaveLength(2); // H and X
      expect(qubit2Ops).toHaveLength(1); // Z
    });
    
    it('preserves identity padding in reconstruction', () => {
      const originalText = 'H-I-X\nZ-I-I';
      const ast = parseTextToQjsAst(originalText);
      const reconstructedText = qjsAstToText(ast);
      
      // Reconstructed text should have identity gates for proper timing
      expect(reconstructedText).toContain('I');
      
      const finalAst = parseTextToQjsAst(reconstructedText);
      expect(finalAst.timewidth).toBe(ast.timewidth);
    });
  });
  
  describe('controlled gates round-trip', () => {
    it('preserves CNOT gates', () => {
      const originalText = 'I\nX#0';  // Fixed: qubit 1 controlled by qubit 0
      const ast = parseTextToQjsAst(originalText);
      const reconstructedText = qjsAstToText(ast);
      const finalAst = parseTextToQjsAst(reconstructedText);
      
      expect(finalAst.operations).toHaveLength(1);
      expect(finalAst.operations[0].isControlled).toBe(true);
      expect(finalAst.operations[0].gate.symbol).toBe('X');
    });
    
    it('preserves controlled-H gates', () => {
      const originalText = 'I\nH#0';  // Fixed: qubit 1 controlled by qubit 0
      const ast = parseTextToQjsAst(originalText);
      const reconstructedText = qjsAstToText(ast);
      const finalAst = parseTextToQjsAst(reconstructedText);
      
      expect(finalAst.operations[0].isControlled).toBe(true);
      expect(finalAst.operations[0].gate.symbol).toBe('H');
    });
    
    it('preserves Bell state circuit', () => {
      const originalText = 'H-I\nI-X#0';  // Fixed: proper Bell state setup
      const ast = parseTextToQjsAst(originalText);
      const reconstructedText = qjsAstToText(ast);
      const finalAst = parseTextToQjsAst(reconstructedText);
      
      expect(finalAst.operations).toHaveLength(2);
      
      const hGate = finalAst.operations.find(op => op.gate.symbol === 'H');
      const xGate = finalAst.operations.find(op => op.gate.symbol === 'X');
      
      expect(hGate.isControlled).toBe(false);
      expect(xGate.isControlled).toBe(true);
      expect(hGate.momentIndex).toBe(1);
      expect(xGate.momentIndex).toBe(2);
    });
    
    it('preserves GHZ state circuit', () => {
      const originalText = 'H-I---I\nI-X#0-I\nI-I---X#0';  // Fixed: proper GHZ state setup
      const ast = parseTextToQjsAst(originalText);
      const reconstructedText = qjsAstToText(ast);
      const finalAst = parseTextToQjsAst(reconstructedText);
      
      expect(finalAst.bandwidth).toBe(3);
      expect(finalAst.operations).toHaveLength(3);
      
      const hGates = finalAst.operations.filter(op => op.gate.symbol === 'H');
      const xGates = finalAst.operations.filter(op => op.gate.symbol === 'X');
      
      expect(hGates).toHaveLength(1);
      expect(xGates).toHaveLength(2);
      expect(xGates.every(op => op.isControlled)).toBe(true);
    });
    
    it('preserves complex controlled patterns', () => {
      const originalText = 'X#1-Z#2\nI---I\nI---I';
      const ast = parseTextToQjsAst(originalText);
      const reconstructedText = qjsAstToText(ast);
      const finalAst = parseTextToQjsAst(reconstructedText);
      
      expect(finalAst.operations).toHaveLength(2);
      expect(finalAst.operations.every(op => op.isControlled)).toBe(true);
      expect(finalAst.operations[0].momentIndex).toBe(1);
      expect(finalAst.operations[1].momentIndex).toBe(2);
    });
  });
  
  describe('complex pattern round-trip', () => {
    it('preserves quantum Fourier transform patterns', () => {
      const originalText = 'H---------I\nI-H-I-H#0-I';  // Fixed: remove self-control
      const ast = parseTextToQjsAst(originalText);
      const reconstructedText = qjsAstToText(ast);
      const finalAst = parseTextToQjsAst(reconstructedText);
      
      expect(finalAst.bandwidth).toBe(ast.bandwidth);
      expect(finalAst.timewidth).toBe(ast.timewidth);
      
      const hGates = finalAst.operations.filter(op => op.gate.symbol === 'H');
      const controlledHGates = hGates.filter(op => op.isControlled);
      
      expect(controlledHGates.length).toBeGreaterThan(0);
    });
    
    it('preserves Grover diffusion patterns', () => {
      const originalText = 'H-X-H-X#1-H-X-H\nH-X-H-I---H-X-H';
      const ast = parseTextToQjsAst(originalText);
      const reconstructedText = qjsAstToText(ast);
      const finalAst = parseTextToQjsAst(reconstructedText);
      
      expect(finalAst.bandwidth).toBe(2);
      expect(finalAst.operations.length).toBeGreaterThan(10);
      
      const controlledOps = finalAst.operations.filter(op => op.isControlled);
      expect(controlledOps).toHaveLength(1);
    });
    
    it('preserves example file patterns', () => {
      const originalText = 'H-I-I-H-I-I-I---I-H\nI-Z-I-H-I-I---X#0-I-H\nI-I-I-X-H-I-I---I-X\nI-I-I-I-I-I---I---I-I';  // Fixed: removed all self-control
      const ast = parseTextToQjsAst(originalText);
      const reconstructedText = qjsAstToText(ast);
      const finalAst = parseTextToQjsAst(reconstructedText);
      
      expect(finalAst.bandwidth).toBe(4);
      expect(finalAst.timewidth).toBe(13); // Fixed: actual timewidth from longest line 'I-I-I-I-I-I---I---I-I' 
      expect(finalAst.operations.length).toBeGreaterThan(8);
      
      const controlledOps = finalAst.operations.filter(op => op.isControlled);
      expect(controlledOps.length).toBe(1); // Fixed: only 1 controlled operation (X#0) in this pattern
    });
  });
  
  describe('AST structural consistency', () => {
    it('maintains bandwidth across transformations', () => {
      const testCases = [
        { text: 'H', expectedBandwidth: 1 },
        { text: 'H\nX', expectedBandwidth: 2 },
        { text: 'H\nX\nZ', expectedBandwidth: 3 },
        { text: 'H\nX\nZ\nI\nH', expectedBandwidth: 5 } // Fixed: 5 lines = 5 qubits
      ];
      
      testCases.forEach(({ text, expectedBandwidth }) => {
        const ast = parseTextToQjsAst(text);
        const reconstructedText = qjsAstToText(ast);
        const finalAst = parseTextToQjsAst(reconstructedText);
        
        expect(finalAst.bandwidth).toBe(ast.bandwidth);
        expect(finalAst.bandwidth).toBe(expectedBandwidth);
      });
    });
    
    it('maintains timewidth across transformations', () => {
      const testCases = [
        { text: 'H', expectedTimewidth: 1 },
        { text: 'H-X', expectedTimewidth: 2 },
        { text: 'H-X-Z', expectedTimewidth: 3 },
        { text: 'H-X-Z-I-H', expectedTimewidth: 5 } // Fixed: 5 positions = 5 time steps
      ];
      
      testCases.forEach(({ text, expectedTimewidth }) => {
        const ast = parseTextToQjsAst(text);
        const reconstructedText = qjsAstToText(ast);
        const finalAst = parseTextToQjsAst(reconstructedText);
        
        expect(finalAst.timewidth).toBe(ast.timewidth);
        expect(finalAst.timewidth).toBe(expectedTimewidth);
      });
    });
    
    it('maintains operation count consistency', () => {
      const testCases = [
        'H',           // 1 op
        'H-X',         // 2 ops
        'H\nX',        // 2 ops
        'H-I-X',       // 2 ops (I ignored)
        'I\nH-X#0'     // 2 ops - fixed self-control
      ];
      
      testCases.forEach(originalText => {
        const ast = parseTextToQjsAst(originalText);
        const reconstructedText = qjsAstToText(ast);
        const finalAst = parseTextToQjsAst(reconstructedText);
        
        expect(finalAst.operations).toHaveLength(ast.operations.length);
      });
    });
    
    it('preserves gate types and properties', () => {
      const originalText = 'H-X-Z-I\nI-I-I-H#0';  // Fixed: remove self-control
      const ast = parseTextToQjsAst(originalText);
      const reconstructedText = qjsAstToText(ast);
      const finalAst = parseTextToQjsAst(reconstructedText);
      
      const originalGateSymbols = ast.operations.map(op => op.gate.symbol).sort();
      const finalGateSymbols = finalAst.operations.map(op => op.gate.symbol).sort();
      
      expect(finalGateSymbols).toEqual(originalGateSymbols);
      
      const originalControlled = ast.operations.filter(op => op.isControlled).length;
      const finalControlled = finalAst.operations.filter(op => op.isControlled).length;
      
      expect(finalControlled).toBe(originalControlled);
    });
    
    it('maintains moment index consistency', () => {
      const originalText = 'H--X-Z\nI-H-I';
      const ast = parseTextToQjsAst(originalText);
      const reconstructedText = qjsAstToText(ast);
      const finalAst = parseTextToQjsAst(reconstructedText);
      
      const originalMoments = ast.operations.map(op => op.momentIndex).sort();
      const finalMoments = finalAst.operations.map(op => op.momentIndex).sort();
      
      expect(finalMoments).toEqual(originalMoments);
    });
  });
  
  describe('multiple round-trip stability', () => {
    it('remains stable over multiple transformations', () => {
      let currentText = 'H-I\nI-X#0';  // Fixed: remove self-control
      
      // Perform 5 round-trips
      for (let i = 0; i < 5; i++) {
        const ast = parseTextToQjsAst(currentText);
        currentText = qjsAstToText(ast);
      }
      
      // Final result should be equivalent to original
      const finalAst = parseTextToQjsAst(currentText);
      expect(finalAst.bandwidth).toBe(2);
      expect(finalAst.operations).toHaveLength(2);
      
      const hGate = finalAst.operations.find(op => op.gate.symbol === 'H');
      const xGate = finalAst.operations.find(op => op.gate.symbol === 'X');
      
      expect(hGate.isControlled).toBe(false);
      expect(xGate.isControlled).toBe(true);
    });
    
    it('handles complex circuits over multiple round-trips', () => {
      let currentText = 'H-I-I-H\nI-Z-I-H\nI-I-I-X';  // Fixed: remove all self-control
      
      const originalAst = parseTextToQjsAst(currentText);
      
      // Perform 3 round-trips
      for (let i = 0; i < 3; i++) {
        const ast = parseTextToQjsAst(currentText);
        currentText = qjsAstToText(ast);
      }
      
      const finalAst = parseTextToQjsAst(currentText);
      
      // Structure should remain consistent
      expect(finalAst.bandwidth).toBe(originalAst.bandwidth);
      expect(finalAst.operations.length).toBe(originalAst.operations.length);
      
      const originalControlled = originalAst.operations.filter(op => op.isControlled).length;
      const finalControlled = finalAst.operations.filter(op => op.isControlled).length;
      
      expect(finalControlled).toBe(originalControlled);
    });
  });
  
  describe('edge case round-trip consistency', () => {
    it('handles empty circuits', () => {
      const originalText = '';
      const ast = parseTextToQjsAst(originalText);
      const reconstructedText = qjsAstToText(ast);
      const finalAst = parseTextToQjsAst(reconstructedText);
      
      expect(finalAst.bandwidth).toBe(ast.bandwidth);
      expect(finalAst.operations).toHaveLength(0);
    });
    
    it('handles identity-only circuits', () => {
      const originalText = 'I-I-I\nI-I-I';
      const ast = parseTextToQjsAst(originalText);
      const reconstructedText = qjsAstToText(ast);
      const finalAst = parseTextToQjsAst(reconstructedText);
      
      expect(finalAst.bandwidth).toBe(2);
      expect(finalAst.timewidth).toBe(3);
      expect(finalAst.operations).toHaveLength(0); // All identity gates
    });
    
    it('handles sparse circuits with large gaps', () => {
      const originalText = 'H---------X\nI-I-I-I-I-Z';
      const ast = parseTextToQjsAst(originalText);
      const reconstructedText = qjsAstToText(ast);
      const finalAst = parseTextToQjsAst(reconstructedText);
      
      expect(finalAst.timewidth).toBe(ast.timewidth);
      expect(finalAst.operations).toHaveLength(3); // H, X, Z
    });
    
    it('handles single-moment multi-qubit circuits', () => {
      const originalText = 'H\nX\nZ\nI\nH';
      const ast = parseTextToQjsAst(originalText);
      const reconstructedText = qjsAstToText(ast);
      const finalAst = parseTextToQjsAst(reconstructedText);
      
      expect(finalAst.bandwidth).toBe(5);
      expect(finalAst.timewidth).toBe(1);
      expect(finalAst.operations).toHaveLength(4); // H, X, Z, H (I ignored)
    });
  });
  
  describe('formatting consistency', () => {
    it('produces consistent formatting patterns', () => {
      const testCases = [
        'H-X',
        'H\nX',
        'H-I\nI-X#0',  // Fixed: remove self-control
        'H---X\nI-I-Z'
      ];
      
      testCases.forEach(originalText => {
        const ast = parseTextToQjsAst(originalText);
        const reconstructedText = qjsAstToText(ast);
        
        // Should contain expected formatting elements
        if (originalText.includes('-')) {
          expect(reconstructedText).toContain('-');
        }
        if (originalText.includes('\n')) {
          expect(reconstructedText).toContain('\n');
        }
        if (originalText.includes('#')) {
          expect(reconstructedText).toContain('#');
        }
      });
    });
    
    it('maintains proper qubit indexing in control notation', () => {
      const testCases = [
        'I\nX#0',     // Fixed: qubit 1 controlled by qubit 0
        'I\nI\nX#1',  // Fixed: qubit 2 controlled by qubit 1
        'I\nI\nX#0',  // Fixed: qubit 2 controlled by qubit 0
      ];
      
      testCases.forEach(originalText => {
        const ast = parseTextToQjsAst(originalText);
        const reconstructedText = qjsAstToText(ast);
        const finalAst = parseTextToQjsAst(reconstructedText);
        
        // Control relationships should be preserved
        const controlledOps = finalAst.operations.filter(op => op.isControlled);
        expect(controlledOps).toHaveLength(1);
      });
    });
  });
  
  describe('performance and scalability', () => {
    it('handles moderately large circuits efficiently', () => {
      // Create a 10x10 circuit with various patterns  
      const lines = [];
      for (let i = 0; i < 10; i++) {
        const gates = [];
        for (let j = 0; j < 10; j++) {
          if (j === 0) gates.push('H');
          else if (j === 9 && i > 0) gates.push(`X#${i-1}`);  // Fixed: proper control qubits
          else gates.push('I');
        }
        lines.push(gates.join('-'));
      }
      const originalText = lines.join('\n');
      
      const startTime = Date.now();
      const ast = parseTextToQjsAst(originalText);
      const reconstructedText = qjsAstToText(ast);
      const finalAst = parseTextToQjsAst(reconstructedText);
      const endTime = Date.now();
      
      // Should complete reasonably quickly (< 100ms for moderate circuits)
      expect(endTime - startTime).toBeLessThan(100);
      
      // Structure should be preserved
      expect(finalAst.bandwidth).toBe(10);
      expect(finalAst.timewidth).toBe(10);
      expect(finalAst.operations.length).toBe(19); // Fixed: 10 H gates + 9 controlled X gates (first qubit has no controlled X)
    });
    
    it('maintains consistency under stress conditions', () => {
      // Complex pattern with many controlled gates
      const complexPattern = 'H#1-X#2-Z#3\nI---I---I\nI---I---I\nI---I---I';
      
      // Run multiple iterations to test stability
      let currentText = complexPattern;
      for (let i = 0; i < 10; i++) {
        const ast = parseTextToQjsAst(currentText);
        currentText = qjsAstToText(ast);
      }
      
      const finalAst = parseTextToQjsAst(currentText);
      expect(finalAst.bandwidth).toBe(4);
      expect(finalAst.operations.filter(op => op.isControlled)).toHaveLength(3);
    });
  });
});