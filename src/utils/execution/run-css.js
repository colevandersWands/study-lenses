/**
 * Pure CSS execution utility
 * Executes CSS code by showing it with sample HTML in an iframe
 */

import { executeHTML } from './run-html.js';

/**
 * Execute CSS code in a container element
 * @param {string} code - The CSS code to execute
 * @param {Object} config - Execution configuration options
 * @param {HTMLElement} container - DOM element to render results into
 * @returns {Promise<void>} Resolves when execution completes
 */
export const executeCSS = async (code, config = {}, container = null) => {
	if (!container) {
		console.warn('No container provided for CSS execution');
		return;
	}

	if (!code?.trim()) {
		console.warn('No CSS code to execute');
		return;
	}

	const sampleHTML = `
		<!DOCTYPE html>
		<html>
		<head>
			<style>
				${code}
			</style>
		</head>
		<body>
			<h1>CSS Preview</h1>
			<p>This is a paragraph to demonstrate your CSS.</p>
			<div class="example">Sample div with class "example"</div>
			<button>Sample button</button>
			<ul>
				<li>List item 1</li>
				<li>List item 2</li>
			</ul>
		</body>
		</html>
	`;

	return await executeHTML(sampleHTML, config, container);
};