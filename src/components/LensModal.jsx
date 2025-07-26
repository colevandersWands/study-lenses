import { useEffect, useRef } from 'preact/hooks';
import { useApp } from '../context/AppContext.jsx';
import { AppContext } from '../context/AppContext.jsx';

// Import lens components
import VariablesLens from '../lenses/VariablesLens.jsx';
import HighlightLens from '../lenses/HighlightLens.jsx';
import BlanksLens from '../lenses/BlanksLens.jsx';
import ParsonsLens from '../lenses/ParsonsLens.jsx';
import WritemeLens from '../lenses/WritemeLens.jsx';
import PrintLens from '../lenses/PrintLens.jsx';

import styles from './LensModal.module.css';

/**
 * LensModal - Full-screen modal for rendering lenses with code snippets
 * Uses editorialize pattern and temporary context override
 */
const LensModal = ({ isOpen, onClose, lensType, editorializedFile }) => {
	const originalContext = useApp();
	const modalRef = useRef(null);

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

	if (!isOpen || !editorializedFile) return null;

	// Create temporary context that provides the editorializedFile as currentFile
	const tempContext = {
		...originalContext,
		currentFile: editorializedFile,
	};

	// Lens configuration
	const lensConfig = {
		variables: {
			component: VariablesLens,
			title: 'Variables Lens',
			icon: '📊',
			description: 'Track variable values and scope',
		},
		highlight: {
			component: HighlightLens,
			title: 'Highlight Lens',
			icon: '🎨',
			description: 'Annotate and highlight code',
		},
		blanks: {
			component: BlanksLens,
			title: 'Blanks Lens',
			icon: '📝',
			description: 'Fill-in-the-blank exercises',
		},
		parsons: {
			component: ParsonsLens,
			title: 'Parsons Lens',
			icon: '🧩',
			description: 'Drag-and-drop code assembly',
		},
		writeme: {
			component: WritemeLens,
			title: 'Write Me Lens',
			icon: '✍️',
			description: 'Code writing exercises',
		},
		print: {
			component: PrintLens,
			title: 'Print Lens',
			icon: '🖨️',
			description: 'Print-optimized view',
		},
	};

	const currentLens = lensConfig[lensType];
	if (!currentLens) {
		return null;
	}

	const LensComponent = currentLens.component;

	return (
		<div className={styles.modalOverlay} onClick={onClose}>
			<div
				className={styles.modalContent}
				ref={modalRef}
				onClick={(e) => e.stopPropagation()}
			>
				<div className={styles.modalHeader}>
					<div className={styles.headerLeft}>
						<h3>
							{currentLens.icon} {currentLens.title}
						</h3>
						<span className={styles.fileName}>
							{editorializedFile.name}
						</span>
					</div>
					<div className={styles.headerRight}>
						<span className={styles.description}>
							{currentLens.description}
						</span>
						<button
							className={styles.closeButton}
							onClick={onClose}
							title="Close modal (Esc)"
						>
							✕
						</button>
					</div>
				</div>

				<div className={styles.modalBody}>
					<AppContext.Provider value={tempContext}>
						<LensComponent resource={editorializedFile} />
					</AppContext.Provider>
				</div>

				<div className={styles.modalFooter}>
					<div className={styles.instructions}>
						<p>
							<strong>💡 Tip:</strong> This lens is viewing your
							code snippet. Any edits you make here will be
							reflected in the original markdown code block.
						</p>
						<p>
							Press <kbd>Escape</kbd> or click the X button to
							return to the markdown view.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
};

export default LensModal;
