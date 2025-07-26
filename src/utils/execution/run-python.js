/**
 * Pure Python execution utility using Pyodide
 * Executes Python code in the browser with xterm.js terminal console
 */

import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import '@xterm/xterm/css/xterm.css';
import './terminal.css';

// Global Pyodide instance - initialize once, reuse across executions
let pyodideInstance = null;
let pyodideLoading = null;

/**
 * Load and initialize Pyodide from CDN
 * @returns {Promise<Object>} Pyodide instance
 */
const loadPyodide = async () => {
	// Return existing instance if already loaded
	if (pyodideInstance) {
		return pyodideInstance;
	}

	// Return existing loading promise if currently loading
	if (pyodideLoading) {
		return pyodideLoading;
	}

	// Start loading Pyodide
	pyodideLoading = (async () => {
		try {
			// Load Pyodide from CDN
			const script = document.createElement('script');
			script.src =
				'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js';
			document.head.appendChild(script);

			// Wait for script to load
			await new Promise((resolve, reject) => {
				script.onload = resolve;
				script.onerror = reject;
			});

			// Initialize Pyodide
			pyodideInstance = await window.loadPyodide({
				indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/',
			});

			// Install common packages
			await pyodideInstance.loadPackage(['numpy', 'matplotlib']);

			console.log(
				'✅ Pyodide loaded successfully with numpy and matplotlib'
			);
			return pyodideInstance;
		} catch (error) {
			console.error('❌ Failed to load Pyodide:', error);
			pyodideLoading = null; // Reset so we can try again
			throw error;
		}
	})();

	return pyodideLoading;
};

/**
 * Create an xterm.js terminal for Python console output
 * @param {HTMLElement} container - Parent container element
 * @returns {Object} Terminal and utility functions
 */
const createPythonConsole = (container) => {
	// Clean up container
	cleanupContainer(container);

	// Create terminal wrapper
	const terminalWrapper = document.createElement('div');
	terminalWrapper.className = 'python-terminal-wrapper';
	terminalWrapper.style.cssText = `
		height: 100%;
		width: 100%;
		padding: 8px;
		background: #1e1e1e;
		border-radius: 4px;
	`;

	// Initialize xterm.js terminal
	const terminal = new Terminal({
		theme: {
			background: '#1e1e1e',
			foreground: '#cccccc',
			cursor: '#ffffff',
			black: '#000000',
			red: '#ff6b6b',
			green: '#51fa7b',
			yellow: '#ffd93d',
			blue: '#6bcfff',
			magenta: '#ff6bcf',
			cyan: '#8aff80',
			white: '#ffffff',
		},
		fontFamily: '"Fira Code", "Consolas", "Monaco", monospace',
		fontSize: 14,
		lineHeight: 1.2,
		cursorBlink: true,
		scrollback: 1000,
		convertEol: true, // Convert \n to \r\n for proper line breaks
	});

	// Add addons
	const fitAddon = new FitAddon();
	const webLinksAddon = new WebLinksAddon();
	
	terminal.loadAddon(fitAddon);
	terminal.loadAddon(webLinksAddon);

	// Open terminal in container
	terminal.open(terminalWrapper);
	container.appendChild(terminalWrapper);
	
	// Store terminal reference for cleanup
	terminalWrapper._terminal = terminal;

	// Auto-fit terminal to container size
	setTimeout(() => fitAddon.fit(), 0);

	// Handle container resize
	const resizeObserver = new ResizeObserver(() => {
		fitAddon.fit();
	});
	resizeObserver.observe(container);
	
	// Store resize observer for cleanup
	terminalWrapper._resizeObserver = resizeObserver;

	// Utility functions
	const writeOutput = (text, color = '#cccccc') => {
		// Write with color escape sequences
		const colorCode = getColorCode(color);
		terminal.write(`\x1b[${colorCode}m${text}\x1b[0m`);
	};

	const writeLine = (text, color = '#cccccc') => {
		writeOutput(text + '\r\n', color);
	};

	const showPythonPrompt = () => {
		terminal.write('\x1b[34m>>> \x1b[0m'); // Blue prompt
	};

	// Interactive input handling
	let inputBuffer = '';
	let inputResolver = null;
	let isWaitingForInput = false;

	const handleInput = (data) => {
		if (!isWaitingForInput) return;

		// Handle different key inputs
		if (data === '\r' || data === '\n') {
			// Enter key - submit input
			terminal.write('\r\n');
			const inputValue = inputBuffer;
			inputBuffer = '';
			isWaitingForInput = false;
			
			if (inputResolver) {
				inputResolver(inputValue);
				inputResolver = null;
			}
		} else if (data === '\x7f' || data === '\x08') {
			// Backspace key
			if (inputBuffer.length > 0) {
				inputBuffer = inputBuffer.slice(0, -1);
				terminal.write('\b \b'); // Move back, write space, move back again
			}
		} else if (data >= ' ' && data <= '~') {
			// Printable characters
			inputBuffer += data;
			terminal.write(data);
		}
	};

	// Set up input handler
	terminal.onData(handleInput);

	// Function to get user input
	const getUserInput = (prompt = '') => {
		return new Promise((resolve) => {
			if (prompt) {
				terminal.write(prompt);
			}
			inputBuffer = '';
			isWaitingForInput = true;
			inputResolver = resolve;
		});
	};

	const showLoading = () => {
		writeLine('🐍 Loading Python environment...', '#ffd93d');
	};

	const hideLoading = () => {
		terminal.clear();
		writeLine('🐍 Python environment ready!', '#51fa7b');
		showPythonPrompt();
	};

	const showError = (error) => {
		writeLine(`❌ Python Error: ${error}`, '#ff6b6b');
		showPythonPrompt();
	};

	const appendOutput = (text, type = 'stdout') => {
		const color = type === 'stderr' ? '#ff6b6b' : type === 'warning' ? '#ffd93d' : '#cccccc';
		writeLine(text, color);
	};

	const showPlot = (imageDataUrl) => {
		// For matplotlib plots, create image element outside terminal
		const plotContainer = document.createElement('div');
		plotContainer.className = 'python-plot-container';
		
		const img = document.createElement('img');
		img.src = imageDataUrl;
		
		plotContainer.appendChild(img);
		terminalWrapper.appendChild(plotContainer);
		
		// Scroll terminal to bottom
		terminal.scrollToBottom();
	};

	const clear = () => {
		terminal.clear();
		showPythonPrompt();
	};

	// Show initial loading
	showLoading();

	return {
		terminal,
		terminalWrapper,
		writeOutput,
		writeLine,
		showPythonPrompt,
		hideLoading,
		showError,
		appendOutput,
		showPlot,
		clear,
		resizeObserver,
		getUserInput,
	};
};

// Helper function for ANSI color codes
const getColorCode = (color) => {
	const colorMap = {
		'#cccccc': '37',  // white
		'#ff6b6b': '31',  // red  
		'#51fa7b': '32',  // green
		'#ffd93d': '33',  // yellow
		'#6bcfff': '34',  // blue
		'#ff6bcf': '35',  // magenta
		'#8aff80': '36',  // cyan
	};
	return colorMap[color] || '37';
};

/**
 * Execute interactive Python code that contains input() calls
 * @param {Object} pyodide - Pyodide instance
 * @param {string} code - The Python code to execute
 * @param {Object} pythonConsole - Python console interface
 * @returns {Promise<void>} Resolves when execution completes
 */
const executeInteractiveCode = async (pyodide, code, pythonConsole) => {
	// Set up a custom input function that uses our terminal
	pyodide.runPython(`
# Custom input function
def custom_input(prompt=""):
    from js import window
    if prompt:
        print(prompt, end="", flush=True)
    return window.terminal_input_value

# Override built-in input
original_input = __builtins__['input']
__builtins__['input'] = custom_input
	`);

	// Split code by input() calls and execute incrementally
	const codeSegments = [];
	let currentSegment = '';
	const lines = code.split('\n');
	
	for (const line of lines) {
		if (/\binput\s*\(/.test(line)) {
			// Found input() call - save current segment and the input line
			if (currentSegment.trim()) {
				codeSegments.push({ type: 'code', content: currentSegment });
				currentSegment = '';
			}
			codeSegments.push({ type: 'input', content: line });
		} else {
			currentSegment += line + '\n';
		}
	}
	
	// Add remaining code
	if (currentSegment.trim()) {
		codeSegments.push({ type: 'code', content: currentSegment });
	}

	// Execute segments one by one
	for (const segment of codeSegments) {
		if (segment.type === 'code') {
			// Execute regular code
			pyodide.runPython(`
with capture_output():
    exec("""${segment.content.replace(/"/g, '\\"')}""")
			`);
			
			// Get and display output
			const output = pyodide.runPython('get_output()');
			const [stdout, stderr] = output.toJs();
			
			if (stdout) {
				pythonConsole.appendOutput(stdout, 'stdout');
			}
			if (stderr) {
				pythonConsole.appendOutput(stderr, 'stderr');
			}
		} else if (segment.type === 'input') {
			// Handle input() call
			const inputMatch = segment.content.match(/\binput\s*\(\s*["']?(.*?)["']?\s*\)/);
			const prompt = inputMatch ? inputMatch[1] : '';
			
			// Get user input through terminal
			const userInput = await pythonConsole.getUserInput(prompt);
			
			// Set the input value for Python to use
			window.terminal_input_value = userInput;
			
			// Execute the input line
			pyodide.runPython(`
with capture_output():
    exec("""${segment.content.replace(/"/g, '\\"')}""")
			`);
			
			// Get and display output
			const output = pyodide.runPython('get_output()');
			const [stdout, stderr] = output.toJs();
			
			if (stdout) {
				pythonConsole.appendOutput(stdout, 'stdout');
			}
			if (stderr) {
				pythonConsole.appendOutput(stderr, 'stderr');
			}
		}
	}

	// Restore original input function
	pyodide.runPython(`
__builtins__['input'] = original_input
	`);
};

/**
 * Execute Python code using Pyodide with visual console output
 * @param {string} code - The Python code to execute
 * @param {Object} config - Execution configuration options
 * @param {HTMLElement} container - DOM element to render results into
 * @returns {Promise<void>} Resolves when execution completes
 */
export const executePython = async (code, config = {}, container = null) => {
	if (!container) {
		console.warn('No container provided for Python execution');
		return;
	}

	if (!code?.trim()) {
		console.warn('No Python code to execute');
		return;
	}

	// Clean up any existing terminals in the container
	cleanupContainer(container);

	const pythonConsole = createPythonConsole(container);

	try {
		// Load Pyodide
		const pyodide = await loadPyodide();
		pythonConsole.hideLoading();

		// Set up output capture
		pyodide.runPython(`
import sys
import io
import contextlib

# Capture stdout and stderr
_stdout_capture = io.StringIO()
_stderr_capture = io.StringIO()

# Context manager for capturing output
@contextlib.contextmanager
def capture_output():
    old_stdout, old_stderr = sys.stdout, sys.stderr
    try:
        sys.stdout, sys.stderr = _stdout_capture, _stderr_capture
        yield
    finally:
        sys.stdout, sys.stderr = old_stdout, old_stderr

# Function to get captured output
def get_output():
    stdout_val = _stdout_capture.getvalue()
    stderr_val = _stderr_capture.getvalue()
    _stdout_capture.seek(0)
    _stdout_capture.truncate(0)
    _stderr_capture.seek(0)
    _stderr_capture.truncate(0)
    return stdout_val, stderr_val
		`);

		// Display Python code being executed
		const codeLines = code.split('\n');
		pythonConsole.writeLine(`>>> ${codeLines[0]}`, '#6bcfff');
		if (codeLines.length > 1) {
			codeLines.slice(1).forEach(line => {
				pythonConsole.writeLine(`... ${line}`, '#6bcfff');
			});
		}

		// Check if code contains input() calls
		const hasInputCalls = /\binput\s*\(/.test(code);
		
		if (hasInputCalls) {
			// Handle interactive code with input() calls
			await executeInteractiveCode(pyodide, code, pythonConsole);
		} else {
			// Execute non-interactive code normally
			pyodide.runPython(`
with capture_output():
    exec("""${code.replace(/"/g, '\\"')}""")
			`);

			// Get captured output
			const output = pyodide.runPython('get_output()');
			const [stdout, stderr] = output.toJs();

			// Display output
			if (stdout) {
				pythonConsole.appendOutput(stdout, 'stdout');
			}
			if (stderr) {
				pythonConsole.appendOutput(stderr, 'stderr');
			}
		}

		// Handle matplotlib plots
		try {
			// Check if matplotlib is being used and has figures
			const hasFigures = pyodide.runPython(`
import matplotlib.pyplot as plt
len(plt.get_fignums()) > 0
			`);

			if (hasFigures) {
				// Convert matplotlib figures to base64 images
				const plotData = pyodide.runPython(`
import matplotlib.pyplot as plt
import io
import base64

plots = []
for fig_num in plt.get_fignums():
    fig = plt.figure(fig_num)
    buffer = io.BytesIO()
    fig.savefig(buffer, format='png', dpi=100, bbox_inches='tight')
    buffer.seek(0)
    plot_data = base64.b64encode(buffer.getvalue()).decode()
    plots.append(f"data:image/png;base64,{plot_data}")
    plt.close(fig)

plots
				`);

				// Display each plot
				const plots = plotData.toJs();
				plots.forEach((plotDataUrl) => {
					pythonConsole.showPlot(plotDataUrl);
				});
			}
		} catch (plotError) {
			// Matplotlib might not be used, ignore
			console.log('No matplotlib plots detected');
		}

		// If no output was generated for non-interactive code, show success message
		if (!hasInputCalls) {
			pythonConsole.appendOutput(
				'✅ Python code executed successfully (no output)',
				'success'
			);
		}

		// Show new prompt
		pythonConsole.showPythonPrompt();
	} catch (error) {
		pythonConsole.hideLoading();
		pythonConsole.showError(error.message || error.toString());
		console.error('Python execution error:', error);
	}
};

/**
 * Legacy function name for compatibility
 * @deprecated Use executePython instead
 */
export const runPython = executePython;

/**
 * Clean up container element and dispose of any terminals
 * @param {HTMLElement} container - Container to clean up
 */
const cleanupContainer = (container) => {
	if (container) {
		// Dispose of any existing terminals
		const existingTerminals = container.querySelectorAll('.xterm');
		existingTerminals.forEach(termElement => {
			// Find the terminal instance and dispose it
			if (termElement._terminal && termElement._terminal.dispose) {
				termElement._terminal.dispose();
			}
		});

		// Disconnect any resize observers
		const terminalWrappers = container.querySelectorAll('.python-terminal-wrapper');
		terminalWrappers.forEach(wrapper => {
			if (wrapper._resizeObserver) {
				wrapper._resizeObserver.disconnect();
			}
		});
		
		// Clear container
		while (container.firstChild) {
			container.removeChild(container.firstChild);
		}
	}
};
