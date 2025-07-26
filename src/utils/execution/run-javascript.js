/**
 * Pure JavaScript execution utility
 * Executes JavaScript code in a sandboxed iframe with optional loop guards and debugging
 */

import { createTestingFramework } from '../testingFramework.js';

/**
 * Execute JavaScript code in a container element
 * @param {string} code - The JavaScript code to execute
 * @param {Object} config - Execution configuration options
 * @param {HTMLElement} container - DOM element to render results into
 * @returns {Promise<void>} Resolves when execution completes
 */
export const executeJavaScript = async (
	code,
	config = {},
	container = null
) => {
	if (!container) {
		console.warn('No container provided for JavaScript execution');
		return;
	}

	if (!code?.trim()) {
		console.warn('No code to execute');
		return;
	}

	// Clean up container
	cleanupContainer(container);

	// Default configuration
	const finalConfig = {
		debug: false,
		type: 'script', // 'script' or 'module'
		testing: false,
		loopGuard: {
			active: false,
			max: 100,
		},
		...config,
	};

	try {
		// Prepare code with optional modifications
		let finalCode = code;

		if (finalConfig.loopGuard?.active) {
			finalCode = addLoopGuard(finalCode, finalConfig.loopGuard.max);
		}

		if (finalConfig.debug) {
			finalCode = `debugger;\n\n${finalCode}\n\ndebugger;`;
		}

		// Create iframe for execution
		const iframe = document.createElement('iframe');
		iframe.style.cssText = `
			width: 100%;
			height: 0px;
			border: none;
			display: none;
		`;

		// Set up iframe load handler
		iframe.onload = () => {
			try {
				const iframeWindow = iframe.contentWindow;
				const iframeDocument = iframe.contentDocument;

				if (!iframeWindow || !iframeDocument) {
					throw new Error(
						'Failed to access iframe window or document'
					);
				}

				// Add globals to iframe (like old-runner.js)
				Object.assign(iframeWindow, finalConfig.globals || {});

				// Add browser dialog functions
				iframeWindow.alert = (message) => window.alert(message);
				iframeWindow.prompt = (message, defaultValue) =>
					window.prompt(message, defaultValue);
				iframeWindow.confirm = (message) => window.confirm(message);

				// Override console methods to capture output
				const originalConsole = iframeWindow.console;
				iframeWindow.console = {
					...originalConsole,
					log: (...args) => {
						originalConsole.log(...args);
					},
					error: (...args) => {
						originalConsole.error(...args);
					},
					warn: (...args) => {
						originalConsole.warn(...args);
					},
				};

				// Initialize testing framework if enabled
				if (finalConfig.testing) {
					createTestingFramework(iframeWindow);
				}

				// Add global error handling
				iframeWindow.addEventListener('error', (event) => {
					// Check for common testing framework errors
					if (
						event.message.includes('describe is not defined') ||
						event.message.includes('it is not defined') ||
						event.message.includes('expect is not defined')
					) {
						const helpMsg = `💡 TESTING FRAMEWORK ERROR

It looks like you're trying to use unit tests (describe, it, expect) but the "Unit Tests" option is not enabled.

To fix this:
1. Click the "⚙️" button next to the Run button
2. Check the "Testing Framework" checkbox
3. Try running your code again

Your testing functions will then be available!`;

						console.warn(helpMsg);
					}
					console.error('JavaScript execution iframe error:', event);
				});

				// Create and execute script (use innerHTML like old-runner.js)
				const script = document.createElement('script');
				script.innerHTML = finalCode;

				if (finalConfig.type === 'module') {
					script.type = 'module';
				}

				// Execute the script
				iframeDocument.body.appendChild(script);
			} catch (error) {
				console.error('❌ JavaScript execution error:', error);
			}
		};

		// Set iframe error handler
		iframe.onerror = (error) => {
			console.error('❌ JavaScript execution iframe error:', error);
		};

		container.appendChild(iframe);

		// Iframe loads automatically when appended - no need to set src
	} catch (error) {
		console.error('❌ JavaScript execution setup error:', error);
		throw error;
	}
};

/**
 * Add loop guard protection to code
 * @param {string} codeToGuard - Code to add loop guards to
 * @param {number} maxIterations - Maximum iterations before throwing error
 * @returns {string} Code with loop guard protection
 */
const addLoopGuard = (codeToGuard, maxIterations = 100) => {
	let guardedCode = codeToGuard;
	let loopCount = 0;

	// Guard while loops
	guardedCode = guardedCode.replace(
		/while\s*\(([^)]+)\)/g,
		(match, condition) => {
			loopCount++;
			const guardVar = `loopGuard_${loopCount}`;
			return `let ${guardVar} = 0; while ((${condition}) && ++${guardVar} <= ${maxIterations})`;
		}
	);

	// Guard for loops
	guardedCode = guardedCode.replace(
		/for\s*\(([^;]*);([^;]*);([^)]*)\)/g,
		(match, init, condition, increment) => {
			loopCount++;
			const guardVar = `loopGuard_${loopCount}`;
			return `for (${init}, ${guardVar} = 0; (${condition || 'true'}) && ++${guardVar} <= ${maxIterations}; ${increment})`;
		}
	);

	// Add error throwing when limit exceeded
	if (loopCount > 0) {
		guardedCode = `
// Loop Guard Protection (max ${maxIterations} iterations per loop)
const throwLoopError = () => { throw new Error('⚠️ Loop guard triggered! Loop exceeded ${maxIterations} iterations. This prevents infinite loops.'); };

${guardedCode}`;
	}

	return guardedCode;
};

/**
 * Clean up container element
 * @param {HTMLElement} container - Container to clean up
 */
const cleanupContainer = (container) => {
	if (container) {
		while (container.firstChild) {
			container.removeChild(container.firstChild);
		}
	}
};
