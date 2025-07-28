import { useState, useRef, useEffect } from 'preact/hooks';
import StudyBar from './StudyBar.jsx';
import styles from './InteractiveCodeBlock.module.css';

/**
 * LensDropdown - Dropdown for selecting lens to open code snippet in
 */
const LensDropdown = ({ onSelect }) => {
	const [isOpen, setIsOpen] = useState(false);

	const lenses = [
		{ id: 'variables', name: 'Variables Lens', icon: '📊' },
		{ id: 'highlight', name: 'Highlight Lens', icon: '🎨' },
		{ id: 'blanks', name: 'Blanks Lens', icon: '📝' },
		{ id: 'parsons', name: 'Parsons Lens', icon: '🧩' },
		{ id: 'writeme', name: 'Write Me Lens', icon: '✍️' },
		{ id: 'print', name: 'Print Lens', icon: '🖨️' },
	];

	const handleSelect = (lensId) => {
		onSelect(lensId);
		setIsOpen(false);
	};

	return (
		<div className={styles.dropdown}>
			<button
				className={styles.dropdownButton}
				onClick={() => setIsOpen(!isOpen)}
				title="Open in lens"
			>
				📖 Open in... ▼
			</button>
			{isOpen && (
				<div className={styles.dropdownMenu}>
					{lenses.map((lens) => (
						<button
							key={lens.id}
							className={styles.dropdownItem}
							onClick={() => handleSelect(lens.id)}
						>
							{lens.icon} {lens.name}
						</button>
					))}
				</div>
			)}
		</div>
	);
};

/**
 * InteractiveCodeBlock - Code block with toolbar and edit toggle
 * Uses unified lens architecture with file objects
 */
const InteractiveCodeBlock = ({ file, codeId, onOpenInLens }) => {
	const [isEditing, setIsEditing] = useState(false);

	// Get proper Prism language class from file language
	const getPrismLanguageClass = (file) => {
		const language = file?.lang;
		if (!language) return 'plaintext';

		// Map unified language detection to Prism classes
		const prismMap = {
			javascript: 'javascript',
			typescript: 'typescript',
			python: 'python',
			html: 'markup', // Prism uses 'markup' for HTML
			css: 'css',
			markdown: 'markdown',
			json: 'json',
			plaintext: 'plaintext',
		};

		return prismMap[language] || language;
	};

	// Debug: Show file object received from MarkdownLens
	// 	console.log(`🔍 InteractiveCodeBlock: Received file object:`, {
	// 	name: file?.name,
	// 	lang: file?.lang,
	// 	ext: file?.ext,
	// });

	const containerRef = useRef();

	// Initialize with Prism highlighting
	useEffect(() => {
		if (containerRef.current && !isEditing && file) {
			const currentContent = file.content;
			const prismLanguage = getPrismLanguageClass(file);

			// Debug: Track Prism language mapping
			// 			console.log(
			// 	`🔍 InteractiveCodeBlock: Prism language mapping: "${file.lang}" → "language-${prismLanguage}"`
			// );

			containerRef.current.innerHTML = `<pre><code class="language-${prismLanguage}">${currentContent}</code></pre>`;

			// Apply Prism highlighting if available
			if (window.Prism) {
				const codeElement = containerRef.current.querySelector('code');
				if (codeElement) {
					window.Prism.highlightElement(codeElement);
				}
			}
		}
	}, [isEditing, file]);

	const toggleEdit = () => {
		if (!isEditing && file) {
			// Switch to edit mode: show editorialize .view
			if (containerRef.current && file.view) {
				containerRef.current.innerHTML = '';
				containerRef.current.appendChild(file.view);
			}
		} else if (file) {
			// Switch to read mode: show Prism highlighting
			if (containerRef.current) {
				const currentContent = file.content;
				const prismLanguage = getPrismLanguageClass(file);
				containerRef.current.innerHTML = `<pre><code class="language-${prismLanguage}">${currentContent}</code></pre>`;

				// Apply Prism highlighting
				if (window.Prism) {
					const codeElement =
						containerRef.current.querySelector('code');
					if (codeElement) {
						window.Prism.highlightElement(codeElement);
					}
				}
			}
		}
		setIsEditing(!isEditing);
	};

	const handleOpenInLens = (lensType) => {
		if (onOpenInLens && file) {
			onOpenInLens(lensType, file);
		}
	};

	return (
		<div className={styles.codeBlock}>
			<div className={styles.toolbar}>
				{/* Study Tools - using new StudyBar interface */}
				<StudyBar
					file={file}
					onLensAction={(lensId, config) => {
						// Bridge to existing lens dropdown functionality
						handleOpenInLens(lensId, file);
					}}
					onActionLensExecution={(lens, config) => {
						// Handle action lens execution (Run, Ask, Trace buttons)
						if (lens && lens.execute && file) {
							lens.execute(file, config);
						}
					}}
					currentLensId={null} // InteractiveCodeBlock isn't a lens, so no current lens to filter
					className={styles.studyBarInline}
				/>

				{/* Interactive Code Block specific controls */}
				<div className={styles.blockControls}>
					<button
						className={`${styles.toolbarButton} ${styles.editButton} ${isEditing ? styles.active : ''}`}
						onClick={toggleEdit}
						title={
							isEditing
								? 'Switch to read-only view'
								: 'Edit this code'
						}
					>
						{isEditing ? '📖 Read' : '✏️ Edit'}
					</button>
					{/* <LensDropdown onSelect={handleOpenInLens} /> */}
				</div>
			</div>
			<div ref={containerRef} className={styles.codeContainer}>
				{/* Content will be populated by useEffect and toggleEdit */}
			</div>
		</div>
	);
};

export default InteractiveCodeBlock;
