/**
 * Tests for Plugin Registry System
 * Validates plugin-language compatibility management
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PluginRegistry } from '../PluginRegistry.js';
import { LanguageDetector } from '../LanguageDetector.js';

describe('PluginRegistry', () => {
	beforeEach(() => {
		// Clear registry and reinitialize for each test
		PluginRegistry.pluginLanguageSupport.clear();
		PluginRegistry.initializeDefaultPluginSupport();
	});

	describe('Plugin Registration', () => {
		it('should register plugin with language support configuration', () => {
			PluginRegistry.registerPluginLanguageSupport('test-plugin', {
				supportedLanguages: ['javascript', 'python'],
				excludedLanguages: ['css'],
				universal: false,
				requiredFeatures: ['ast'],
			});

			const config =
				PluginRegistry.getPluginLanguageSupport('test-plugin');
			expect(config).toEqual({
				supportedLanguages: ['javascript', 'python'],
				excludedLanguages: ['css'],
				universal: false,
				requiredFeatures: ['ast'],
			});
		});

		it('should handle universal plugins', () => {
			PluginRegistry.registerPluginLanguageSupport('universal-plugin', {
				universal: true,
				excludedLanguages: ['plaintext'],
			});

			expect(
				PluginRegistry.isPluginCompatible(
					'universal-plugin',
					'javascript'
				)
			).toBe(true);
			expect(
				PluginRegistry.isPluginCompatible('universal-plugin', 'python')
			).toBe(true);
			expect(
				PluginRegistry.isPluginCompatible(
					'universal-plugin',
					'plaintext'
				)
			).toBe(false);
		});

		it('should handle plugin registration with minimal config', () => {
			PluginRegistry.registerPluginLanguageSupport('minimal-plugin');

			const config =
				PluginRegistry.getPluginLanguageSupport('minimal-plugin');
			expect(config.supportedLanguages).toEqual([]);
			expect(config.excludedLanguages).toEqual([]);
			expect(config.universal).toBe(false);
			expect(config.requiredFeatures).toEqual([]);
		});
	});

	describe('Compatibility Checking', () => {
		beforeEach(() => {
			PluginRegistry.registerPluginLanguageSupport('js-only', {
				supportedLanguages: ['javascript', 'typescript'],
			});

			PluginRegistry.registerPluginLanguageSupport('exclude-python', {
				universal: true,
				excludedLanguages: ['python'],
			});

			PluginRegistry.registerPluginLanguageSupport('python-specific', {
				supportedLanguages: ['python'],
			});
		});

		it('should correctly identify compatible plugins', () => {
			expect(
				PluginRegistry.isPluginCompatible('js-only', 'javascript')
			).toBe(true);
			expect(
				PluginRegistry.isPluginCompatible('js-only', 'typescript')
			).toBe(true);
			expect(PluginRegistry.isPluginCompatible('js-only', 'python')).toBe(
				false
			);

			expect(
				PluginRegistry.isPluginCompatible(
					'exclude-python',
					'javascript'
				)
			).toBe(true);
			expect(
				PluginRegistry.isPluginCompatible('exclude-python', 'python')
			).toBe(false);

			expect(
				PluginRegistry.isPluginCompatible('python-specific', 'python')
			).toBe(true);
			expect(
				PluginRegistry.isPluginCompatible(
					'python-specific',
					'javascript'
				)
			).toBe(false);
		});

		it('should handle unknown plugins gracefully', () => {
			expect(
				PluginRegistry.isPluginCompatible(
					'unknown-plugin',
					'javascript'
				)
			).toBe(true);
		});

		it('should check file compatibility', () => {
			const jsFile = { ext: '.js', name: 'test.js' };
			const pyFile = { ext: '.py', name: 'test.py' };

			expect(
				PluginRegistry.isPluginCompatibleWithFile('js-only', jsFile)
			).toBe(true);
			expect(
				PluginRegistry.isPluginCompatibleWithFile('js-only', pyFile)
			).toBe(false);
			expect(
				PluginRegistry.isPluginCompatibleWithFile(
					'python-specific',
					pyFile
				)
			).toBe(true);
		});

		it('should use language metadata when available', () => {
			const fileWithMetadata = {
				ext: '.js',
				name: 'test.js',
				languageMetadata: {
					detectedLanguage: 'javascript',
				},
			};

			expect(
				PluginRegistry.isPluginCompatibleWithFile(
					'js-only',
					fileWithMetadata
				)
			).toBe(true);
		});
	});

	describe('Plugin Filtering', () => {
		beforeEach(() => {
			PluginRegistry.registerPluginLanguageSupport('plugin-a', {
				supportedLanguages: ['javascript'],
			});

			PluginRegistry.registerPluginLanguageSupport('plugin-b', {
				supportedLanguages: ['python'],
			});

			PluginRegistry.registerPluginLanguageSupport('plugin-universal', {
				universal: true,
			});
		});

		it('should filter plugins by language', () => {
			const allPlugins = [
				{ id: 'plugin-a' },
				{ id: 'plugin-b' },
				{ id: 'plugin-universal' },
			];

			const jsPlugins = PluginRegistry.filterPluginsByLanguage(
				allPlugins,
				'javascript'
			);
			const pyPlugins = PluginRegistry.filterPluginsByLanguage(
				allPlugins,
				'python'
			);

			expect(jsPlugins).toHaveLength(2);
			expect(jsPlugins.map((p) => p.id)).toContain('plugin-a');
			expect(jsPlugins.map((p) => p.id)).toContain('plugin-universal');

			expect(pyPlugins).toHaveLength(2);
			expect(pyPlugins.map((p) => p.id)).toContain('plugin-b');
			expect(pyPlugins.map((p) => p.id)).toContain('plugin-universal');
		});

		it('should filter plugins by file', () => {
			const allPlugins = [
				{ id: 'plugin-a' },
				{ id: 'plugin-b' },
				{ id: 'plugin-universal' },
			];

			const jsFile = { ext: '.js', name: 'test.js' };
			const filteredPlugins = PluginRegistry.filterPluginsByFile(
				allPlugins,
				jsFile
			);

			expect(filteredPlugins).toHaveLength(2);
			expect(filteredPlugins.map((p) => p.id)).toContain('plugin-a');
			expect(filteredPlugins.map((p) => p.id)).toContain(
				'plugin-universal'
			);
		});

		it('should handle plugins without id gracefully', () => {
			const pluginsWithBadData = [
				{ id: 'good-plugin' },
				{
					/* missing id */
				},
				{ id: 'another-good-plugin' },
			];

			const filtered = PluginRegistry.filterPluginsByLanguage(
				pluginsWithBadData,
				'javascript'
			);
			expect(filtered).toHaveLength(2); // Good plugins pass through, bad ones filtered out
			expect(filtered.every((p) => p.id)).toBe(true); // All remaining have ids
		});
	});

	describe('Language Support Queries', () => {
		beforeEach(() => {
			PluginRegistry.registerPluginLanguageSupport('js-plugin', {
				supportedLanguages: ['javascript', 'typescript'],
			});

			PluginRegistry.registerPluginLanguageSupport('py-plugin', {
				supportedLanguages: ['python'],
			});

			PluginRegistry.registerPluginLanguageSupport('universal-plugin', {
				universal: true,
			});
		});

		it('should get plugins for specific language', () => {
			const jsPlugins =
				PluginRegistry.getPluginsForLanguage('javascript');
			const pyPlugins = PluginRegistry.getPluginsForLanguage('python');

			expect(jsPlugins).toContain('js-plugin');
			expect(jsPlugins).toContain('universal-plugin');
			expect(jsPlugins).not.toContain('py-plugin');

			expect(pyPlugins).toContain('py-plugin');
			expect(pyPlugins).toContain('universal-plugin');
			expect(pyPlugins).not.toContain('js-plugin');
		});

		it('should generate language support summary', () => {
			const summary = PluginRegistry.getLanguageSupportSummary();

			expect(summary).toHaveProperty('totalPlugins');
			expect(summary).toHaveProperty('languageSupport');
			expect(summary).toHaveProperty('universalPlugins');
			expect(summary).toHaveProperty('languageSpecificPlugins');

			expect(summary.universalPlugins).toContain('universal-plugin');
			expect(summary.languageSpecificPlugins).toContain('js-plugin');
			expect(summary.languageSpecificPlugins).toContain('py-plugin');

			expect(summary.languageSupport.javascript.plugins).toContain(
				'js-plugin'
			);
			expect(summary.languageSupport.python.plugins).toContain(
				'py-plugin'
			);
		});
	});

	describe('Default Plugin Support', () => {
		it('should initialize with default plugins', () => {
			// Check that default plugins are registered
			expect(
				PluginRegistry.getPluginLanguageSupport('run-javascript')
			).toBeTruthy();
			expect(
				PluginRegistry.getPluginLanguageSupport('trace-javascript')
			).toBeTruthy();
			expect(
				PluginRegistry.getPluginLanguageSupport('ask-javascript')
			).toBeTruthy();
			expect(
				PluginRegistry.getPluginLanguageSupport('tables-universal')
			).toBeTruthy();
			expect(
				PluginRegistry.getPluginLanguageSupport('format-code')
			).toBeTruthy();
		});

		it('should configure JavaScript plugins correctly', () => {
			const runJsConfig =
				PluginRegistry.getPluginLanguageSupport('run-javascript');
			expect(runJsConfig.supportedLanguages).toContain('javascript');
			expect(runJsConfig.supportedLanguages).toContain('typescript');

			const traceJsConfig =
				PluginRegistry.getPluginLanguageSupport('trace-javascript');
			expect(traceJsConfig.supportedLanguages).toContain('javascript');
			expect(traceJsConfig.supportedLanguages).toContain('typescript');
		});

		it('should configure universal plugins correctly', () => {
			const tablesConfig =
				PluginRegistry.getPluginLanguageSupport('tables-universal');
			expect(tablesConfig.universal).toBe(true);
		});
	});

	describe('Integration with LanguageDetector', () => {
		it('should work with LanguageDetector for file detection', () => {
			const jsFile = { ext: '.js', name: 'script.js' };
			const pyFile = { ext: '.py', name: 'script.py' };

			// Should detect language and check compatibility
			expect(
				PluginRegistry.isPluginCompatibleWithFile(
					'run-javascript',
					jsFile
				)
			).toBe(true);
			expect(
				PluginRegistry.isPluginCompatibleWithFile(
					'run-javascript',
					pyFile
				)
			).toBe(false);
		});

		it('should handle files with different extensions', () => {
			const htmlFile = { ext: '.html', name: 'page.html' };
			const cssFile = { ext: '.css', name: 'styles.css' };

			expect(
				PluginRegistry.isPluginCompatibleWithFile(
					'run-javascript',
					htmlFile
				)
			).toBe(true);
			expect(
				PluginRegistry.isPluginCompatibleWithFile(
					'run-javascript',
					cssFile
				)
			).toBe(true);
		});
	});
});
