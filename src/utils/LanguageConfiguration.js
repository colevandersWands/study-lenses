/**
 * Centralized Language Configuration System
 *
 * Provides language-specific configurations, features, and settings
 * for multi-language support across the application.
 */

import { LanguageDetector } from './LanguageDetector.js';

/**
 * Language feature definitions
 */
export const LANGUAGE_FEATURES = {
	// Code execution capabilities
	EXECUTION: 'execution',

	// AST parsing and analysis
	AST_ANALYSIS: 'ast_analysis',

	// Code formatting support
	FORMATTING: 'formatting',

	// Syntax highlighting
	SYNTAX_HIGHLIGHTING: 'syntax_highlighting',

	// Interactive tracing/debugging
	TRACING: 'tracing',

	// Linting/error checking
	LINTING: 'linting',

	// Auto-completion
	AUTOCOMPLETE: 'autocomplete',

	// Testing framework integration
	TESTING: 'testing',

	// Hot reloading/live editing
	HOT_RELOAD: 'hot_reload',

	// Variable tracking
	VARIABLE_TRACKING: 'variable_tracking',

	// Step-by-step execution
	STEP_EXECUTION: 'step_execution',
};

/**
 * Centralized language configuration registry
 */
export class LanguageConfiguration {
	/**
	 * Language-specific configurations
	 */
	static configurations = new Map([
		// JavaScript Configuration
		[
			'javascript',
			{
				displayName: 'JavaScript',
				fileExtensions: ['.js', '.jsx'],
				mimeTypes: ['text/javascript', 'application/javascript'],
				features: [
					LANGUAGE_FEATURES.EXECUTION,
					LANGUAGE_FEATURES.AST_ANALYSIS,
					LANGUAGE_FEATURES.FORMATTING,
					LANGUAGE_FEATURES.SYNTAX_HIGHLIGHTING,
					LANGUAGE_FEATURES.TRACING,
					LANGUAGE_FEATURES.LINTING,
					LANGUAGE_FEATURES.AUTOCOMPLETE,
					LANGUAGE_FEATURES.TESTING,
					LANGUAGE_FEATURES.HOT_RELOAD,
					LANGUAGE_FEATURES.VARIABLE_TRACKING,
					LANGUAGE_FEATURES.STEP_EXECUTION,
				],
				executionEnvironment: 'browser',
				parserLibrary: 'shift',
				formatterLibrary: 'prettier',
				linterLibrary: 'eslint',
				testingFrameworks: ['jest', 'vitest', 'mocha'],
				defaultSettings: {
					indentSize: 4,
					indentType: 'tabs',
					semicolons: true,
					quotes: 'single',
					trailingComma: 'es5',
				},
				pedagogicalSettings: {
					showLoopGuards: true,
					explainErrors: true,
					highlightScopeChanges: true,
					traceVariableChanges: true,
					stepThroughExecution: true,
				},
			},
		],

		// TypeScript Configuration
		[
			'typescript',
			{
				displayName: 'TypeScript',
				fileExtensions: ['.ts', '.tsx'],
				mimeTypes: ['text/typescript', 'application/typescript'],
				features: [
					LANGUAGE_FEATURES.AST_ANALYSIS,
					LANGUAGE_FEATURES.FORMATTING,
					LANGUAGE_FEATURES.SYNTAX_HIGHLIGHTING,
					LANGUAGE_FEATURES.LINTING,
					LANGUAGE_FEATURES.AUTOCOMPLETE,
					LANGUAGE_FEATURES.TESTING,
				],
				executionEnvironment: 'transpiled', // Needs compilation to JS
				parserLibrary: 'typescript',
				formatterLibrary: 'prettier',
				linterLibrary: 'eslint',
				testingFrameworks: ['jest', 'vitest'],
				defaultSettings: {
					indentSize: 4,
					indentType: 'tabs',
					semicolons: true,
					quotes: 'single',
					strictMode: true,
				},
				pedagogicalSettings: {
					showTypeErrors: true,
					explainTypeSystem: true,
					highlightTypeAnnotations: true,
				},
			},
		],

		// Python Configuration (Phase 2/3 implementation)
		[
			'python',
			{
				displayName: 'Python',
				fileExtensions: ['.py', '.pyx'],
				mimeTypes: ['text/x-python', 'application/x-python'],
				features: [
					LANGUAGE_FEATURES.SYNTAX_HIGHLIGHTING,
					// Note: FORMATTING, EXECUTION, AST, LINTING etc. will be added in Phase 3
				],
				executionEnvironment: 'pyodide', // WebAssembly Python (planned)
				parserLibrary: 'ast', // Python AST module (planned)
				formatterLibrary: 'black', // (planned)
				// linterLibrary: 'pylint', // Removed - not implemented yet
				testingFrameworks: ['pytest', 'unittest'], // (planned)
				defaultSettings: {
					indentSize: 4,
					indentType: 'spaces', // Python convention
					quotes: 'single',
					lineLength: 88, // Black default
				},
				pedagogicalSettings: {
					// These are planned features, not yet implemented
					showIndentationErrors: false, // Will be true when linting is added
					explainScopeRules: false, // Will be true when AST parsing is added
					highlightVariableScope: false, // Will be true when tracing is added
					traceExecution: false, // Will be true when execution is added
				},
				currentImplementation: {
					hasLinting: false,
					hasFormatting: false,
					hasExecution: false,
					hasAST: false,
					hasTracing: false,
				},
				phase2Implementation: true, // Mark as Phase 2
			},
		],

		// HTML Configuration
		[
			'html',
			{
				displayName: 'HTML',
				fileExtensions: ['.html', '.htm'],
				mimeTypes: ['text/html'],
				features: [
					LANGUAGE_FEATURES.SYNTAX_HIGHLIGHTING,
					LANGUAGE_FEATURES.FORMATTING,
					LANGUAGE_FEATURES.LINTING,
					LANGUAGE_FEATURES.HOT_RELOAD,
				],
				executionEnvironment: 'browser',
				formatterLibrary: 'prettier',
				linterLibrary: 'htmlhint',
				defaultSettings: {
					indentSize: 4,
					indentType: 'tabs',
					selfClosingTags: true,
				},
				pedagogicalSettings: {
					showStructure: true,
					highlightSemantics: true,
					explainAccessibility: true,
				},
			},
		],

		// CSS Configuration
		[
			'css',
			{
				displayName: 'CSS',
				fileExtensions: ['.css', '.scss', '.sass'],
				mimeTypes: ['text/css'],
				features: [
					LANGUAGE_FEATURES.SYNTAX_HIGHLIGHTING,
					LANGUAGE_FEATURES.FORMATTING,
					LANGUAGE_FEATURES.LINTING,
					LANGUAGE_FEATURES.HOT_RELOAD,
				],
				executionEnvironment: 'browser',
				formatterLibrary: 'prettier',
				linterLibrary: 'stylelint',
				defaultSettings: {
					indentSize: 4,
					indentType: 'tabs',
					quotes: 'single',
				},
				pedagogicalSettings: {
					showCascade: true,
					highlightSpecificity: true,
					explainBoxModel: true,
				},
			},
		],

		// Markdown Configuration
		[
			'markdown',
			{
				displayName: 'Markdown',
				fileExtensions: ['.md', '.markdown'],
				mimeTypes: ['text/markdown'],
				features: [
					LANGUAGE_FEATURES.SYNTAX_HIGHLIGHTING,
					LANGUAGE_FEATURES.FORMATTING,
				],
				executionEnvironment: 'static',
				formatterLibrary: 'prettier',
				defaultSettings: {
					lineLength: 80,
					emphasisMarker: '*',
					bulletMarker: '-',
				},
				pedagogicalSettings: {
					showPreview: true,
					highlightSyntax: true,
					explainStructure: true,
				},
			},
		],

		// JSON Configuration
		[
			'json',
			{
				displayName: 'JSON',
				fileExtensions: ['.json'],
				mimeTypes: ['application/json'],
				features: [
					LANGUAGE_FEATURES.SYNTAX_HIGHLIGHTING,
					LANGUAGE_FEATURES.FORMATTING,
					LANGUAGE_FEATURES.LINTING,
				],
				executionEnvironment: 'static',
				formatterLibrary: 'prettier',
				linterLibrary: 'jsonlint',
				defaultSettings: {
					indentSize: 4,
					indentType: 'tabs',
				},
				pedagogicalSettings: {
					validateStructure: true,
					showDataTypes: true,
					explainNesting: true,
				},
			},
		],

		// XML Configuration
		[
			'xml',
			{
				displayName: 'XML',
				fileExtensions: ['.xml'],
				mimeTypes: ['text/xml', 'application/xml'],
				features: [
					LANGUAGE_FEATURES.SYNTAX_HIGHLIGHTING,
					LANGUAGE_FEATURES.FORMATTING,
					LANGUAGE_FEATURES.LINTING,
				],
				executionEnvironment: 'static',
				formatterLibrary: 'prettier',
				defaultSettings: {
					indentSize: 4,
					indentType: 'tabs',
					selfClosingTags: true,
				},
				pedagogicalSettings: {
					validateSchema: true,
					showStructure: true,
					explainNamespaces: true,
				},
			},
		],

		// Plain Text Configuration
		[
			'plaintext',
			{
				displayName: 'Plain Text',
				fileExtensions: ['.txt'],
				mimeTypes: ['text/plain'],
				features: [
					// Minimal features for plain text
				],
				executionEnvironment: 'static',
				defaultSettings: {},
				pedagogicalSettings: {},
			},
		],
	]);

	/**
	 * Get configuration for a specific language
	 * @param {string} language - Language identifier
	 * @returns {Object|null} Language configuration or null if not found
	 */
	static getLanguageConfig(language) {
		return this.configurations.get(language) || null;
	}

	/**
	 * Get configuration for a file
	 * @param {Object} file - File object
	 * @returns {Object|null} Language configuration or null if not found
	 */
	static getConfigForFile(file) {
		const language =
			file?.languageMetadata?.detectedLanguage ||
			LanguageDetector.detectFromFile(file);
		return this.getLanguageConfig(language);
	}

	/**
	 * Check if a language supports a specific feature
	 * @param {string} language - Language identifier
	 * @param {string} feature - Feature to check (from LANGUAGE_FEATURES)
	 * @returns {boolean} True if language supports the feature
	 */
	static supportsFeature(language, feature) {
		const config = this.getLanguageConfig(language);
		return config ? config.features.includes(feature) : false;
	}

	/**
	 * Get all languages that support a specific feature
	 * @param {string} feature - Feature to check
	 * @returns {Array<string>} Array of language identifiers
	 */
	static getLanguagesWithFeature(feature) {
		const languages = [];
		for (const [languageId, config] of this.configurations) {
			if (config.features.includes(feature)) {
				languages.push(languageId);
			}
		}
		return languages;
	}

	/**
	 * Get default settings for a language
	 * @param {string} language - Language identifier
	 * @returns {Object} Default settings object
	 */
	static getDefaultSettings(language) {
		const config = this.getLanguageConfig(language);
		return config ? { ...config.defaultSettings } : {};
	}

	/**
	 * Get pedagogical settings for a language
	 * @param {string} language - Language identifier
	 * @returns {Object} Pedagogical settings object
	 */
	static getPedagogicalSettings(language) {
		const config = this.getLanguageConfig(language);
		return config ? { ...config.pedagogicalSettings } : {};
	}

	/**
	 * Get execution environment for a language
	 * @param {string} language - Language identifier
	 * @returns {string|null} Execution environment or null
	 */
	static getExecutionEnvironment(language) {
		const config = this.getLanguageConfig(language);
		return config ? config.executionEnvironment : null;
	}

	/**
	 * Check if a language is ready for implementation
	 * @param {string} language - Language identifier
	 * @returns {Object} Implementation status
	 */
	static getImplementationStatus(language) {
		const config = this.getLanguageConfig(language);
		if (!config) {
			return {
				ready: false,
				phase: 'unknown',
				reason: 'No configuration found',
			};
		}

		if (config.phase2Implementation) {
			return {
				ready: false,
				phase: 'phase2',
				reason: 'Requires Phase 2 implementation',
			};
		}

		const hasExecution = config.features.includes(
			LANGUAGE_FEATURES.EXECUTION
		);
		const hasAST = config.features.includes(LANGUAGE_FEATURES.AST_ANALYSIS);

		if (hasExecution && hasAST) {
			return {
				ready: true,
				phase: 'complete',
				reason: 'Fully implemented',
			};
		} else {
			return {
				ready: true,
				phase: 'partial',
				reason: 'Limited feature set',
			};
		}
	}

	/**
	 * Register a new language configuration
	 * @param {string} language - Language identifier
	 * @param {Object} config - Language configuration
	 */
	static registerLanguage(language, config) {
		this.configurations.set(language, config);
		console.log(`Language Configuration: Registered ${language}`);
	}

	/**
	 * Get all configured languages
	 * @returns {Array<string>} Array of language identifiers
	 */
	static getAllLanguages() {
		return Array.from(this.configurations.keys());
	}

	/**
	 * Get summary of all language configurations
	 * @returns {Object} Summary object
	 */
	static getConfigurationSummary() {
		const summary = {
			totalLanguages: this.configurations.size,
			languagesByFeature: {},
			implementationStatus: {},
			executionEnvironments: {},
		};

		// Group by features
		for (const feature of Object.values(LANGUAGE_FEATURES)) {
			summary.languagesByFeature[feature] =
				this.getLanguagesWithFeature(feature);
		}

		// Group by implementation status
		for (const [language, config] of this.configurations) {
			const status = this.getImplementationStatus(language);
			if (!summary.implementationStatus[status.phase]) {
				summary.implementationStatus[status.phase] = [];
			}
			summary.implementationStatus[status.phase].push(language);

			// Group by execution environment
			const env = config.executionEnvironment;
			if (!summary.executionEnvironments[env]) {
				summary.executionEnvironments[env] = [];
			}
			summary.executionEnvironments[env].push(language);
		}

		return summary;
	}

	/**
	 * Debug method to show all configurations
	 */
	static debugConfigurations() {
		console.log('=== Language Configuration Debug ===');
		console.table(
			Array.from(this.configurations.entries()).map(([id, config]) => ({
				language: id,
				displayName: config.displayName,
				features: config.features.length,
				executionEnv: config.executionEnvironment,
				phase2: config.phase2Implementation || false,
			}))
		);

		const summary = this.getConfigurationSummary();
		console.log('Configuration Summary:', summary);
	}
}

export default LanguageConfiguration;
