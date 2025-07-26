import { useState, useRef } from 'preact/hooks';
import { getLens, getAllLensIds } from '../lenses/index.js';
import StudyBar from '../components/StudyBar.jsx';
import ModalContainer from './ModalContainer.jsx';
import styles from './FullPageContainer.module.css';

/**
 * FullPageContainer - Primary learning experience
 * Renders a lens as the main content with StudyBar for accessing other lenses
 */
const FullPageContainer = ({ lensId, file }) => {
	const [modalState, setModalState] = useState(null); // { lensId, config }
	const executionContainerRef = useRef(null);
	const lens = getLens(lensId);

	const handleLensAction = (actionLensId, config) => {
		console.log(
			`Opening lens ${actionLensId} in modal with config:`,
			config
		);
		setModalState({ lensId: actionLensId, config });
	};

	const handleActionLensExecution = async (actionLens, config) => {
		console.log(
			`Executing action lens ${actionLens.id} with config:`,
			config
		);
		try {
			const result = await actionLens.execute(file, config);
			
			// If execute returns a component, show it in modal
			if (result && typeof result === 'object' && result.type) {
				setModalState({ 
					lensId: actionLens.id, 
					config, 
					component: result 
				});
			}
			// Otherwise, it was a side-effect only action (existing behavior)
		} catch (error) {
			console.error(`Failed to execute ${actionLens.id}:`, error);
			// Could add toast notification here in the future
		}
	};

	const closeModal = () => {
		setModalState(null);
	};

	if (!lens) {
		return (
			<div className={styles.fullPageContainer}>
				<div className={styles.error}>
					<h3>❌ Lens Not Found</h3>
					<p>Could not load lens: {lensId}</p>
					<p>Available lenses: {getAllLensIds().join(', ')}</p>
				</div>
			</div>
		);
	}

	if (!file) {
		return (
			<div className={styles.fullPageContainer}>
				<div className={styles.error}>
					<h3>📁 No File Selected</h3>
					<p>
						Please select a file to view with the{' '}
						{lens.config.label} lens.
					</p>
				</div>
			</div>
		);
	}

	const lensConfig = lens.config || {};

	return (
		<div className={styles.fullPageContainer}>
			<StudyBar
				file={file}
				onLensAction={handleLensAction}
				onActionLensExecution={handleActionLensExecution}
				currentLensId={lensId}
				className={styles.studyBar}
			/>
			<main className={styles.mainContent}>
				<div className={styles.lensContainer}>
					{lens.render(file, lensConfig)}
				</div>
			</main>

			{/* Execution container for action lenses */}
			<div
				ref={executionContainerRef}
				className={styles.executionContainer}
			></div>

			{modalState && (
				<ModalContainer
					lensId={modalState.lensId}
					code={file.content}
					config={modalState.config}
					component={modalState.component}
					onClose={closeModal}
				/>
			)}
		</div>
	);
};

export default FullPageContainer;
