/**
 * Unified Lens Registry - Auto-Discovery Architecture
 *
 * Each lens follows the unified API pattern:
 * - export const id, label, applicable, config, renderConfig
 * - export const render (for render lenses) OR execute (for action lenses)
 *
 * Registry automatically includes all lenses without manual mapping.
 * Adding new lenses requires only: 1) Create file, 2) Add import, 3) Add to array.
 */

// Import language support system
import { PluginRegistry } from '../utils/PluginRegistry.js';

// Import all lens configurations using unified interface - auto-discovered
import EditorLens, * as studyLens from './EditorLens.jsx';
import * as highlightLens from './HighlightLens.jsx';
import * as parsonsLens from './ParsonsLens.jsx';
import * as blanksLens from './BlanksLens.jsx';
import * as variablesLens from './VariablesLens.jsx';
import MarkdownExercise, * as markdownLens from './MarkdownLens.jsx';
import * as printLens from './PrintLens.jsx';
import * as writemeLens from './WritemeLens.jsx';
import * as stepthroughsLens from './StepThroughsLens.jsx';
import * as tracingLens from './TracingLens.jsx';
import * as debugJavaScriptLens from './debug-javascript.jsx';
import * as runJavaScriptLens from './run-javascript.jsx';
import * as traceJavaScriptLens from './trace-javascript.jsx';
import * as askJavaScriptLens from './ask-javascript.jsx';
import * as tablesUniversalLens from './tables-universal.jsx';
import * as runPython from './run-python.jsx';

/**
 * All registered lenses - auto-discovered from unified API exports
 * Each lens follows the standard pattern: id, label, applicable, render/execute, config, renderConfig
 */
export const STUDY_LENSES = [
	debugJavaScriptLens,
	studyLens,
	highlightLens,
	parsonsLens,
	blanksLens,
	variablesLens,
	markdownLens,
	printLens,
	writemeLens,
	stepthroughsLens,
	tracingLens,
	runJavaScriptLens,
	traceJavaScriptLens,
	askJavaScriptLens,
	tablesUniversalLens,
	runPython,
];

/**
 * Get all lenses that are applicable to the current file
 * Enhanced with language compatibility checking
 * @param {Object} file - The current file object
 * @returns {Array} Array of applicable lenses
 */
export function getApplicableLenses(file) {
	// First filter by traditional applicable() method
	const traditionallyApplicable = STUDY_LENSES.filter((lens) => {
		try {
			return lens.applicable(file);
		} catch (error) {
			console.warn(`Lens ${lens.id} applicable() method failed:`, error);
			return false;
		}
	});

	// Then filter by language compatibility using PluginRegistry
	const languageCompatible = PluginRegistry.filterPluginsByFile(
		traditionallyApplicable,
		file
	);

	console.log(`Lens filtering for file ${file?.name || 'unknown'}:`);
	console.log(
		`- Traditional applicable: ${traditionallyApplicable.length} lenses`
	);
	console.log(`- Language compatible: ${languageCompatible.length} lenses`);

	return languageCompatible;
}

/**
 * Get a specific lens by ID
 * @param {string} lensId - The lens ID to find
 * @returns {Object|null} The lens object or null if not found
 */
export function getLens(lensId) {
	return STUDY_LENSES.find((lens) => lens.id === lensId) || null;
}

/**
 * Get all available lens IDs
 * @returns {Array<string>} Array of lens IDs
 */
export function getAllLensIds() {
	return STUDY_LENSES.map((lens) => lens.id);
}

/**
 * Register a new lens at runtime (for future extensibility)
 * @param {Object} lens - Lens object with required interface
 */
export function registerLens(lens) {
	// Validate lens interface
	if (!lens.id || typeof lens.id !== 'string') {
		throw new Error('Lens must have a valid string id');
	}

	if (!lens.applicable || typeof lens.applicable !== 'function') {
		throw new Error('Lens must have an applicable() method');
	}

	if (
		(!lens.render || typeof lens.render !== 'function') &&
		(!lens.execute || typeof lens.execute !== 'function')
	) {
		throw new Error(
			'Lens must have either a render() method (for render lenses) or execute() method (for action lenses)'
		);
	}

	// Check for duplicate IDs
	if (STUDY_LENSES.some((l) => l.id === lens.id)) {
		console.warn(`Lens with ID "${lens.id}" already exists, replacing...`);
		const index = STUDY_LENSES.findIndex((l) => l.id === lens.id);
		STUDY_LENSES[index] = lens;
	} else {
		STUDY_LENSES.push(lens);
	}
}

/**
 * Get lenses that support a specific language
 * @param {string} language - Language identifier
 * @returns {Array} Array of lenses that support the language
 */
export function getLensesForLanguage(language) {
	const supportedLensIds = PluginRegistry.getPluginsForLanguage(language);
	return STUDY_LENSES.filter((lens) => supportedLensIds.includes(lens.id));
}

/**
 * Debug function to show lens compatibility status
 * @param {Object} file - Optional file to check compatibility against
 */
export function debugLensCompatibility(file = null) {
	console.log('=== Lens Compatibility Debug ===');

	if (file) {
		console.log(`File: ${file.name || 'unknown'}`);
		console.log(`Language: ${file.lang || 'unknown'}`);
		console.log('');

		const applicableLenses = getApplicableLenses(file);
		console.log(
			`Applicable lenses for this file: ${applicableLenses.length}`
		);
		applicableLenses.forEach((lens) => {
			console.log(`- ${lens.id}: ${lens.config?.label || 'Unknown'}`);
		});
	}

	console.log('');
	console.log('All registered lenses:');
	STUDY_LENSES.forEach((lens) => {
		const langSupport = PluginRegistry.getPluginLanguageSupport(lens.id);
		console.log(`- ${lens.id}:`, langSupport || 'No language config');
	});
}
