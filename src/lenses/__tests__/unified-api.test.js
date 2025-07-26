/**
 * Test suite for Unified Lens API
 * Verifies that all lenses follow the standardized export pattern
 */

import { STUDY_LENSES, getLens, getAllLensIds } from '../index.js';

describe('Unified Lens API', () => {
	test('All lenses follow unified export pattern', () => {
		STUDY_LENSES.forEach((lens) => {
			// Required exports for all lenses
			expect(lens.id).toBeDefined();
			expect(typeof lens.id).toBe('string');
			expect(lens.id.length).toBeGreaterThan(0);

			expect(lens.label).toBeDefined();
			expect(typeof lens.label).toBe('string');
			expect(lens.label.length).toBeGreaterThan(0);

			expect(lens.applicable).toBeDefined();
			expect(typeof lens.applicable).toBe('function');

			expect(lens.config).toBeDefined();
			expect(typeof lens.config).toBe('object');

			expect(lens.renderConfig).toBeDefined();
			expect(typeof lens.renderConfig).toBe('function');

			// Lens must have either render OR execute method
			const hasRender = lens.render && typeof lens.render === 'function';
			const hasExecute = lens.execute && typeof lens.execute === 'function';
			
			expect(hasRender || hasExecute).toBe(true);
			
			// Log lens type for debugging
			console.log(`✓ ${lens.id}: ${hasRender ? 'render' : 'action'} lens`);
		});
	});

	test('No duplicate lens IDs', () => {
		const ids = STUDY_LENSES.map(lens => lens.id);
		const uniqueIds = [...new Set(ids)];
		
		expect(ids.length).toBe(uniqueIds.length);
		
		// If there are duplicates, show which ones
		if (ids.length !== uniqueIds.length) {
			const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
			fail(`Duplicate lens IDs found: ${duplicates.join(', ')}`);
		}
	});

	test('getLens function works correctly', () => {
		// Test with known lens ID
		const editorLens = getLens('editor');
		expect(editorLens).toBeDefined();
		expect(editorLens.id).toBe('editor');
		expect(editorLens.render).toBeDefined();

		// Test with known action lens ID
		const runLens = getLens('run-javascript');
		expect(runLens).toBeDefined();
		expect(runLens.id).toBe('run-javascript');
		expect(runLens.execute).toBeDefined();

		// Test with non-existent lens ID
		const nonExistentLens = getLens('non-existent');
		expect(nonExistentLens).toBeNull();
	});

	test('getAllLensIds returns all lens IDs', () => {
		const allIds = getAllLensIds();
		expect(allIds.length).toBe(STUDY_LENSES.length);
		
		// Verify all IDs are strings
		allIds.forEach(id => {
			expect(typeof id).toBe('string');
			expect(id.length).toBeGreaterThan(0);
		});
	});

	test('Action lenses vs Render lenses split correctly', () => {
		const actionLenses = STUDY_LENSES.filter(lens => 
			lens.execute && typeof lens.execute === 'function'
		);
		
		const renderLenses = STUDY_LENSES.filter(lens => 
			lens.render && typeof lens.render === 'function'
		);

		console.log(`Found ${actionLenses.length} action lenses and ${renderLenses.length} render lenses`);

		// Verify action lenses have expected properties
		actionLenses.forEach(lens => {
			expect(lens.execute).toBeDefined();
			expect(typeof lens.execute).toBe('function');
		});

		// Verify render lenses have expected properties  
		renderLenses.forEach(lens => {
			expect(lens.render).toBeDefined();
			expect(typeof lens.render).toBe('function');
		});

		// Verify total count matches
		expect(actionLenses.length + renderLenses.length).toBe(STUDY_LENSES.length);
	});

	test('Lens applicable functions work', () => {
		const testFile = {
			name: 'test.js',
			lang: '.js',
			ext: '.js',
			content: 'console.log("test");'
		};

		STUDY_LENSES.forEach(lens => {
			expect(() => {
				const result = lens.applicable(testFile);
				expect(typeof result).toBe('boolean');
			}).not.toThrow();
		});
	});
});