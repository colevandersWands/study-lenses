import { createContext } from 'preact';
import { useContext, useState, useCallback } from 'preact/hooks';
import URLManager from '../utils/urlManager.js';
import { editorialize } from '../../load-virtual-fs.js';

// Create the context
const AppContext = createContext(null);

// Context provider component
export const AppProvider = ({ children }) => {
	// Enliven-based file system state (set once, never updated)
	const [enlivenedFS, setEnlivenedFS] = useState(null);
	const [currentFile, setCurrentFile] = useState(null);
	const [fileHistory, setFileHistory] = useState([]);

	// Exercise system state
	const [currentExercise, setCurrentExercise] = useState('editor');
	const [activeTransforms, setActiveTransforms] = useState([]);
	const [exerciseConfig, setExerciseConfig] = useState({});

	// Learning tracking state
	const [studySessions, setStudySessions] = useState([]);

	// Selection scope state
	const [currentScope, setCurrentScope] = useState({
		type: 'whole-file',
		code: '',
		text: '',
		lines: null,
		selection: null,
	});

	// Sandbox state
	const [sandboxFile, setSandboxFile] = useState(null);
	const [isSandboxModalOpen, setIsSandboxModalOpen] = useState(false);

	// Simple file navigation with enliven objects
	const addToHistory = useCallback((file) => {
		setFileHistory((prev) => {
			const filtered = prev.filter((f) => f.path !== file.path);
			return [file, ...filtered].slice(0, 50); // Keep last 50 files
		});
	}, []);

	const setCurrentFileWithHistory = useCallback(
		(file) => {
			if (file && file !== currentFile) {
				setCurrentFile(file);
				addToHistory(file);

				// Update URL when file changes
				if (file?.path) {
					URLManager.switchFile(file.path);
				}
			}
		},
		[currentFile, addToHistory]
	);

	// Study tracking function
	const trackStudyAction = useCallback(
		(action, resource, details = {}) => {
			if (!resource) return;

			const entry = {
				timestamp: Date.now(),
				action, // 'file_open', 'exercise_change', 'code_run', 'transform_apply', etc.
				resourcePath: resource.path,
				exerciseType: currentExercise,
				...details,
			};

			setStudySessions((prev) => [...prev, entry]);
		},
		[currentExercise]
	);

	// Helper functions for exercise management
	const switchExercise = useCallback(
		(exerciseType) => {
			if (exerciseType !== currentExercise) {
				const previousExercise = currentExercise;
				setCurrentExercise(exerciseType);

				// Clear the previous lens from URL and add the new one
				if (previousExercise && previousExercise !== exerciseType) {
					URLManager.updateLensConfig(previousExercise, null); // Remove old lens
				}
				URLManager.updateLensConfig(exerciseType, 'active'); // Add new lens

				// Track the exercise change
				trackStudyAction('exercise_change', currentFile, {
					from: currentExercise,
					to: exerciseType,
				});
			}
		},
		[currentExercise, currentFile, trackStudyAction]
	);

	const applyTransforms = useCallback(
		(transforms) => {
			setActiveTransforms(transforms);
			trackStudyAction('transforms_applied', currentFile, { transforms });
		},
		[currentFile, trackStudyAction]
	);

	// Sandbox file factory function
	const getOrCreateSandboxFile = useCallback(() => {
		if (sandboxFile) return sandboxFile; // Reuse existing

		const newSandboxFile = editorialize({
			name: 'sandbox.js',
			path: '/sandbox/sandbox.js',
			content:
				'// Welcome to your sandbox!\n// Experiment with code here\n\n',
			lang: '.js',
			type: 'file',
		});

		setSandboxFile(newSandboxFile);
		return newSandboxFile;
	}, [sandboxFile]);

	// Context value object
	const value = {
		// Enliven-based file system state
		enlivenedFS,
		setEnlivenedFS,
		currentFile,
		setCurrentFile: setCurrentFileWithHistory,
		fileHistory,

		// Exercise system state
		currentExercise,
		setCurrentExercise: switchExercise,
		activeTransforms,
		setActiveTransforms: applyTransforms,
		exerciseConfig,
		setExerciseConfig,

		// Learning tracking
		studySessions,
		trackStudyAction,

		// Selection scope
		currentScope,
		setCurrentScope,

		// Sandbox functionality
		sandboxFile,
		setSandboxFile,
		isSandboxModalOpen,
		setIsSandboxModalOpen,
		getOrCreateSandboxFile,
	};

	return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// Custom hook to use the context
export const useApp = () => {
	const context = useContext(AppContext);
	if (!context) {
		throw new Error('useApp must be used within an AppProvider');
	}
	return context;
};

// Export context for advanced usage
export { AppContext };
