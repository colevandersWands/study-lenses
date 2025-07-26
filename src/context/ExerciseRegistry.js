/**
 * Exercise Registry - central registry for all available exercises and transforms
 */

// Available exercises
export const EXERCISES = {
	editor: {
		name: '0. Editor',
		description: 'Interactive code editor with execution',
		supportedLangs: [
			'javascript',
			'python',
			'html',
			'css',
			'typescript',
		],
		features: ['editor', 'run', 'trace', 'format'],
	},
	variables: {
		name: '1. Variables',
		description: 'Variable scope analysis with interactive highlighting',
		supportedLangs: ['javascript', 'typescript'],
		features: [
			'scope-analysis',
			'variable-tracking',
			'highlighting',
			'shift-parser',
		],
	},
	highlight: {
		name: '2. Highlight',
		description: 'Read-only code with annotation tools and flowchart view',
		supportedLangs: ['javascript', 'python', 'html', 'css', 'json', 'markdown', 'typescript'],
		features: ['highlight', 'annotate', 'draw', 'copy', 'flowchart'],
	},
	blanks: {
		name: '3. Blanks',
		description: 'Fill-in-the-blank programming exercises',
		supportedLangs: ['javascript', 'typescript'],
		features: [
			'fill-in',
			'multiple-difficulty',
			'hints',
			'feedback',
			'learning',
		],
	},
	parsons: {
		name: '4. Parsons',
		description: 'Drag and drop code blocks to learn structure',
		supportedLangs: ['javascript', 'typescript'],
		features: ['drag', 'drop', 'order', 'feedback', 'hints'],
	},
	writeme: {
		name: '5. Write Me',
		description: 'Write code from scratch with hints and progress tracking',
		supportedLangs: ['javascript', 'python', 'typescript'],
		features: [
			'write-from-scratch',
			'hints',
			'progress-tracking',
			'solution-comparison',
			'difficulty-levels',
		],
	},
	print: {
		name: '6. Print Code',
		description: 'Print-optimized code viewing with formatting options',
		supportedLangs: ['javascript', 'python', 'css', 'html', 'json', 'plaintext', 'markdown', 'typescript'],
		features: [
			'print-friendly',
			'syntax-highlighting',
			'font-scaling',
			'line-numbers',
		],
	},
	flashcards: {
		name: 'Flashcards',
		description: 'Interactive spaced repetition learning with flip cards',
		supportedLangs: ['markdown'],
		features: [
			'spaced-repetition',
			'flip-cards',
			'leitner-box',
			'progress-tracking',
		],
	},
	assets: {
		name: 'Assets',
		description: 'View images, documents, videos, and other media files',
		supportedLangs: [
			'png',
			'jpg',
			'jpeg',
			'gif',
			'svg',
			'webp',
			'bmp',
			'pdf',
			'mp4',
			'webm',
			'mov',
			'mp3',
			'wav',
			'ogg',
		],
		features: [
			'image-viewer',
			'pdf-viewer',
			'video-player',
			'audio-player',
			'zoom',
			'fullscreen',
			'download',
		],
	},
};

// Pseudocode option (separate from exercises)
export const PSEUDOCODE_OPTION = {
	name: 'Show as Pseudocode',
	description: 'Convert code to readable pseudocode first',
	supportedLangs: ['javascript', 'python', 'typescript'],
};

/**
 * Get exercises available for a specific language
 */
export const getExercisesForLang = (lang) => {
	return Object.entries(EXERCISES)
		.filter(([key, exercise]) => exercise.supportedLangs.includes(lang))
		.map(([key, exercise]) => ({ key, ...exercise }));
};

/**
 * Check if pseudocode is supported for a language
 */
export const supportsPseudocode = (lang) => {
	return PSEUDOCODE_OPTION.supportedLangs.includes(lang);
};

/**
 * Get default exercise for a language
 */
export const getDefaultExercise = (lang) => {
	const defaults = {
		'javascript': 'editor',
		'typescript': 'editor',
		'python': 'editor',
		'css': 'highlight',
		'html': 'highlight',
		'markdown': 'highlight',
		'json': 'highlight',
		'plaintext': 'highlight',
		// Media files default to assets lens
		'png': 'assets',
		'jpg': 'assets',
		'jpeg': 'assets',
		'gif': 'assets',
		'svg': 'assets',
		'webp': 'assets',
		'bmp': 'assets',
		'pdf': 'assets',
		'mp4': 'assets',
		'webm': 'assets',
		'mov': 'assets',
		'mp3': 'assets',
		'wav': 'assets',
		'ogg': 'assets',
	};

	return defaults[lang] || 'editor';
};

/**
 * Check if an exercise supports a language
 */
export const exerciseSupportsLang = (exerciseKey, lang) => {
	const exercise = EXERCISES[exerciseKey];
	return exercise && exercise.supportedLangs.includes(lang);
};

/**
 * Get exercise display information
 */
export const getExerciseInfo = (exerciseKey) => {
	return EXERCISES[exerciseKey] || null;
};
