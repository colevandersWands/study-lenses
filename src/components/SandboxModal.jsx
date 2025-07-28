import { useState, useEffect, useRef } from 'preact/hooks';
import { useApp } from '../context/AppContext.jsx';
import { AppContext } from '../context/AppContext.jsx';
import { LanguageConfiguration } from '../utils/LanguageConfiguration.js';
import { LanguageDetector } from '../utils/LanguageDetector.js';
import { editorialize } from '../../load-virtual-fs.js';
import { getLens } from '../lenses/index.js';
import StudyBar from './StudyBar.jsx';
import ModalContainer from '../containers/ModalContainer.jsx';

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
	const [currentLensId, setCurrentLensId] = useState('editor');
	const [sandboxFile, setSandboxFile] = useState(null);
	const [selectedLanguage, setSelectedLanguage] = useState('javascript');
	const [modalState, setModalState] = useState(null); // For action lens results

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

	// Get current lens using the lens system
	const currentLens = getLens(currentLensId);
	if (!currentLens || !currentLens.render) {
		// Fallback to editor if current lens doesn't exist or isn't a render lens
		setCurrentLensId('editor');
		return null;
	}

	// Handle lens switching
	const handleLensAction = (lensId, config) => {
		setCurrentLensId(lensId);
	};

	// Handle action lens execution (Run, Debug, Ask buttons)
	const handleActionLensExecution = async (actionLens, config) => {
		try {
			const result = await actionLens.execute(sandboxFile, config);
			
			// If execute returns a component, show it in modal
			if (result && typeof result === 'object' && result.type) {
				setModalState({
					lensId: actionLens.id,
					config, 
					component: result,
				});
			}
			// Otherwise, it was a side-effect only action (existing behavior)
		} catch (error) {
			console.error(`Failed to execute ${actionLens.id}:`, error);
			// Future enhancement: add toast notification here
		}
	};

	// Close action lens modal
	const closeModal = () => {
		setModalState(null);
	};

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
						<h3>🏖️ Sandbox</h3>
						<span className={styles.fileName}>
							{sandboxFile.name}
						</span>
					</div>
					<div className={styles.headerCenter}>
						<StudyBar
							file={sandboxFile}
							onLensAction={handleLensAction}
							onActionLensExecution={handleActionLensExecution}
							currentLensId={currentLensId}
							className={styles.sandboxStudyBar}
							size="compact"
						/>
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
						{currentLens.render ? 
							currentLens.render(sandboxFile, currentLens.config || {}) :
							null
						}
					</AppContext.Provider>
				</div>

				<div className={styles.modalFooter}>
					<div className={styles.instructions}>
						<p>
							<strong>🏖️ Sandbox:</strong> Experiment with
							code freely! Your changes will not be saved between sessions.
							Use the buttons above to switch between different learning lenses. 
							Press <kbd>Escape</kbd> or click ✕ to return to your lesson.
						</p>
					</div>
				</div>

				{/* Action lens modal results */}
				{modalState && (
					<ModalContainer
						lensId={modalState.lensId}
						code={sandboxFile.content}
						config={modalState.config}
						component={modalState.component}
						onClose={closeModal}
					/>
				)}
			</div>
		</div>
	);
};

export default SandboxModal;
