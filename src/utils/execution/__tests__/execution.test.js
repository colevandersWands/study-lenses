/**
 * Basic tests for execution utilities
 * Tests the pure execution functions work correctly
 */

import { executeJavaScript, executeHTML, executeCSS, executePython } from '../index.js';
import { vi } from 'vitest';

describe('Execution utilities', () => {
	let container;

	beforeEach(() => {
		container = document.createElement('div');
		document.body.appendChild(container);
	});

	afterEach(() => {
		if (container && container.parentNode) {
			document.body.removeChild(container);
		}
	});

	test('executeJavaScript creates iframe', async () => {
		await executeJavaScript('console.log("test")', {}, container);
		expect(container.children.length).toBe(1);
		expect(container.firstChild.tagName).toBe('IFRAME');
	});

	test('executeJavaScript handles empty code gracefully', async () => {
		const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		await executeJavaScript('', {}, container);
		expect(consoleSpy).toHaveBeenCalledWith('No code to execute');
		expect(container.children.length).toBe(0);
		consoleSpy.mockRestore();
	});

	test('executeJavaScript handles missing container gracefully', async () => {
		const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		await executeJavaScript('console.log("test")', {}, null);
		expect(consoleSpy).toHaveBeenCalledWith('No container provided for JavaScript execution');
		consoleSpy.mockRestore();
	});

	test('executeHTML creates iframe with content', async () => {
		await executeHTML('<h1>Test</h1>', {}, container);
		expect(container.children.length).toBe(1);
		expect(container.firstChild.tagName).toBe('IFRAME');
	});

	test('executeHTML handles empty code gracefully', async () => {
		const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		await executeHTML('', {}, container);
		expect(consoleSpy).toHaveBeenCalledWith('No HTML code to execute');
		expect(container.children.length).toBe(0);
		consoleSpy.mockRestore();
	});

	test('executeCSS creates HTML iframe with CSS', async () => {
		await executeCSS('body { background: red; }', {}, container);
		expect(container.children.length).toBe(1);
		expect(container.firstChild.tagName).toBe('IFRAME');
	});

	test('executePython creates console and attempts to load Pyodide', async () => {
		// Don't await the full execution as Pyodide loading is slow in tests
		const promise = executePython('print("hello")', {}, container);
		
		// Should immediately create console structure
		await new Promise(resolve => setTimeout(resolve, 100)); // Small delay for DOM updates
		expect(container.children.length).toBe(1);
		expect(container.firstChild.textContent).toContain('Loading Python environment');
		
		// Don't wait for full completion in tests
	}, 2000);

	test('all functions clean up container before use', async () => {
		// Add some existing content
		const existingDiv = document.createElement('div');
		existingDiv.textContent = 'existing content';
		container.appendChild(existingDiv);
		expect(container.children.length).toBe(1);

		// Execute any function - should clean up first
		await executeJavaScript('console.log("test")', {}, container);
		expect(container.children.length).toBe(1);
		expect(container.firstChild.tagName).toBe('IFRAME');
	});

	test('executeJavaScript applies loop guard when enabled', async () => {
		const config = {
			loopGuard: {
				active: true,
				max: 10
			}
		};
		
		// This test just verifies the function runs without error when loop guard is enabled
		await executeJavaScript('let x = 1; while(x < 5) { x++; }', config, container);
		expect(container.children.length).toBe(1);
		expect(container.firstChild.tagName).toBe('IFRAME');
	});

	test('executeJavaScript applies debug mode when enabled', async () => {
		const config = {
			debug: true
		};
		
		// This test just verifies the function runs without error when debug is enabled
		await executeJavaScript('console.log("debug test")', config, container);
		expect(container.children.length).toBe(1);
		expect(container.firstChild.tagName).toBe('IFRAME');
	});
});