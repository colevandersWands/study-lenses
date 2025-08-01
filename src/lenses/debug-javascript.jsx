/**
 * JavaScript Execution Plugin for StudyButton
 *
 * Handles execution of JavaScript, HTML, and CSS code in isolated iframes
 * with optional loop guards, debugging, and testing framework support.
 */

import { executeJavaScript } from '../utils/execution/run-javascript.js';

// Run JavaScript lens - unified interface
export const id = 'debug-javascript';
export const label = 'Debug';

/**
 * Check if this plugin is applicable to the given file
 * @param {Object} file - File object with properties like lang, content, etc.
 * @returns {boolean} True if plugin should be available for this file
 */
export const applicable = (file) => {
	if (!file) return false;
	if (file.lang === 'javascript') return true;
	return false;
};

const container = document.createElement('div');
container.style.display = 'none';
document.body.appendChild(container);
/**
 * Execute the plugin functionality
 * @param {Object} file - File object with content and metadata
 * @param {Object} config - Plugin configuration
 * @returns {Promise} Execution result
 */
export const execute = async (file) =>
	executeJavaScript(
		file.content,
		{ debug: true, type: file.ext === '.mjs' ? 'module' : 'script' },
		container
	);
