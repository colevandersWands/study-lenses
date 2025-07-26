import { deepFreeze } from '../utils/deepFreeze.js';
import { executePython } from '../utils/execution/run-python.js';

export const id = 'run-python';
export const label = 'Run';

// Plugin configuration with deep freezing for nested objects
export const config = deepFreeze({});

export const applicable = (file) => {
	if (!file) return false;
	if (file.lang === 'python') return true;
	return false;
};

/**
 * Execute the plugin functionality
 * @param {Object} file - File object with content and metadata
 * @param {Object} config - Plugin configuration
 * @returns {Promise} Execution result
 */
export const execute = async (file, config = {}) => {
	console.log('🐍 Python execute called with:', { file, config });
	const code = file?.content || file;
	
	if (!code) {
		console.error('No Python code to execute');
		return;
	}
	
	// Remove any existing container to prevent conflicts
	const existingContainer = document.getElementById('python-execution-output');
	if (existingContainer && existingContainer.parentNode) {
		existingContainer.parentNode.removeChild(existingContainer);
	}
	
	// Create a fresh modal-style container for the Python terminal
	const container = document.createElement('div');
	container.id = 'python-execution-output';
	container.style.cssText = `
		position: fixed;
		top: 20%;
		left: 20%;
		width: 60vw;
		height: 50vh;
		min-width: 400px;
		min-height: 300px;
		background: #1e1e1e;
		border: 2px solid #333;
		border-radius: 8px;
		z-index: 1000;
		box-shadow: 0 4px 20px rgba(0,0,0,0.3);
		resize: both;
		overflow: auto;
	`;
	
	// Add title bar for dragging
	const titleBar = document.createElement('div');
	titleBar.style.cssText = `
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 32px;
		background: #2d2d30;
		border-radius: 6px 6px 0 0;
		cursor: move;
		display: flex;
		align-items: center;
		padding: 0 12px;
		user-select: none;
		border-bottom: 1px solid #444;
	`;
	
	// Add title text
	const titleText = document.createElement('span');
	titleText.textContent = 'Python Console';
	titleText.style.cssText = `
		color: #cccccc;
		font-size: 12px;
		font-family: system-ui, -apple-system, sans-serif;
		flex: 1;
	`;
	
	// Add close button
	const closeBtn = document.createElement('button');
	closeBtn.textContent = '✕';
	closeBtn.style.cssText = `
		padding: 2px 6px;
		border: none;
		background: #f44336;
		color: white;
		border-radius: 3px;
		cursor: pointer;
		font-size: 12px;
		line-height: 1;
		margin-left: auto;
	`;
	closeBtn.onclick = () => {
		if (container && container.parentNode) {
			container.parentNode.removeChild(container);
		}
	};
	
	// Add drag functionality
	let isDragging = false;
	let dragOffset = { x: 0, y: 0 };
	
	titleBar.onmousedown = (e) => {
		if (e.target === closeBtn) return; // Don't drag when clicking close button
		isDragging = true;
		const rect = container.getBoundingClientRect();
		dragOffset.x = e.clientX - rect.left;
		dragOffset.y = e.clientY - rect.top;
		
		document.addEventListener('mousemove', onMouseMove);
		document.addEventListener('mouseup', onMouseUp);
		e.preventDefault();
	};
	
	const onMouseMove = (e) => {
		if (!isDragging) return;
		
		const newX = e.clientX - dragOffset.x;
		const newY = e.clientY - dragOffset.y;
		
		// Keep within viewport bounds
		const maxX = window.innerWidth - container.offsetWidth;
		const maxY = window.innerHeight - container.offsetHeight;
		
		container.style.left = Math.max(0, Math.min(newX, maxX)) + 'px';
		container.style.top = Math.max(0, Math.min(newY, maxY)) + 'px';
		container.style.transform = 'none'; // Remove centering transform
	};
	
	const onMouseUp = () => {
		isDragging = false;
		document.removeEventListener('mousemove', onMouseMove);
		document.removeEventListener('mouseup', onMouseUp);
	};
	
	// Create terminal area (leaving space for title bar)
	const terminalArea = document.createElement('div');
	terminalArea.style.cssText = `
		position: absolute;
		top: 32px;
		left: 0;
		right: 0;
		bottom: 0;
		padding: 8px;
		overflow: hidden;
	`;
	
	titleBar.appendChild(titleText);
	titleBar.appendChild(closeBtn);
	
	container.appendChild(titleBar);
	container.appendChild(terminalArea);
	document.body.appendChild(container);
	
	try {
		await executePython(code, config, terminalArea);
	} catch (error) {
		console.error('Python execution failed:', error);
		// Show error in the terminal area
		const errorMessage = error instanceof Error ? error.message : String(error);
		terminalArea.innerHTML = `<div style="color: #ff6b6b; padding: 16px; font-family: monospace;">Error: ${errorMessage}</div>`;
	}
};
