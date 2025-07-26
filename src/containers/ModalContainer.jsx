import { useEffect } from 'preact/hooks';
import { getLens } from '../lenses/index.js';
import styles from './ModalContainer.module.css';

/**
 * ModalContainer - Renders a lens in a modal overlay
 * Used for secondary/popup experiences without navigation
 */
const ModalContainer = ({ lensId, code, config = {}, component, onClose }) => {
	const lens = getLens(lensId);

	// Close modal on Escape key
	useEffect(() => {
		const handleEscape = (e) => {
			if (e.key === 'Escape') {
				onClose();
			}
		};

		document.addEventListener('keydown', handleEscape);
		return () => document.removeEventListener('keydown', handleEscape);
	}, [onClose]);

	// Prevent body scroll when modal is open
	useEffect(() => {
		document.body.style.overflow = 'hidden';
		return () => {
			document.body.style.overflow = '';
		};
	}, []);

	if (!lens) {
		return (
			<div className={styles.modalOverlay} onClick={onClose}>
				<div className={styles.modalContent}>
					<div className={styles.error}>
						<h3>❌ Lens Not Found</h3>
						<p>Could not load lens: {lensId}</p>
						<button onClick={onClose}>Close</button>
					</div>
				</div>
			</div>
		);
	}

	// Safety check: Action lenses should not be opened in modals (unless they provide a component)
	if (lens.execute && !lens.render && !component) {
		return (
			<div className={styles.modalOverlay} onClick={onClose}>
				<div className={styles.modalContent}>
					<div className={styles.error}>
						<h3>⚡ Action Lens Error</h3>
						<p>
							"{lens.label}" is an action lens and should be
							executed directly, not opened in a modal.
						</p>
						<p>
							<small>
								This is likely a configuration issue - action
								lenses should use buttons, not dropdowns.
							</small>
						</p>
						<button onClick={onClose}>Close</button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className={styles.modalOverlay} onClick={onClose}>
			<div
				className={styles.modalContent}
				onClick={(e) => e.stopPropagation()}
			>
				<header className={styles.modalHeader}>
					<h3>
						{lens.config.icon} {lens.config.label}
					</h3>
					<button
						className={styles.closeButton}
						onClick={onClose}
						title="Close (Esc)"
					>
						×
					</button>
				</header>
				<main className={styles.modalBody}>
					{component || lens.render(code, config)}
				</main>
			</div>
		</div>
	);
};

export default ModalContainer;
