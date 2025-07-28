import { useState } from 'preact/hooks';
import { getApplicableLenses } from '../lenses/index.js';
import StudyBarButtonContainer from '../containers/StudyBarButtonContainer.jsx';
import styles from './StudyBar.module.css';

/**
 * StudyBar - Lens access hub that renders configurable lens buttons
 * Implements action/render lens split: action lenses as buttons, render lenses in dropdown
 */
const StudyBar = ({
	file,
	onLensAction,
	onActionLensExecution,
	currentLensId,
	className = '',
	disabled = false,
}) => {
	const [showRenderLensDropdown, setShowRenderLensDropdown] = useState(false);
	if (!file) {
		return (
			<div className={`${styles.studyBar} ${className}`}>
				<div className={styles.emptyState}>
					<span>No file selected</span>
				</div>
			</div>
		);
	}

	const applicableLenses = getApplicableLenses(file);

	// Filter out current active lens to avoid recursion
	const availableLenses = applicableLenses.filter(
		(lens) => lens.id !== currentLensId
	);

	if (availableLenses.length === 0) {
		return (
			<div className={`${styles.studyBar} ${className}`}>
				<div className={styles.emptyState}>
					<span>No additional lenses available</span>
				</div>
			</div>
		);
	}

	// Split lenses by type: action (execute) vs render (render)
	// Note: Hybrid lenses with both methods will appear in both arrays
	const actionLenses = availableLenses.filter(
		(lens) => lens.execute && typeof lens.execute === 'function'
	);
	const renderLenses = availableLenses.filter(
		(lens) => lens.render && typeof lens.render === 'function'
	);

	// Sort action lenses by priority order
	const orderMap = {
		'run-javascript': 1,
		'run-python': 1,
		'debug-javascript': 2,
		'trace-javascript': 3,
		'tables-universal': 4,
		'ask-javascript': 5,
		stepthroughs: 6,
	};

	const sortedActionLenses = [...actionLenses].sort((a, b) => {
		const aOrder = orderMap[a.id] || 999;
		const bOrder = orderMap[b.id] || 999;
		return aOrder - bOrder;
	});

	// Sort render lenses alphabetically by label
	const sortedRenderLenses = [...renderLenses].sort((a, b) =>
		(a.label || a.id).localeCompare(b.label || b.id)
	);

	// Create wrapper function for action lens execution
	const handleActionLensTrigger = (lensId, config) => {
		const lens = sortedActionLenses.find((l) => l.id === lensId);
		if (lens && onActionLensExecution) {
			onActionLensExecution(lens, config);
		}
	};

	return (
		<div className={`${styles.studyBar} ${styles.horizontal} ${className}`}>
			<div className={styles.buttonContainer}>
				{/* Action Lenses - Individual Buttons */}
				{sortedActionLenses.map((lens, index) => (
					<div key={lens.id} className={styles.buttonWrapper}>
						<StudyBarButtonContainer
							lens={{
								...lens,
								config: {
									...lens.config, // Preserve original config
									// icon: '⚡', // Action lens icon
									label: lens.label,
									description: `Execute ${lens.label}`,
								},
							}}
							file={file}
							onTrigger={handleActionLensTrigger}
						/>
						{(index < sortedActionLenses.length - 1 ||
							sortedRenderLenses.length > 0) && (
							<div className={styles.separator} />
						)}
					</div>
				))}

				{/* Render Lenses - Dropdown */}
				{sortedRenderLenses.length > 0 && (
					<div className={styles.buttonWrapper}>
						<div className={styles.renderLensDropdown}>
							<button
								className={styles.dropdownToggle}
								onClick={() =>
									setShowRenderLensDropdown(
										!showRenderLensDropdown
									)
								}
								title="Switch to a different lens view"
							>
								Lenses {showRenderLensDropdown ? '▼' : '▶'}
							</button>

							{showRenderLensDropdown && (
								<div className={styles.dropdownMenu}>
									{sortedRenderLenses
										.filter((lens) => lens.applicable(file))
										.map((lens) => (
											<button
												key={lens.id}
												className={styles.dropdownItem}
												onClick={() => {
													onLensAction(
														lens.id,
														lens.config || {}
													);
													setShowRenderLensDropdown(
														false
													);
												}}
												title={`Switch to ${lens.label} view`}
											>
												{/* <span className={styles.lensIcon}>👁️</span> */}
												{lens.label}
											</button>
										))}
								</div>
							)}
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default StudyBar;
