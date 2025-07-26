/**
 * Tests for Language Detection System
 * Validates multi-language support infrastructure
 */

import { describe, it, expect } from 'vitest';
import { LanguageDetector } from '../utils/LanguageDetector.js';

describe('LanguageDetector', () => {
	describe('detectFromFile', () => {
		it('should detect JavaScript files correctly', () => {
			const jsFile = { ext: '.js', name: 'test.js' };
			expect(LanguageDetector.detectFromFile(jsFile)).toBe('javascript');

			const jsxFile = { ext: '.jsx', name: 'component.jsx' };
			expect(LanguageDetector.detectFromFile(jsxFile)).toBe('javascript');
		});

		it('should detect TypeScript files correctly', () => {
			const tsFile = { ext: '.ts', name: 'test.ts' };
			expect(LanguageDetector.detectFromFile(tsFile)).toBe('typescript');

			const tsxFile = { ext: '.tsx', name: 'component.tsx' };
			expect(LanguageDetector.detectFromFile(tsxFile)).toBe('typescript');
		});

		it('should detect Python files correctly', () => {
			const pyFile = { ext: '.py', name: 'script.py' };
			expect(LanguageDetector.detectFromFile(pyFile)).toBe('python');

			const pyxFile = { ext: '.pyx', name: 'cython.pyx' };
			expect(LanguageDetector.detectFromFile(pyxFile)).toBe('python');
		});

		it('should detect HTML files correctly', () => {
			const htmlFile = { ext: '.html', name: 'page.html' };
			expect(LanguageDetector.detectFromFile(htmlFile)).toBe('html');

			const htmFile = { ext: '.htm', name: 'page.htm' };
			expect(LanguageDetector.detectFromFile(htmFile)).toBe('html');
		});

		it('should detect CSS files correctly', () => {
			const cssFile = { ext: '.css', name: 'styles.css' };
			expect(LanguageDetector.detectFromFile(cssFile)).toBe('css');

			const scssFile = { ext: '.scss', name: 'styles.scss' };
			expect(LanguageDetector.detectFromFile(scssFile)).toBe('css');

			const sassFile = { ext: '.sass', name: 'styles.sass' };
			expect(LanguageDetector.detectFromFile(sassFile)).toBe('css');
		});

		it('should detect Markdown files correctly', () => {
			const mdFile = { ext: '.md', name: 'readme.md' };
			expect(LanguageDetector.detectFromFile(mdFile)).toBe('markdown');

			const markdownFile = { ext: '.markdown', name: 'doc.markdown' };
			expect(LanguageDetector.detectFromFile(markdownFile)).toBe(
				'markdown'
			);
		});

		it('should detect JSON and XML files correctly', () => {
			const jsonFile = { ext: '.json', name: 'data.json' };
			expect(LanguageDetector.detectFromFile(jsonFile)).toBe('json');

			const xmlFile = { ext: '.xml', name: 'config.xml' };
			expect(LanguageDetector.detectFromFile(xmlFile)).toBe('xml');
		});

		it('should handle case-insensitive extensions', () => {
			const upperFile = { ext: '.JS', name: 'test.JS' };
			expect(LanguageDetector.detectFromFile(upperFile)).toBe(
				'javascript'
			);

			const mixedFile = { ext: '.Py', name: 'script.Py' };
			expect(LanguageDetector.detectFromFile(mixedFile)).toBe('python');
		});

		it('should fallback to plaintext for unknown extensions', () => {
			const unknownFile = { ext: '.xyz', name: 'unknown.xyz' };
			expect(LanguageDetector.detectFromFile(unknownFile)).toBe(
				'plaintext'
			);

			const noExtFile = { ext: '.unknown123', name: 'test.unknown123' };
			expect(LanguageDetector.detectFromFile(noExtFile)).toBe(
				'plaintext'
			);
		});

		it('should handle missing or invalid file objects', () => {
			expect(LanguageDetector.detectFromFile(null)).toBe('plaintext');
			expect(LanguageDetector.detectFromFile(undefined)).toBe(
				'plaintext'
			);
			expect(LanguageDetector.detectFromFile({})).toBe('plaintext');
			expect(LanguageDetector.detectFromFile({ name: 'test' })).toBe(
				'plaintext'
			);
		});
	});

	describe('getCodeMirrorLanguage', () => {
		it('should return loader functions for supported languages', () => {
			const jsLoader =
				LanguageDetector.getCodeMirrorLanguage('javascript');
			expect(typeof jsLoader).toBe('function');

			const pyLoader = LanguageDetector.getCodeMirrorLanguage('python');
			expect(typeof pyLoader).toBe('function');

			const htmlLoader = LanguageDetector.getCodeMirrorLanguage('html');
			expect(typeof htmlLoader).toBe('function');
		});

		it('should return null for unsupported languages', () => {
			const unknownLoader =
				LanguageDetector.getCodeMirrorLanguage('unknown');
			expect(unknownLoader).toBe(null);

			const plaintextLoader =
				LanguageDetector.getCodeMirrorLanguage('plaintext');
			expect(plaintextLoader).toBe(null);
		});

		it('should handle TypeScript correctly (uses JavaScript package)', () => {
			const tsLoader =
				LanguageDetector.getCodeMirrorLanguage('typescript');
			expect(typeof tsLoader).toBe('function');
		});
	});

	describe('getCodeMirrorModeName', () => {
		it('should return correct mode names for supported languages', () => {
			expect(LanguageDetector.getCodeMirrorModeName('javascript')).toBe(
				'javascript'
			);
			expect(LanguageDetector.getCodeMirrorModeName('typescript')).toBe(
				'javascript'
			);
			expect(LanguageDetector.getCodeMirrorModeName('python')).toBe(
				'python'
			);
			expect(LanguageDetector.getCodeMirrorModeName('html')).toBe('html');
			expect(LanguageDetector.getCodeMirrorModeName('css')).toBe('css');
			expect(LanguageDetector.getCodeMirrorModeName('markdown')).toBe(
				'markdown'
			);
		});

		it('should return null mode for plaintext and unknown languages', () => {
			expect(LanguageDetector.getCodeMirrorModeName('plaintext')).toBe(
				'null'
			);
			expect(LanguageDetector.getCodeMirrorModeName('unknown')).toBe(
				'null'
			);
		});
	});

	describe('language support queries', () => {
		it('should return all supported languages', () => {
			const supported = LanguageDetector.getSupportedLanguages();
			expect(supported).toContain('javascript');
			expect(supported).toContain('typescript');
			expect(supported).toContain('python');
			expect(supported).toContain('html');
			expect(supported).toContain('css');
			expect(supported).toContain('markdown');
			expect(supported).toContain('plaintext');

			// Should not contain duplicates
			const unique = [...new Set(supported)];
			expect(supported.length).toBe(unique.length);
		});

		it('should return all supported extensions', () => {
			const extensions = LanguageDetector.getSupportedExtensions();
			expect(extensions).toContain('.js');
			expect(extensions).toContain('.jsx');
			expect(extensions).toContain('.py');
			expect(extensions).toContain('.html');
			expect(extensions).toContain('.css');
			expect(extensions).toContain('.md');
		});

		it('should correctly identify supported languages', () => {
			expect(LanguageDetector.isLanguageSupported('javascript')).toBe(
				true
			);
			expect(LanguageDetector.isLanguageSupported('python')).toBe(true);
			expect(LanguageDetector.isLanguageSupported('html')).toBe(true);
			expect(LanguageDetector.isLanguageSupported('plaintext')).toBe(
				true
			);

			expect(LanguageDetector.isLanguageSupported('unknown')).toBe(false);
			expect(LanguageDetector.isLanguageSupported('java')).toBe(false);
		});

		it('should correctly identify supported extensions', () => {
			expect(LanguageDetector.isExtensionSupported('.js')).toBe(true);
			expect(LanguageDetector.isExtensionSupported('js')).toBe(true); // Without dot
			expect(LanguageDetector.isExtensionSupported('.py')).toBe(true);
			expect(LanguageDetector.isExtensionSupported('.html')).toBe(true);

			expect(LanguageDetector.isExtensionSupported('.java')).toBe(false);
			expect(LanguageDetector.isExtensionSupported('.unknown')).toBe(
				false
			);
		});
	});

	describe('language information', () => {
		it('should return correct language info for supported languages', () => {
			const jsInfo = LanguageDetector.getLanguageInfo('javascript');
			expect(jsInfo.name).toBe('JavaScript');
			expect(jsInfo.category).toBe('programming');
			expect(jsInfo.description).toContain('programming language');

			const pyInfo = LanguageDetector.getLanguageInfo('python');
			expect(pyInfo.name).toBe('Python');
			expect(pyInfo.category).toBe('programming');

			const htmlInfo = LanguageDetector.getLanguageInfo('html');
			expect(htmlInfo.name).toBe('HTML');
			expect(htmlInfo.category).toBe('markup');
		});

		it('should return default info for unknown languages', () => {
			const unknownInfo = LanguageDetector.getLanguageInfo('unknown');
			expect(unknownInfo.name).toBe('Unknown');
			expect(unknownInfo.category).toBe('unknown');
		});
	});

	describe('integration scenarios', () => {
		it('should handle complete file detection workflow', () => {
			// Simulate a typical file processing workflow
			const testFiles = [
				{
					ext: '.js',
					name: 'app.js',
					content: 'console.log("Hello");',
				},
				{ ext: '.py', name: 'main.py', content: 'print("Hello")' },
				{ ext: '.html', name: 'index.html', content: '<h1>Hello</h1>' },
				{
					ext: '.unknown',
					name: 'data.unknown',
					content: 'unknown content',
				},
			];

			testFiles.forEach((file) => {
				const detectedLang = LanguageDetector.detectFromFile(file);
				const isSupported =
					LanguageDetector.isLanguageSupported(detectedLang);
				const langInfo = LanguageDetector.getLanguageInfo(detectedLang);
				const modeName =
					LanguageDetector.getCodeMirrorModeName(detectedLang);

				// All should complete without errors
				expect(typeof detectedLang).toBe('string');
				expect(typeof isSupported).toBe('boolean');
				expect(typeof langInfo).toBe('object');
				expect(typeof modeName).toBe('string');

				// Known files should be properly supported
				if (['.js', '.py', '.html'].includes(file.ext)) {
					expect(isSupported).toBe(true);
					expect(langInfo.category).not.toBe('unknown');
				}
			});
		});

		it('should handle edge cases gracefully', () => {
			// Test various edge cases that might occur in real usage
			const edgeCases = [
				null,
				undefined,
				{},
				{ ext: '' },
				{ ext: '.', name: 'dotfile' },
				{ ext: '.js.backup', name: 'backup.js.backup' },
				{ name: 'no-extension' },
			];

			edgeCases.forEach((testCase) => {
				// Should not throw errors
				expect(() => {
					const lang = LanguageDetector.detectFromFile(testCase);
					LanguageDetector.getLanguageInfo(lang);
					LanguageDetector.getCodeMirrorModeName(lang);
				}).not.toThrow();
			});
		});
	});
});
