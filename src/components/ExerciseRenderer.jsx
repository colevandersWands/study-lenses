import { useState, useEffect } from 'preact/hooks';
import { useApp } from '../context/AppContext.jsx';
import { useColorize } from '../context/ColorizeContext.jsx';
import { getLens } from '../lenses/index.js';
import FullPageContainer from '../containers/FullPageContainer.jsx';
import styles from './ExerciseRenderer.module.css';

/**
 * Exercise Renderer Component - Renders the current exercise
 * Simplified to use direct dynamic imports instead of ExerciseManager
 */
const ExerciseRenderer = () => {
	const [exerciseComponent, setExerciseComponent] = useState(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState(null);

	const {
		currentFile,
		currentExercise,
		activeTransforms,
		trackStudyAction,
		currentScope,
	} = useApp();

	const { enableColorize } = useColorize();

	// Load exercise when file or exercise type changes
	useEffect(() => {
		const loadExercise = async () => {
			if (!currentFile) {
				setExerciseComponent(null);
				return;
			}

			// Always use markdown lens for markdown files for readable document view
			let exerciseToUse = currentExercise;
			if (currentFile.lang === 'markdown') {
				exerciseToUse = 'markdown';
			}

			// URL migration: redirect old 'study' lens to 'editor'
			if (exerciseToUse === 'study') {
				exerciseToUse = 'editor';
			}

			if (!exerciseToUse) {
				setExerciseComponent(null);
				return;
			}

			setIsLoading(true);
			setError(null);

			try {
				// Apply transforms if any are active
				let resourceToRender = currentFile;

				// Note: Scope handling is done internally by StudyLens to prevent re-render loops
				// Removed scope application here to prevent resourceToRender object recreation

				// Get the lens module from unified registry
				const requestedLens = getLens(exerciseToUse);

				// Check if lens exists and has render method (render lenses)
				if (requestedLens && requestedLens.render && typeof requestedLens.render === 'function') {
					const componentKey = `${currentFile.path}-${exerciseToUse}`;
					setExerciseComponent(() => (
						<FullPageContainer
							key={componentKey}
							lensId={exerciseToUse}
							file={currentFile}
						/>
					));
					setIsLoading(false);
					return;
				}

				// Check if lens exists and has execute method (action lenses)
				// Action lenses should not be rendered as main content
				if (requestedLens && requestedLens.execute && typeof requestedLens.execute === 'function') {
					console.warn(`Lens '${exerciseToUse}' is an action lens, not a render lens. Falling back to editor.`);
					exerciseToUse = 'editor'; // Fall back to editor for action lenses
				}

				// Try fallback to editor lens
				const editorLens = getLens('editor');
				if (editorLens && editorLens.render) {
					if (exerciseToUse !== 'editor') {
						console.warn(`Lens '${exerciseToUse}' not found or not renderable, falling back to 'editor'`);
					}
					
					const componentKey = `${currentFile.path}-editor`;
					setExerciseComponent(() => (
						<FullPageContainer
							key={componentKey}
							lensId="editor"
							file={currentFile}
						/>
					));
					setIsLoading(false);
					return;
				}

				// Ultimate fallback - basic text viewer with .txt extension support
				console.error(`Failed to load any lens, showing basic text viewer`);
				const componentKey = `${currentFile.path}-basic-text`;
				setExerciseComponent(() => (
					<div key={componentKey} style={{ 
						padding: '20px', 
						fontFamily: 'monospace', 
						whiteSpace: 'pre-wrap',
						backgroundColor: '#1e1e1e',
						color: '#d4d4d4',
						overflow: 'auto',
						height: '100%'
					}}>
						<div style={{ marginBottom: '10px', opacity: 0.7 }}>
							📄 {currentFile.name} (Basic Text View)
						</div>
						{currentFile.content}
					</div>
				));
				setIsLoading(false);

				// Track that user opened this file with this exercise
				trackStudyAction('file_open', currentFile, {
					exercise: exerciseToUse,
					transforms: activeTransforms,
				});

				setIsLoading(false);
			} catch (err) {
				console.error('Failed to apply transforms:', err);
				setError('Failed to apply transforms: ' + err.message);
				setIsLoading(false);
			}
		};

		loadExercise();
	}, [
		currentFile,
		currentExercise,
		activeTransforms,
		enableColorize,
		trackStudyAction,
	]);

	if (!currentFile) {
		return (
			<div className={styles.rendererContainer}>
				<div className={styles.emptyState}>
					<div className={styles.emptyIcon}>📚</div>
					<h2>Welcome to Spiral Lens</h2>
					<p>Select a file from the sidebar to start studying code</p>
				</div>
			</div>
		);
	}

	if (isLoading) {
		return (
			<div className={styles.rendererContainer}>
				<div className={styles.loadingState}>
					<div className={styles.loadingSpinner}>🔄</div>
					<p>Loading {currentExercise || 'exercise'}...</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className={styles.rendererContainer}>
				<div className={styles.errorState}>
					<div className={styles.errorIcon}>❌</div>
					<h3>Exercise Failed to Load</h3>
					<p>{error}</p>
					<button
						className={styles.retryButton}
						onClick={() => window.location.reload()}
					>
						Retry
					</button>
				</div>
			</div>
		);
	}

	if (!exerciseComponent) {
		return (
			<div className={styles.rendererContainer}>
				<div className={styles.emptyState}>
					<div className={styles.emptyIcon}>🎯</div>
					<h3>No Exercise Available</h3>
					<p>No exercise found for {currentFile.name}</p>
				</div>
			</div>
		);
	}

	// Render the exercise component
	return (
		<div className={styles.rendererContainer}>
			<div className={styles.exerciseContent}>{exerciseComponent}</div>
		</div>
	);
};

export default ExerciseRenderer;
