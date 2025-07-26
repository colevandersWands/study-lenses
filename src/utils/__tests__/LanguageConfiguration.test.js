/**
 * Tests for Language Configuration System
 * Validates centralized language configuration management
 */

import { describe, it, expect } from 'vitest';
import {
	LanguageConfiguration,
	LANGUAGE_FEATURES,
} from '../LanguageConfiguration.js';

describe('LanguageConfiguration', () => {
	describe('Basic Configuration Access', () => {
		it('should get configuration for known languages', () => {
			const jsConfig =
				LanguageConfiguration.getLanguageConfig('javascript');
			expect(jsConfig).toBeTruthy();
			expect(jsConfig.displayName).toBe('JavaScript');
			expect(jsConfig.fileExtensions).toContain('.js');

			const pyConfig = LanguageConfiguration.getLanguageConfig('python');
			expect(pyConfig).toBeTruthy();
			expect(pyConfig.displayName).toBe('Python');
			expect(pyConfig.fileExtensions).toContain('.py');
		});

		it('should return null for unknown languages', () => {
			const unknownConfig =
				LanguageConfiguration.getLanguageConfig('unknown-lang');
			expect(unknownConfig).toBe(null);
		});

		it('should get configuration for files', () => {
			const jsFile = { ext: '.js', name: 'test.js' };
			const config = LanguageConfiguration.getConfigForFile(jsFile);
			expect(config).toBeTruthy();
			expect(config.displayName).toBe('JavaScript');

			const pyFile = { ext: '.py', name: 'test.py' };
			const pyConfig = LanguageConfiguration.getConfigForFile(pyFile);
			expect(pyConfig).toBeTruthy();
			expect(pyConfig.displayName).toBe('Python');
		});

		it('should handle files with language metadata', () => {
			const fileWithMetadata = {
				ext: '.js',
				name: 'test.js',
				languageMetadata: {
					detectedLanguage: 'javascript',
				},
			};

			const config =
				LanguageConfiguration.getConfigForFile(fileWithMetadata);
			expect(config.displayName).toBe('JavaScript');
		});
	});

	describe('Feature Support', () => {
		it('should correctly identify feature support', () => {
			// JavaScript should support execution
			expect(
				LanguageConfiguration.supportsFeature(
					'javascript',
					LANGUAGE_FEATURES.EXECUTION
				)
			).toBe(true);
			expect(
				LanguageConfiguration.supportsFeature(
					'javascript',
					LANGUAGE_FEATURES.AST_ANALYSIS
				)
			).toBe(true);
			expect(
				LanguageConfiguration.supportsFeature(
					'javascript',
					LANGUAGE_FEATURES.TRACING
				)
			).toBe(true);

			// Python (Phase 2) should have limited features
			expect(
				LanguageConfiguration.supportsFeature(
					'python',
					LANGUAGE_FEATURES.SYNTAX_HIGHLIGHTING
				)
			).toBe(true);
			expect(
				LanguageConfiguration.supportsFeature(
					'python',
					LANGUAGE_FEATURES.FORMATTING
				)
			).toBe(true);

			// Plain text should have minimal features
			expect(
				LanguageConfiguration.supportsFeature(
					'plaintext',
					LANGUAGE_FEATURES.EXECUTION
				)
			).toBe(false);
			expect(
				LanguageConfiguration.supportsFeature(
					'plaintext',
					LANGUAGE_FEATURES.AST_ANALYSIS
				)
			).toBe(false);
		});

		it('should get languages that support specific features', () => {
			const executionLanguages =
				LanguageConfiguration.getLanguagesWithFeature(
					LANGUAGE_FEATURES.EXECUTION
				);
			expect(executionLanguages).toContain('javascript');
			expect(executionLanguages).not.toContain('python'); // Phase 2 limitation

			const syntaxHighlightLanguages =
				LanguageConfiguration.getLanguagesWithFeature(
					LANGUAGE_FEATURES.SYNTAX_HIGHLIGHTING
				);
			expect(syntaxHighlightLanguages).toContain('javascript');
			expect(syntaxHighlightLanguages).toContain('python');
			expect(syntaxHighlightLanguages).toContain('html');
			expect(syntaxHighlightLanguages).toContain('css');
		});

		it('should handle unknown features gracefully', () => {
			const languages =
				LanguageConfiguration.getLanguagesWithFeature(
					'unknown-feature'
				);
			expect(languages).toEqual([]);
		});
	});

	describe('Settings and Configuration', () => {
		it('should get default settings for languages', () => {
			const jsSettings =
				LanguageConfiguration.getDefaultSettings('javascript');
			expect(jsSettings.indentSize).toBe(4);
			expect(jsSettings.indentType).toBe('tabs');
			expect(jsSettings.quotes).toBe('single');

			const pySettings =
				LanguageConfiguration.getDefaultSettings('python');
			expect(pySettings.indentSize).toBe(4);
			expect(pySettings.indentType).toBe('spaces'); // Python convention
		});

		it('should get pedagogical settings for languages', () => {
			const jsPedagogical =
				LanguageConfiguration.getPedagogicalSettings('javascript');
			expect(jsPedagogical.showLoopGuards).toBe(true);
			expect(jsPedagogical.traceVariableChanges).toBe(true);

			const htmlPedagogical =
				LanguageConfiguration.getPedagogicalSettings('html');
			expect(htmlPedagogical.showStructure).toBe(true);
			expect(htmlPedagogical.explainAccessibility).toBe(true);
		});

		it('should return empty objects for unknown languages', () => {
			const unknownSettings =
				LanguageConfiguration.getDefaultSettings('unknown');
			expect(unknownSettings).toEqual({});

			const unknownPedagogical =
				LanguageConfiguration.getPedagogicalSettings('unknown');
			expect(unknownPedagogical).toEqual({});
		});
	});

	describe('Execution Environment', () => {
		it('should get execution environments for languages', () => {
			expect(
				LanguageConfiguration.getExecutionEnvironment('javascript')
			).toBe('browser');
			expect(
				LanguageConfiguration.getExecutionEnvironment('python')
			).toBe('pyodide');
			expect(
				LanguageConfiguration.getExecutionEnvironment('typescript')
			).toBe('transpiled');
			expect(LanguageConfiguration.getExecutionEnvironment('html')).toBe(
				'browser'
			);
			expect(
				LanguageConfiguration.getExecutionEnvironment('markdown')
			).toBe('static');
		});

		it('should return null for unknown languages', () => {
			expect(
				LanguageConfiguration.getExecutionEnvironment('unknown')
			).toBe(null);
		});
	});

	describe('Implementation Status', () => {
		it('should correctly identify implementation phases', () => {
			const jsStatus =
				LanguageConfiguration.getImplementationStatus('javascript');
			expect(jsStatus.ready).toBe(true);
			expect(jsStatus.phase).toBe('complete');

			const pyStatus =
				LanguageConfiguration.getImplementationStatus('python');
			expect(pyStatus.ready).toBe(false);
			expect(pyStatus.phase).toBe('phase2');

			const htmlStatus =
				LanguageConfiguration.getImplementationStatus('html');
			expect(htmlStatus.ready).toBe(true);
			expect(htmlStatus.phase).toBe('partial'); // No execution/AST

			const unknownStatus =
				LanguageConfiguration.getImplementationStatus('unknown');
			expect(unknownStatus.ready).toBe(false);
			expect(unknownStatus.phase).toBe('unknown');
		});
	});

	describe('Language Registration', () => {
		it('should register new languages', () => {
			const testConfig = {
				displayName: 'Test Language',
				fileExtensions: ['.test'],
				features: [LANGUAGE_FEATURES.SYNTAX_HIGHLIGHTING],
				executionEnvironment: 'test',
				defaultSettings: { test: true },
				pedagogicalSettings: { testMode: true },
			};

			LanguageConfiguration.registerLanguage('test-lang', testConfig);

			const retrievedConfig =
				LanguageConfiguration.getLanguageConfig('test-lang');
			expect(retrievedConfig).toEqual(testConfig);
			expect(retrievedConfig.displayName).toBe('Test Language');
		});
	});

	describe('Summary and Debug Functions', () => {
		it('should get all configured languages', () => {
			const languages = LanguageConfiguration.getAllLanguages();
			expect(languages).toContain('javascript');
			expect(languages).toContain('python');
			expect(languages).toContain('html');
			expect(languages).toContain('css');
			expect(languages).toContain('markdown');
			expect(languages).toContain('json');
			expect(languages).toContain('xml');
			expect(languages).toContain('plaintext');
		});

		it('should generate configuration summary', () => {
			const summary = LanguageConfiguration.getConfigurationSummary();

			expect(summary).toHaveProperty('totalLanguages');
			expect(summary).toHaveProperty('languagesByFeature');
			expect(summary).toHaveProperty('implementationStatus');
			expect(summary).toHaveProperty('executionEnvironments');

			// Check feature grouping
			expect(
				summary.languagesByFeature[LANGUAGE_FEATURES.EXECUTION]
			).toContain('javascript');
			expect(
				summary.languagesByFeature[
					LANGUAGE_FEATURES.SYNTAX_HIGHLIGHTING
				]
			).toContain('python');

			// Check implementation status grouping
			expect(summary.implementationStatus.complete).toContain(
				'javascript'
			);
			expect(summary.implementationStatus.phase2).toContain('python');

			// Check execution environment grouping
			expect(summary.executionEnvironments.browser).toContain(
				'javascript'
			);
			expect(summary.executionEnvironments.pyodide).toContain('python');
			expect(summary.executionEnvironments.static).toContain('markdown');
		});

		it('should handle debug methods without errors', () => {
			// These should not throw
			expect(() => {
				LanguageConfiguration.debugConfigurations();
			}).not.toThrow();
		});
	});

	describe('Language Feature Constants', () => {
		it('should have all expected language features defined', () => {
			expect(LANGUAGE_FEATURES.EXECUTION).toBe('execution');
			expect(LANGUAGE_FEATURES.AST_ANALYSIS).toBe('ast_analysis');
			expect(LANGUAGE_FEATURES.FORMATTING).toBe('formatting');
			expect(LANGUAGE_FEATURES.SYNTAX_HIGHLIGHTING).toBe(
				'syntax_highlighting'
			);
			expect(LANGUAGE_FEATURES.TRACING).toBe('tracing');
			expect(LANGUAGE_FEATURES.LINTING).toBe('linting');
			expect(LANGUAGE_FEATURES.AUTOCOMPLETE).toBe('autocomplete');
			expect(LANGUAGE_FEATURES.TESTING).toBe('testing');
			expect(LANGUAGE_FEATURES.HOT_RELOAD).toBe('hot_reload');
			expect(LANGUAGE_FEATURES.VARIABLE_TRACKING).toBe(
				'variable_tracking'
			);
			expect(LANGUAGE_FEATURES.STEP_EXECUTION).toBe('step_execution');
		});
	});

	describe('Integration Scenarios', () => {
		it('should handle complete workflow for JavaScript', () => {
			const jsFile = { ext: '.js', name: 'app.js' };

			// Get config
			const config = LanguageConfiguration.getConfigForFile(jsFile);
			expect(config.displayName).toBe('JavaScript');

			// Check features
			expect(
				LanguageConfiguration.supportsFeature(
					'javascript',
					LANGUAGE_FEATURES.EXECUTION
				)
			).toBe(true);

			// Get settings
			const settings =
				LanguageConfiguration.getDefaultSettings('javascript');
			expect(settings.indentType).toBe('tabs');

			// Check implementation status
			const status =
				LanguageConfiguration.getImplementationStatus('javascript');
			expect(status.ready).toBe(true);
		});

		it('should handle Phase 2 workflow for Python', () => {
			const pyFile = { ext: '.py', name: 'script.py' };

			// Get config
			const config = LanguageConfiguration.getConfigForFile(pyFile);
			expect(config.displayName).toBe('Python');

			// Check limited features
			expect(
				LanguageConfiguration.supportsFeature(
					'python',
					LANGUAGE_FEATURES.SYNTAX_HIGHLIGHTING
				)
			).toBe(true);
			expect(
				LanguageConfiguration.supportsFeature(
					'python',
					LANGUAGE_FEATURES.EXECUTION
				)
			).toBe(false);

			// Check Phase 2 status
			const status =
				LanguageConfiguration.getImplementationStatus('python');
			expect(status.phase).toBe('phase2');
			expect(status.ready).toBe(false);
		});

		it('should handle markup languages appropriately', () => {
			const htmlFile = { ext: '.html', name: 'page.html' };
			const cssFile = { ext: '.css', name: 'styles.css' };

			// HTML
			const htmlConfig = LanguageConfiguration.getConfigForFile(htmlFile);
			expect(htmlConfig.displayName).toBe('HTML');
			expect(
				LanguageConfiguration.supportsFeature(
					'html',
					LANGUAGE_FEATURES.HOT_RELOAD
				)
			).toBe(true);
			expect(LanguageConfiguration.getExecutionEnvironment('html')).toBe(
				'browser'
			);

			// CSS
			const cssConfig = LanguageConfiguration.getConfigForFile(cssFile);
			expect(cssConfig.displayName).toBe('CSS');
			expect(
				LanguageConfiguration.supportsFeature(
					'css',
					LANGUAGE_FEATURES.HOT_RELOAD
				)
			).toBe(true);
			expect(LanguageConfiguration.getExecutionEnvironment('css')).toBe(
				'browser'
			);
		});
	});
});
