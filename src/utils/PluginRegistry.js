/**
 * Plugin Registry for Language Compatibility Management
 *
 * Manages plugin compatibility with different programming languages
 * and provides filtering mechanisms for multi-language support.
 */

import { LanguageDetector } from './LanguageDetector.js';

/**
 * Plugin Registry that tracks plugin-language compatibility
 */
export class PluginRegistry {
	/**
	 * Maps plugin IDs to their supported languages
	 * Each plugin can specify:
	 * - supportedLanguages: Array of language identifiers it supports
	 * - excludedLanguages: Array of languages it explicitly doesn't support
	 * - universal: Boolean indicating if it works with all languages
	 */
	static pluginLanguageSupport = new Map();

	/**
	 * Register a plugin with its language support configuration
	 * @param {string} pluginId - The plugin identifier
	 * @param {Object} languageConfig - Language support configuration
	 * @param {Array<string>} [languageConfig.supportedLanguages] - Languages this plugin supports
	 * @param {Array<string>} [languageConfig.excludedLanguages] - Languages this plugin doesn't support
	 * @param {boolean} [languageConfig.universal] - Whether this plugin works with all languages
	 * @param {Array<string>} [languageConfig.requiredFeatures] - Required language features (e.g., 'execution', 'ast')
	 */
	static registerPluginLanguageSupport(pluginId, languageConfig = {}) {
		const config = {
			supportedLanguages: languageConfig.supportedLanguages || [],
			excludedLanguages: languageConfig.excludedLanguages || [],
			universal: languageConfig.universal || false,
			requiredFeatures: languageConfig.requiredFeatures || [],
			...languageConfig,
		};

		this.pluginLanguageSupport.set(pluginId, config);
	}

	/**
	 * Check if a plugin is compatible with a specific language
	 * @param {string} pluginId - Plugin identifier
	 * @param {string} language - Language identifier
	 * @returns {boolean} True if plugin is compatible with the language
	 */
	static isPluginCompatible(pluginId, language) {
		const config = this.pluginLanguageSupport.get(pluginId);
		if (!config) {
			console.warn(
				`Plugin Registry: No language config found for plugin "${pluginId}", assuming compatible`
			);
			return true; // Default to compatible for unknown plugins
		}

		// Check if plugin is universal (works with all languages)
		if (config.universal) {
			// Still check excluded languages for universal plugins
			if (config.excludedLanguages.includes(language)) {
				console.log(
					`Plugin Registry: Universal plugin ${pluginId} excludes language ${language}`
				);
				return false;
			}
			return true;
		}

		// Check if language is explicitly excluded
		if (config.excludedLanguages.includes(language)) {
			console.log(
				`Plugin Registry: Plugin ${pluginId} excludes language ${language}`
			);
			return false;
		}

		// Check if language is in supported languages
		if (config.supportedLanguages.length > 0) {
			const isSupported = config.supportedLanguages.includes(language);

			return isSupported;
		}

		// If no specific languages listed and not universal, default to compatible
		return true;
	}

	/**
	 * Check if a plugin is compatible with a file
	 * @param {string} pluginId - Plugin identifier
	 * @param {Object} file - File object with language metadata
	 * @returns {boolean} True if plugin is compatible with the file
	 */
	static isPluginCompatibleWithFile(pluginId, file) {
		if (!file) return false;

		// Use simplified language detection from file.lang property
		const language = file.lang || LanguageDetector.detectFromFile(file);

		return this.isPluginCompatible(pluginId, language);
	}

	/**
	 * Filter plugins by language compatibility
	 * @param {Array} plugins - Array of plugin objects
	 * @param {string} language - Language identifier
	 * @returns {Array} Filtered array of compatible plugins
	 */
	static filterPluginsByLanguage(plugins, language) {
		return plugins.filter((plugin) => {
			if (!plugin.id) {
				console.warn('Plugin Registry: Plugin missing id:', plugin);
				return false;
			}

			return this.isPluginCompatible(plugin.id, language);
		});
	}

	/**
	 * Filter plugins by file compatibility
	 * @param {Array} plugins - Array of plugin objects
	 * @param {Object} file - File object
	 * @returns {Array} Filtered array of compatible plugins
	 */
	static filterPluginsByFile(plugins, file) {
		if (!file) return [];

		// Use simplified language detection from file.lang property
		const language = file.lang || LanguageDetector.detectFromFile(file);

		return this.filterPluginsByLanguage(plugins, language);
	}

	/**
	 * Get language support information for a plugin
	 * @param {string} pluginId - Plugin identifier
	 * @returns {Object|null} Language support configuration or null if not found
	 */
	static getPluginLanguageSupport(pluginId) {
		return this.pluginLanguageSupport.get(pluginId) || null;
	}

	/**
	 * Get all plugins that support a specific language
	 * @param {string} language - Language identifier
	 * @returns {Array<string>} Array of plugin IDs that support the language
	 */
	static getPluginsForLanguage(language) {
		const compatiblePlugins = [];

		for (const [pluginId, config] of this.pluginLanguageSupport.entries()) {
			if (this.isPluginCompatible(pluginId, language)) {
				compatiblePlugins.push(pluginId);
			}
		}

		return compatiblePlugins;
	}

	/**
	 * Get summary of language support across all registered plugins
	 * @returns {Object} Summary object with language support statistics
	 */
	static getLanguageSupportSummary() {
		const supportedLanguages = LanguageDetector.getSupportedLanguages();
		const summary = {
			totalPlugins: this.pluginLanguageSupport.size,
			languageSupport: {},
			universalPlugins: [],
			languageSpecificPlugins: [],
		};

		// Count support for each language
		for (const language of supportedLanguages) {
			const supportingPlugins = this.getPluginsForLanguage(language);
			summary.languageSupport[language] = {
				pluginCount: supportingPlugins.length,
				plugins: supportingPlugins,
			};
		}

		// Categorize plugins
		for (const [pluginId, config] of this.pluginLanguageSupport.entries()) {
			if (config.universal) {
				summary.universalPlugins.push(pluginId);
			} else {
				summary.languageSpecificPlugins.push(pluginId);
			}
		}

		return summary;
	}

	/**
	 * Register default language support for existing plugins
	 * This sets up the initial compatibility matrix
	 */
	static initializeDefaultPluginSupport() {
		// Run JavaScript plugin - supports JavaScript and web languages
		this.registerPluginLanguageSupport('run-javascript', {
			supportedLanguages: ['javascript', 'typescript', 'html', 'css'],
			requiredFeatures: ['execution'],
		});

		// Trace JavaScript plugin - JavaScript specific
		this.registerPluginLanguageSupport('trace-javascript', {
			supportedLanguages: ['javascript', 'typescript'],
			requiredFeatures: ['ast', 'execution'],
		});

		// Ask JavaScript plugin - JavaScript specific
		this.registerPluginLanguageSupport('ask-javascript', {
			supportedLanguages: ['javascript', 'typescript'],
			requiredFeatures: ['ast'],
		});

		// Tables Universal plugin - works with all languages
		this.registerPluginLanguageSupport('tables-universal', {
			universal: true,
			requiredFeatures: [],
		});

		// Parsons plugin - drag-and-drop code assembly works with all languages
		this.registerPluginLanguageSupport('parsons', {
			universal: true,
			requiredFeatures: [],
		});

		// Render lenses - register language support for lens filtering

		// Study/Editor lenses - universal (work with all programming languages)
		this.registerPluginLanguageSupport('study', {
			universal: true,
			requiredFeatures: [],
		});
		this.registerPluginLanguageSupport('editor', {
			universal: true,
			requiredFeatures: [],
		});

		// Highlight lens - universal (code annotation works with all languages)
		this.registerPluginLanguageSupport('highlight', {
			universal: true,
			requiredFeatures: [],
		});

		// Blanks lens - universal (fill-in-the-blank works with all languages)
		this.registerPluginLanguageSupport('blanks', {
			universal: true,
			requiredFeatures: [],
		});

		// Variables lens - JavaScript specific (requires variable tracking)
		this.registerPluginLanguageSupport('variables', {
			supportedLanguages: ['javascript', 'typescript'],
			requiredFeatures: ['ast', 'execution'],
		});

		// Markdown lens - markdown specific
		this.registerPluginLanguageSupport('markdown', {
			supportedLanguages: ['markdown'],
			requiredFeatures: [],
		});

		// Print lens - universal (pretty printing works with all languages)
		this.registerPluginLanguageSupport('print', {
			universal: true,
			requiredFeatures: [],
		});

		// Write-me lens - universal (code writing exercises work with all languages)
		this.registerPluginLanguageSupport('writeme', {
			universal: true,
			requiredFeatures: [],
		});

		// Step-throughs lens - JavaScript specific (requires execution tracing)
		this.registerPluginLanguageSupport('stepthroughs', {
			supportedLanguages: ['javascript', 'typescript'],
			requiredFeatures: ['execution', 'tracing'],
		});

		// Tracing lens - JavaScript specific (requires execution tracing)
		this.registerPluginLanguageSupport('tracing', {
			supportedLanguages: ['javascript', 'typescript'],
			requiredFeatures: ['execution', 'tracing'],
		});

		console.log(
			'Plugin Registry: Default plugin language support initialized'
		);
	}

	/**
	 * Debug method to log current plugin registry state
	 */
	static debugRegistry() {
		console.log('Plugin Registry State:');
		console.table(
			Array.from(this.pluginLanguageSupport.entries()).map(
				([id, config]) => ({
					pluginId: id,
					universal: config.universal,
					supportedLanguages: config.supportedLanguages.join(', '),
					excludedLanguages: config.excludedLanguages.join(', '),
					requiredFeatures: config.requiredFeatures.join(', '),
				})
			)
		);

		const summary = this.getLanguageSupportSummary();
		console.log('Language Support Summary:', summary);
	}
}

// Initialize default plugin support when module loads
PluginRegistry.initializeDefaultPluginSupport();

export default PluginRegistry;
