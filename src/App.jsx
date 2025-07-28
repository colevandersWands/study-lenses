import { useState, useEffect } from 'preact/hooks';
import { AppProvider, useApp } from './context/AppContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { ColorizeProvider } from './context/ColorizeContext.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import FileBrowser from './components/FileBrowser.jsx';
import ExercisePicker from './components/ExercisePicker.jsx';
import ExerciseRenderer from './components/ExerciseRenderer.jsx';
import SandboxModal from './components/SandboxModal.jsx';
import { loadVirtualFS } from '../load-virtual-fs.js';
import URLManager from './utils/urlManager.js';
import styles from './App.module.css';
import { BASE_PATH } from './CONSTANTS.js';

// Content is loaded dynamically via loadFS

/**
 * Main Application Component
 */
export const App = () => {
	return (
		<ErrorBoundary>
			<ToastProvider>
				<ColorizeProvider>
					<AppProvider>
						<AppContent />
					</AppProvider>
				</ColorizeProvider>
			</ToastProvider>
		</ErrorBoundary>
	);
};

const AppContent = () => {
	const {
		enlivenedFS,
		setEnlivenedFS,
		setCurrentFile,
		setCurrentExercise: switchExercise,
		isSandboxModalOpen,
		setIsSandboxModalOpen,
	} = useApp();
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState(null);
	const [currentFilePath, setCurrentFilePath] = useState(null);
	const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

	// Get exercise type from URL lens parameters
	const getExerciseFromURL = (lensParams) => {
		if (lensParams.blanks) return 'blanks';
		if (lensParams.dropdowns) return 'dropdowns';
		if (lensParams.parsons) return 'parsons';
		if (lensParams.flowchart) return 'flowchart';
		if (lensParams.variables) return 'variables';
		if (lensParams.pythontutor) return 'pythontutor';
		if (lensParams.notional) return 'notional';
		if (lensParams.writeme) return 'writeme';
		if (lensParams.highlight) return 'highlight';
		if (lensParams.editor) return 'editor';
		if (lensParams.print) return 'print';
		if (lensParams.assets) return 'assets';
		if (lensParams.flashcards) return 'flashcards';
		return null;
	};

	// Extract repository information from URL path
	const getRepoFromPath = () => {
		const pathParts = window.location.pathname.split('/').filter(Boolean);

		// Remove base path parts if present
		const basePathParts = BASE_PATH.split('/').filter(Boolean);
		const relevantParts = pathParts.slice(basePathParts.length);

		// Handle demo mode
		if (relevantParts.length >= 1 && relevantParts[0] === 'demo') {
			return null;
		}

		if (relevantParts.length >= 2) {
			return {
				username: relevantParts[0],
				repository: relevantParts[1],
			};
		}
		return null;
	};

	// Initialize the app
	useEffect(() => {
		const initializeApp = async () => {
			try {
				setIsLoading(true);

				// Check if we're viewing a GitHub repository
				const repoInfo = getRepoFromPath();
				// console.log(repoInfo);

				// Determine content URL based on context
				let contentUrl;
				if (repoInfo) {
					// Load from repository API endpoint
					const baseUrl = window.location.origin;
					contentUrl = `${baseUrl}${BASE_PATH}api/${repoInfo.username}/${repoInfo.repository}/content.json`;
					// console.log(
					//	`Loading repository: ${repoInfo.username}/${repoInfo.repository}`
					// );
				} else {
					// Load default content
					contentUrl = '/demo.json';
					// console.log('Loading default content');
				}

				// Load initial filesystem and enliven it
				const enlivenedFS = await loadVirtualFS(contentUrl);
				setEnlivenedFS(enlivenedFS);

				// Wait a bit to ensure virtual FS is set before file operations
				await new Promise((resolve) => setTimeout(resolve, 10));

				// Check if URL specifies a file to load or has compressed code
				const { filePath, lensParams, compressedCode, pseudocode } =
					URLManager.parseURL();
				const exerciseType = getExerciseFromURL(lensParams);
				let fileToLoad = null;

				if (compressedCode) {
					// Handle code sharing - create a virtual file from compressed code
					const decompressedCode =
						URLManager.decompressCode(compressedCode);

					if (decompressedCode) {
						const sharedFile = {
							name: 'Shared Code',
							path: '/shared/code.js',
							content: decompressedCode,
							lang: '.js', // Default to JS, could be enhanced to detect language
							type: 'file',
						};

						setCurrentFile(sharedFile);
						setCurrentFilePath(sharedFile.path);
						fileToLoad = sharedFile;

						// Switch to the specified exercise type
						if (exerciseType) {
							switchExercise(exerciseType);
						}
					} else {
						console.warn('❌ Failed to decompress shared code');
					}
				} else if (filePath) {
					fileToLoad = enlivenedFS?.find(filePath);

					if (fileToLoad) {
						setCurrentFile(fileToLoad);
						setCurrentFilePath(fileToLoad.path);

						// Switch to the specified exercise type
						if (exerciseType) {
							switchExercise(exerciseType);
						}
					} else {
						console.warn(
							'❌ File not found:',
							filePath,
							'- loading fallback file instead'
						);
						// Fallback to first available file
						if (enlivenedFS?.children?.length > 0) {
							const fallbackFile =
								enlivenedFS.children.find(
									(child) => child.type === 'file'
								) ||
								enlivenedFS.children[0]?.children?.find(
									(child) => child.type === 'file'
								);
							if (fallbackFile) {
								setCurrentFile(fallbackFile);
								fileToLoad = fallbackFile;
								// console.log(
								//	'📢 Loaded fallback file:',
								//	fallbackFile.name
								// );
							}
						}
					}
				}

				// Fallback: Load README or index if no URL file or file not found
				if (!fileToLoad && enlivenedFS) {
					// Try to find README or index files in order of preference
					const fallbackPaths = [
						'/README.md',
						'/readme.md',
						'/index.js',
						'/index.html',
						'/index.md',
						'/main.js',
						'/app.js',
					];

					let fallbackFile = null;
					for (const path of fallbackPaths) {
						fallbackFile = enlivenedFS.find(path);
						if (fallbackFile) break;
					}

					if (fallbackFile) {
						setCurrentFile(fallbackFile);

						// Show notification if we were looking for a specific file
						if (filePath || compressedCode) {
							const notFoundItem = filePath || 'shared code';
							console.warn(
								`📢 "${notFoundItem}" was not found, showing ${fallbackFile.name} instead`
							);
							// TODO: Add toast notification here
						}
					} else {
						// Last resort - get first available file from the filesystem
						if (enlivenedFS?.children?.length > 0) {
							const anyFile =
								enlivenedFS.children.find(
									(child) => child.type === 'file'
								) ||
								enlivenedFS.children[0]?.children?.find(
									(child) => child.type === 'file'
								);
							if (anyFile) {
								setCurrentFile(anyFile);
							}
						}
					}
				}

				setIsLoading(false);
			} catch (err) {
				console.error('❌ Failed to initialize app:', err);

				// Provide helpful error messages based on context
				const repoInfo = getRepoFromPath();
				let errorMessage = err.message || 'Failed to load content';

				if (repoInfo) {
					if (
						err.message?.includes('404') ||
						err.message?.includes('not found')
					) {
						errorMessage = `Repository '${repoInfo.username}/${repoInfo.repository}' not found or is private. Please check the repository name and ensure it's public.`;
					} else if (err.message?.includes('Failed to fetch')) {
						errorMessage = `Unable to connect to the Study Lenses server. The repository '${repoInfo.username}/${repoInfo.repository}' may be processing or the server may be unavailable.`;
					} else if (err.message?.includes('too large')) {
						errorMessage = `Repository '${repoInfo.username}/${repoInfo.repository}' is too large to process. Please try a smaller repository.`;
					} else {
						errorMessage = `Failed to load repository '${repoInfo.username}/${repoInfo.repository}': ${errorMessage}`;
					}
				}

				setError(errorMessage);
				setIsLoading(false);
			}
		};

		initializeApp();
	}, []); // Run only once on mount

	// Listen for hash changes and load new files
	useEffect(() => {
		const handleHashChange = () => {
			const { filePath, lensParams, compressedCode } =
				URLManager.parseURL();
			const exerciseType = getExerciseFromURL(lensParams);

			if (compressedCode) {
				// Handle shared code - this is a new file, so switch exercise
				const decompressedCode =
					URLManager.decompressCode(compressedCode);

				if (decompressedCode) {
					const sharedFile = {
						name: 'Shared Code',
						path: '/shared/code.js',
						content: decompressedCode,
						lang: '.js',
						type: 'file',
					};

					setCurrentFile(sharedFile);
					setCurrentFilePath(sharedFile.path);

					if (exerciseType) {
						switchExercise(exerciseType);
					}
				} else {
					console.warn(
						'❌ Failed to decompress shared code after hash change'
					);
				}
			} else if (filePath) {
				const fileToLoad = enlivenedFS?.find(filePath);

				if (fileToLoad) {
					// Only switch exercise if the file path actually changed
					const fileChanged = fileToLoad.path !== currentFilePath;

					setCurrentFile(fileToLoad);
					setCurrentFilePath(fileToLoad.path);

					// Only switch exercise when the file actually changes, not just the lens
					if (exerciseType && fileChanged) {
						// console.log('📁 File changed, switching exercise:', {
						//	from: currentFilePath,
						//	to: fileToLoad.path,
						//	exercise: exerciseType,
						// });
						switchExercise(exerciseType);
					} else if (exerciseType && !fileChanged) {
						// console.log(
						//	'🔍 Lens changed, keeping current exercise:',
						//	{
						//		file: fileToLoad.path,
						//		lens: exerciseType,
						//	}
						// );
					}
				} else {
					console.warn(
						'❌ File not found after hash change:',
						filePath
					);

					// Fallback to README/index
					const fallbackPaths = [
						'/README.md',
						'/readme.md',
						'/index.js',
						'/index.html',
						'/index.md',
					];
					let fallbackFile = null;
					for (const path of fallbackPaths) {
						fallbackFile = enlivenedFS?.find(path);
						if (fallbackFile) break;
					}

					if (fallbackFile) {
						setCurrentFile(fallbackFile);
						// TODO: Show toast notification
					}
				}
			}
		};

		window.addEventListener('hashchange', handleHashChange);
		return () => window.removeEventListener('hashchange', handleHashChange);
	}, [setCurrentFile, switchExercise, enlivenedFS, currentFilePath]);

	if (isLoading) {
		return (
			<div className={styles.loadingContainer}>
				<div className={styles.loadingSpinner}>🔄</div>
				<div>Loading Study Lenses...</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className={styles.errorContainer}>
				<div className={styles.errorIcon}>❌</div>
				<div className={styles.errorMessage}>
					<h2>Failed to Load</h2>
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

	return (
		<div className={styles.appContainer}>
			<div className={`${styles.sidebar} ${isSidebarCollapsed ? styles.sidebarCollapsed : ''}`}>
				<div className={styles.sidebarHeader}>
					<div className={styles.headerTop}>
						<button
							className={styles.toggleButton}
							onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
							title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
						>
							{isSidebarCollapsed ? '▶' : '◀'}
						</button>
						{!isSidebarCollapsed && (
							<>
								<h1 className={styles.appTitle}>Study Lenses</h1>
								<button
									className={styles.sandboxButton}
									onClick={() => setIsSandboxModalOpen(true)}
									title="Open Sandbox - experiment with code"
								>
									🏖️ Sandbox
								</button>
							</>
						)}
					</div>
					{!isSidebarCollapsed && (
						<a
							className={styles.appSubtitle}
							href="https://github.com/colevandersWands/"
							target="_blank"
						>
							(github repo)
						</a>
					)}
					{/* <p className={styles.appSubtitle}>Learn code through interactive lenses</p> */}
				</div>

				<div style={{ 
					display: isSidebarCollapsed ? 'none' : 'flex', 
					flexDirection: 'column', 
					flex: 1,
					overflow: 'hidden'
				}}>
					<FileBrowser />
					<ExercisePicker />
				</div>
			</div>

			<div className={styles.mainContent}>
				<ErrorBoundary
					fallback={(error, reset) => (
						<div style={{ padding: '2rem', textAlign: 'center' }}>
							<h3>Exercise Error</h3>
							<p>There was an error loading this exercise.</p>
							<button onClick={reset}>Try Again</button>
						</div>
					)}
				>
					<ExerciseRenderer />
				</ErrorBoundary>
			</div>

			{/* Sandbox Modal */}
			<SandboxModal
				isOpen={isSandboxModalOpen}
				onClose={() => setIsSandboxModalOpen(false)}
			/>
		</div>
	);
};
