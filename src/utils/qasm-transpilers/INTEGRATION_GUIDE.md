# Integration Guide for q.js Circuit Editor

This guide explains how to integrate the qasm-transpilers with your q.js quantum circuit editor.

## Quick Setup

1. **Copy the transpiler** into your project:
   ```bash
   cp -r qasm-transpilers your-project/lib/
   ```

2. **Import the bridge utilities**:
   ```javascript
   import { qjsToQasm, qasmToQjs } from './lib/qasm-transpilers/integration/qjs-bridge.js';
   ```

## Basic Integration

### Export Circuit to QASM

```javascript
// When user clicks "Export to QASM" button
function exportToQasm(currentCircuit) {
  try {
    const qasm = qjsToQasm(currentCircuit);
    // Show in dialog or download as file
    downloadFile('circuit.qasm', qasm);
  } catch (error) {
    showError(`Export failed: ${error.message}`);
  }
}
```

### Import QASM to Circuit

```javascript
// When user uploads or pastes QASM code
function importFromQasm(qasmCode) {
  try {
    const circuit = qasmToQjs(qasmCode);
    // Load into editor
    editor.loadCircuit(circuit);
  } catch (error) {
    showError(`Import failed: ${error.message}`);
  }
}
```

## Advanced Integration

### Add QASM Code Editor Panel

```javascript
// Create a split view with circuit editor and QASM code
class QasmCodePanel {
  constructor(editor) {
    this.editor = editor;
    this.codeEditor = createCodeEditor('qasm');
    
    // Update QASM when circuit changes
    editor.on('change', () => {
      this.updateQasm();
    });
    
    // Update circuit when QASM changes (with debouncing)
    this.codeEditor.on('change', debounce(() => {
      this.updateCircuit();
    }, 500));
  }
  
  updateQasm() {
    try {
      const qasm = qjsToQasm(this.editor.getCircuit());
      this.codeEditor.setValue(qasm);
      this.clearError();
    } catch (error) {
      this.showError(error.message);
    }
  }
  
  updateCircuit() {
    try {
      const circuit = qasmToQjs(this.codeEditor.getValue());
      this.editor.loadCircuit(circuit);
      this.clearError();
    } catch (error) {
      this.showError(error.message);
    }
  }
}
```

### Circuit Validation

```javascript
import { validateQjsCircuit } from './lib/qasm-transpilers/integration/qjs-bridge.js';

// Validate before operations
function canExportCircuit(circuit) {
  const validation = validateQjsCircuit(circuit);
  if (!validation.valid) {
    showWarning(`Circuit issue: ${validation.error}`);
    return false;
  }
  return true;
}
```

### Standard Circuit Templates

```javascript
import { createStandardCircuit } from './lib/qasm-transpilers/integration/qjs-bridge.js';

// Add to templates menu
const templates = {
  'Bell State': () => createStandardCircuit('bell'),
  'GHZ State (3 qubits)': () => createStandardCircuit('ghz3'),
  'GHZ State (5 qubits)': () => createStandardCircuit('ghz', 5),
  'SWAP Gate': () => createStandardCircuit('swap'),
  'QFT (2 qubits)': () => createStandardCircuit('qft2'),
  'Measurement Example': () => createStandardCircuit('measure')
};

function loadTemplate(templateName) {
  const circuit = templates[templateName]();
  editor.loadCircuit(circuit);
}
```

## Handling Special Features

### SWAP Gate Display

The transpiler automatically recognizes SWAP gates. In your circuit editor:

```javascript
// When loading a circuit with SWAP operations
function renderSwapGate(operation) {
  if (operation.isSwap && operation.gate.symbol === 'SWAP') {
    // Render special SWAP gate visualization
    const [qubit1, qubit2] = operation.registerIndices;
    return createSwapVisual(qubit1 - 1, qubit2 - 1);  // Convert to 0-indexed
  }
}
```

### Measurement Handling

```javascript
// Check if circuit has measurements
function circuitHasMeasurements(circuit) {
  return circuit.operations.some(op => op.gate.symbol === 'M');
}

// Add classical register info when exporting
function exportWithMeasurements(circuit) {
  const description = describeQjsCircuit(circuit);
  if (description.measurements > 0) {
    // Transpiler automatically handles classical registers
    return qjsToQasm(circuit);
  }
}
```

## Error Handling Best Practices

```javascript
class CircuitEditor {
  importQasm(qasmCode) {
    try {
      // Validate QASM first
      if (!qasmCode.includes('OPENQASM 2.0')) {
        throw new Error('Only OpenQASM 2.0 is supported');
      }
      
      // Convert to circuit
      const circuit = qasmToQjs(qasmCode);
      
      // Validate circuit constraints
      if (circuit.bandwidth > this.maxQubits) {
        throw new Error(`Circuit has ${circuit.bandwidth} qubits, maximum is ${this.maxQubits}`);
      }
      
      // Load successfully
      this.loadCircuit(circuit);
      this.showSuccess('Circuit imported successfully');
      
    } catch (error) {
      this.showError(`Import failed: ${error.message}`);
      
      // Provide helpful suggestions
      if (error.message.includes('gate')) {
        this.showHint('Supported gates: H, X, Y, Z, T, S, RX, RZ, CNOT, CZ, SWAP, M');
      }
    }
  }
}
```

## Performance Considerations

For large circuits, consider:

1. **Debouncing updates** between editor and QASM view
2. **Lazy loading** for circuit visualization
3. **Web Worker** for QASM conversion of very large circuits

```javascript
// Web Worker for large circuit conversion
const transpilerWorker = new Worker('transpiler-worker.js');

function convertLargeCircuit(circuit) {
  return new Promise((resolve, reject) => {
    transpilerWorker.postMessage({ action: 'toQasm', circuit });
    transpilerWorker.onmessage = (e) => {
      if (e.data.error) reject(new Error(e.data.error));
      else resolve(e.data.qasm);
    };
  });
}
```

## Testing Your Integration

```javascript
// Test suite for your integration
describe('QASM Integration', () => {
  test('round-trip conversion preserves circuit', () => {
    const original = createTestCircuit();
    const qasm = qjsToQasm(original);
    const restored = qasmToQjs(qasm);
    expect(areCircuitsEquivalent(original, restored)).toBe(true);
  });
  
  test('handles invalid QASM gracefully', () => {
    expect(() => qasmToQjs('invalid qasm')).toThrow();
  });
  
  test('exports measurements correctly', () => {
    const circuit = createCircuitWithMeasurements();
    const qasm = qjsToQasm(circuit);
    expect(qasm).toContain('creg');
    expect(qasm).toContain('measure');
  });
});
```

## Next Steps

1. Run the examples to see the transpiler in action:
   ```bash
   npm run examples
   ```

2. Run the test suite to ensure everything works:
   ```bash
   npm test
   ```

3. Check the `integration/examples/` directory for more detailed examples

For questions or issues, please refer to the main README.md or open an issue on GitHub.