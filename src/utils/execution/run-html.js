/**
 * Pure HTML execution utility
 * Executes HTML code by rendering it in an iframe
 */

/**
 * Execute HTML code in a container element
 * @param {string} code - The HTML code to execute
 * @param {Object} config - Execution configuration options (unused for HTML)
 * @param {HTMLElement} container - DOM element to render results into
 * @returns {Promise<void>} Resolves when execution completes
 */
export const executeHTML = async (code, config = {}, container = null) => {
	// config parameter reserved for future use
	if (!container) {
		console.warn('No container provided for HTML execution');
		return;
	}

	if (!code?.trim()) {
		console.warn('No HTML code to execute');
		return;
	}

	// Clean up container
	cleanupContainer(container);

	try {
		const iframe = document.createElement('iframe');
		iframe.style.cssText = `
			width: 100%;
			height: 400px;
			border: 1px solid #464647;
			background: white;
			border-radius: 4px;
		`;

		iframe.onload = () => {
			iframe.contentDocument.open();
			iframe.contentDocument.write(code);
			iframe.contentDocument.close();
		};

		iframe.src = 'about:blank';
		container.appendChild(iframe);
	} catch (error) {
		console.error('HTML execution error:', error);
		throw error;
	}
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