import { useState, useEffect, useRef } from 'preact/hooks';
import { useApp } from '../context/AppContext.jsx';
import { AppContext } from '../context/AppContext.jsx';
import { LanguageConfiguration } from '../utils/LanguageConfiguration.js';
import { LanguageDetector } from '../utils/LanguageDetector.js';
import { editorialize } from '../../load-virtual-fs.js';

// Import lens components
import EditorLens from '../lenses/EditorLens.jsx';
import VariablesLens from '../lenses/VariablesLens.jsx';
import HighlightLens from '../lenses/HighlightLens.jsx';
import BlanksLens from '../lenses/BlanksLens.jsx';
import ParsonsLens from '../lenses/ParsonsLens.jsx';
import WritemeLens from '../lenses/WritemeLens.jsx';
import PrintLens from '../lenses/PrintLens.jsx';
import TracingLens from '../lenses/TracingLens.jsx';

import styles from './SandboxModal.module.css';

/**
 * SandboxModal - Full-screen modal for experimenting with code
 * Features persistent sandbox file and lens switching
 */
const SandboxModal = ({ isOpen, onClose }) => {
	const originalContext = useApp();
	const { getOrCreateSandboxFile } = originalContext;
	const modalRef = useRef(null);

	// Local state
	const [activeLensType, setActiveLensType] = useState('study');
	const [sandboxFile, setSandboxFile] = useState(null);
	const [selectedLanguage, setSelectedLanguage] = useState('javascript');

	// Get language-specific file extension
	const getFileExtensionForLanguage = (language) => {
		const extensionMap = {
			javascript: '.js',
			typescript: '.ts',
			python: '.py',
			html: '.html',
			css: '.css',
			markdown: '.md',
			json: '.json',
			xml: '.xml',
			plaintext: '.txt',
		};
		return extensionMap[language] || '.js';
	};

	// Get language-specific template content
	const getTemplateForLanguage = (language) => {
		const templates = {
			javascript:
				'// Sandbox - experiment with JavaScript\nconsole.log("Hello, World!");\n\n// Try writing some code here...',
			typescript:
				'// Sandbox - experiment with TypeScript\nconst message: string = "Hello, World!";\nconsole.log(message);\n\n// Try writing some TypeScript code here...',
			python: '# Sandbox - experiment with Python\nprint("Hello, World!")\n\n# Try writing some Python code here...',
			html: '<!DOCTYPE html>\n<html>\n<head>\n    <title>Sandbox</title>\n</head>\n<body>\n    <h1>Hello, World!</h1>\n    <!-- Try writing some HTML here... -->\n</body>\n</html>',
			css: '/* Sandbox - experiment with CSS */\nbody {\n    font-family: Arial, sans-serif;\n    margin: 0;\n    padding: 20px;\n}\n\n/* Try writing some CSS here... */',
			markdown:
				'# Sandbox\n\nExperiment with Markdown here...\n\n## Features\n\n- **Bold text**\n- *Italic text*\n- `Code snippets`\n\n[Link to something](https://example.com)',
			json: '{\n  "message": "Hello, World!",\n  "sandbox": true,\n  "data": {\n    "experiment": "Try editing this JSON..."\n  }\n}',
			xml: '<?xml version="1.0" encoding="UTF-8"?>\n<sandbox>\n    <message>Hello, World!</message>\n    <note>Try writing some XML here...</note>\n</sandbox>',
			plaintext:
				'Sandbox - Plain Text Mode\n\nHello, World!\n\nTry writing some text here...',
		};
		return templates[language] || templates['javascript'];
	};

	// Handle language change
	const handleLanguageChange = (newLanguage) => {
		if (!sandboxFile) return;

		setSelectedLanguage(newLanguage);
		const newExtension = getFileExtensionForLanguage(newLanguage);
		const newContent = getTemplateForLanguage(newLanguage);

		// Create a completely new editorialize object to trigger React updates
		const newFileData = {
			name: `sandbox${newExtension}`,
			path: `/sandbox${newExtension}`,
			lang: newExtension,
			ext: newExtension,
			content: newContent,
			type: 'file',
		};

		const newEditorializedFile = editorialize(newFileData);

		setSandboxFile(newEditorializedFile);
	};

	// Initialize sandbox file when modal opens
	useEffect(() => {
		if (isOpen) {
			const file = getOrCreateSandboxFile();
			setSandboxFile(file);

			// Set initial language based on file extension
			const detectedLanguage = LanguageDetector.detectFromFile(file);
			setSelectedLanguage(detectedLanguage);
		}
	}, [isOpen, getOrCreateSandboxFile]);

	// Close modal on Escape key
	useEffect(() => {
		const handleEscape = (e) => {
			if (e.key === 'Escape' && isOpen) {
				onClose();
			}
		};

		document.addEventListener('keydown', handleEscape);
		return () => document.removeEventListener('keydown', handleEscape);
	}, [isOpen, onClose]);

	// Prevent body scroll when modal is open
	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = '';
		}

		return () => {
			document.body.style.overflow = '';
		};
	}, [isOpen]);

	if (!isOpen || !sandboxFile) return null;

	// Available lenses configuration
	const AVAILABLE_LENSES = {
		study: {
			component: EditorLens,
			title: 'Editor',
			icon: '📚',
			description: 'Edit and experiment with code',
		},
		variables: {
			component: VariablesLens,
			title: 'Variables',
			icon: '📊',
			description: 'Track variable values and scope',
		},
		trace: {
			component: TracingLens,
			title: 'Trace',
			icon: '🔍',
			description: 'Step through code execution',
		},
		highlight: {
			component: HighlightLens,
			title: 'Highlight',
			icon: '🎨',
			description: 'Annotate and highlight code',
		},
		blanks: {
			component: BlanksLens,
			title: 'Blanks',
			icon: '📝',
			description: 'Fill-in-the-blank exercises',
		},
		parsons: {
			component: ParsonsLens,
			title: 'Parsons',
			icon: '🧩',
			description: 'Drag-and-drop code assembly',
		},
		writeme: {
			component: WritemeLens,
			title: 'Write Me',
			icon: '✍️',
			description: 'Code writing exercises',
		},
		print: {
			component: PrintLens,
			title: 'Print',
			icon: '🖨️',
			description: 'Print-optimized view',
		},
	};

	const currentLens = AVAILABLE_LENSES[activeLensType];
	if (!currentLens) return null;

	const LensComponent = currentLens.component;

	// Create temporary context that provides the sandboxFile as currentFile
	const tempContext = {
		...originalContext,
		currentFile: sandboxFile,
	};

	return (
		<div className={styles.modalOverlay} onClick={onClose}>
			<div
				className={styles.modalContent}
				ref={modalRef}
				onClick={(e) => e.stopPropagation()}
			>
				<div className={styles.modalHeader}>
					<div className={styles.headerLeft}>
						<h3>🏖️ Sandbox Mode</h3>
						<span className={styles.fileName}>
							{sandboxFile.name}
						</span>
					</div>
					<div className={styles.headerCenter}>
						<div className={styles.dropdownGroup}>
							<select
								value={selectedLanguage}
								onChange={(e) =>
									handleLanguageChange(e.target.value)
								}
								className={styles.languageDropdown}
								title="Select programming language"
							>
								{LanguageConfiguration.getAllLanguages().map(
									(language) => {
										const languageInfo =
											LanguageDetector.getLanguageInfo(
												language
											);
										return (
											<option
												key={language}
												value={language}
											>
												{languageInfo.name}
											</option>
										);
									}
								)}
							</select>
							<select
								value={activeLensType}
								onChange={(e) =>
									setActiveLensType(e.target.value)
								}
								className={styles.lensDropdown}
								title="Switch between different learning lenses"
							>
								{Object.entries(AVAILABLE_LENSES).map(
									([key, lens]) => (
										<option key={key} value={key}>
											{lens.icon} {lens.title}
										</option>
									)
								)}
							</select>
						</div>
						<span className={styles.lensDescription}>
							{currentLens.description}
						</span>
					</div>
					<div className={styles.headerRight}>
						<button
							className={styles.closeButton}
							onClick={onClose}
							title="Close sandbox (Esc)"
						>
							✕
						</button>
					</div>
				</div>

				<div className={styles.modalBody}>
					<AppContext.Provider value={tempContext}>
						<LensComponent resource={sandboxFile} />
					</AppContext.Provider>
				</div>

				<div className={styles.modalFooter}>
					<div className={styles.instructions}>
						<p>
							<strong>🏖️ Sandbox Mode:</strong> Experiment with
							code freely! Your changes are saved and will persist
							between sessions.
						</p>
						<p>
							Use the dropdown to switch between different
							learning lenses. Press <kbd>Escape</kbd> or click X
							to return to your lesson.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
};

export default SandboxModal;
