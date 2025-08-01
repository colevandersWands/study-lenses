/**
 * Language Detection System for Multi-Language Support
 *
 * Maps file extensions to language configurations and provides
 * utilities for dynamic CodeMirror language loading.
 */

// Maps file extensions to internal language identifiers
const LANGUAGE_MAPPINGS = {
	'.js': 'javascript',
	js: 'javascript',
	'.mjs': 'javascript',
	mjs: 'javascript',
	'.jsx': 'javascript',
	jsx: 'javascript',
	'.ts': 'typescript',
	ts: 'typescript',
	'.tsx': 'typescript',
	tsx: 'typescript',
	'.py': 'python',
	py: 'python',
	'.pyx': 'python',
	pyx: 'python',
	'.html': 'html',
	html: 'html',
	'.htm': 'html',
	htm: 'html',
	'.css': 'css',
	css: 'css',
	'.scss': 'css',
	scss: 'css',
	'.sass': 'css',
	sass: 'css',
	'.md': 'markdown',
	md: 'markdown',
	'.markdown': 'markdown',
	markdown: 'markdown',
	'.json': 'json',
	json: 'json',
	'.xml': 'xml',
	xml: 'xml',
	'.yaml': 'yaml',
	yaml: 'yaml',
	'.yml': 'yaml',
	yml: 'yaml',
};

/**
 * Central language detection and configuration system
 */
export class LanguageDetector {
	/**
	 * Detects programming language from file object
	 * @param {Object} file - File object with ext property
	 * @returns {string} Language identifier (e.g., 'javascript', 'python')
	 */
	static detectFromFile(file) {
		if (!file || !file.ext) {
			// console.log(
			// 	'🔍 LanguageDetector: No file extension found, defaulting to plaintext'
			// );
			return 'plaintext';
		}

		const language = LANGUAGE_MAPPINGS[file.ext.toLowerCase()];
		if (language) {
			return language;
		}

		return 'plaintext';
	}

	/**
	 * Gets CodeMirror language package loader for a given language
	 * @param {string} language - Language identifier
	 * @returns {Function|null} Dynamic import function for CodeMirror language package
	 */
	static getCodeMirrorLanguage(language) {
		const cmMappings = {
			javascript: () => import('@codemirror/lang-javascript'),
			typescript: () => import('@codemirror/lang-javascript'), // TS uses JS package
			python: () => import('@codemirror/lang-python'),
			html: () => import('@codemirror/lang-html'),
			css: () => import('@codemirror/lang-css'),
			markdown: () => import('@codemirror/lang-markdown'),
			json: () => import('@codemirror/lang-json'),
			xml: () => import('@codemirror/lang-xml'),
		};

		const loader = cmMappings[language];
		if (loader) {
			// console.log(
			// 	`LanguageDetector: CodeMirror loader available for ${language}`
			// );
		} else {
			// console.log(
			// 	`LanguageDetector: No CodeMirror support for ${language}`
			// );
		}

		return loader || null;
	}

	/**
	 * Gets the appropriate language mode name for CodeMirror
	 * @param {string} language - Language identifier
	 * @returns {string} CodeMirror mode name
	 */
	static getCodeMirrorModeName(language) {
		const modeNames = {
			javascript: 'javascript',
			typescript: 'javascript', // TypeScript uses JavaScript mode with TS features
			python: 'python',
			html: 'html',
			css: 'css',
			markdown: 'markdown',
			json: 'json',
			xml: 'xml',
			plaintext: 'null', // CodeMirror null mode for plain text
		};

		return modeNames[language] || 'null';
	}

	/**
	 * Gets all supported languages
	 * @returns {Array<string>} List of supported language identifiers
	 */
	static getSupportedLanguages() {
		return Object.values(LANGUAGE_MAPPINGS)
			.filter(
				(lang, index, self) => self.indexOf(lang) === index // Remove duplicates
			)
			.concat(['plaintext']);
	}

	/**
	 * Gets all supported file extensions
	 * @returns {Array<string>} List of supported file extensions
	 */
	static getSupportedExtensions() {
		return Object.keys(LANGUAGE_MAPPINGS);
	}

	/**
	 * Checks if a language is supported
	 * @param {string} language - Language identifier to check
	 * @returns {boolean} True if language is supported
	 */
	static isLanguageSupported(language) {
		return this.getSupportedLanguages().includes(language);
	}

	/**
	 * Checks if a file extension is supported
	 * @param {string} extension - File extension to check (with or without dot)
	 * @returns {boolean} True if extension is supported
	 */
	static isExtensionSupported(extension) {
		const normalizedExt = extension.startsWith('.')
			? extension
			: `.${extension}`;
		return Object.keys(LANGUAGE_MAPPINGS).includes(normalizedExt);
	}

	/**
	 * Gets display information for a language
	 * @param {string} language - Language identifier
	 * @returns {Object} Display information (name, description, etc.)
	 */
	static getLanguageInfo(language) {
		const languageInfo = {
			javascript: {
				name: 'JavaScript',
				description: 'Dynamic programming language for web development',
				category: 'programming',
			},
			typescript: {
				name: 'TypeScript',
				description: 'Typed superset of JavaScript',
				category: 'programming',
			},
			python: {
				name: 'Python',
				description: 'High-level programming language',
				category: 'programming',
			},
			html: {
				name: 'HTML',
				description: 'HyperText Markup Language',
				category: 'markup',
			},
			css: {
				name: 'CSS',
				description: 'Cascading Style Sheets',
				category: 'styling',
			},
			markdown: {
				name: 'Markdown',
				description: 'Lightweight markup language',
				category: 'markup',
			},
			json: {
				name: 'JSON',
				description: 'JavaScript Object Notation',
				category: 'data',
			},
			xml: {
				name: 'XML',
				description: 'Extensible Markup Language',
				category: 'markup',
			},
			plaintext: {
				name: 'Plain Text',
				description: 'Unformatted text',
				category: 'text',
			},
		};

		return (
			languageInfo[language] || {
				name: 'Unknown',
				description: 'Unknown file type',
				category: 'unknown',
			}
		);
	}
}

// Export default instance for convenience
export default LanguageDetector;
