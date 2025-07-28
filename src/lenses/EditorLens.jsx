import {
	useState,
	useRef,
	useEffect,
	useCallback,
	useMemo,
} from 'preact/hooks';
import { memo } from 'preact/compat';
import StepThroughModal from '../components/StepThroughModal.jsx';
import { useApp } from '../context/AppContext.jsx';
import { useColorize } from '../context/ColorizeContext.jsx';
import { deepFreeze } from '../utils/deepFreeze.js';
import styles from './EditorLens.module.css';

/**
 * EditorLens - Interactive code editor with lens selection system
 * Implements the new mental model:
 * - Default: Whole file selected, lens icon in upper-right
 * - Selection: Icon moves to selection, scope narrows
 */
const EditorLens = ({ resource }) => {
	const fileName = resource?.name || '';
	const filePath = resource?.path || '';

	const { currentFile, currentScope, setCurrentScope } = useApp();
	const { enableColorize } = useColorize();
	const editorContainer = useRef();

	// Get current content from enliven file
	const getCurrentCode = useCallback(() => {
		return currentFile?.content || '';
	}, [currentFile]);

	// Get current editor content from enliven file or transformed resource
	const getCurrentContent = useMemo(() => {
		// If resource has been transformed (e.g., pseudocode), use the transformed content
		if (resource?.isPseudocode || resource?.originalContent) {
			return resource.content;
		}

		return currentFile?.content || '';
	}, [currentFile, resource]);

	// Note: Using getCurrentContent dynamically instead of static initialContent

	// Track current file path to detect changes
	const currentFilePathRef = useRef(filePath);

	const [showInstructions, setShowInstructions] = useState(false);
	const [showHtmlPreview, setShowHtmlPreview] = useState(false);
	const [showStepThroughModal, setShowStepThroughModal] = useState(false);

	// Check file types
	const isHtmlFile =
		fileName.toLowerCase().endsWith('.html') ||
		fileName.toLowerCase().endsWith('.htm');
	const isVideoFile =
		fileName.toLowerCase().endsWith('.mp4') ||
		fileName.toLowerCase().endsWith('.webm') ||
		fileName.toLowerCase().endsWith('.mov');

	// Setup enliven editor integration
	useEffect(() => {
		if (currentFile?.view && editorContainer.current) {
			// Clear container and append enliven editor
			editorContainer.current.innerHTML = '';
			editorContainer.current.appendChild(currentFile.view);

			// Editor is now managed by enliven - no need for global adapter
		}
	}, [currentFile]);

	// Helper functions for external access (enliven-based)
	const getEditorLegacy = useCallback(() => {
		// Get editor from enliven view
		return currentFile?.view?.querySelector('.cm-editor')?.cmView || null;
	}, [currentFile]);

	const getValueLegacy = useCallback(() => {
		return getCurrentCode();
	}, [getCurrentCode]);

	const getSelection = useCallback(() => {
		const editor = getEditorLegacy();
		if (editor) {
			const selection = editor.state.selection.main;
			return {
				from: selection.from,
				to: selection.to,
				text: editor.state.doc.sliceString(
					selection.from,
					selection.to
				),
			};
		}
		return null;
	}, [getEditorLegacy]);

	// Initialize scope only once when component mounts
	const scopeInitializedRef = useRef(false);

	useEffect(() => {
		// Only initialize scope once
		if (!scopeInitializedRef.current) {
			const content = getCurrentCode();
			setCurrentScope({
				type: 'whole-file',
				code: content,
				text: content,
				lines: null,
				selection: null,
			});
			scopeInitializedRef.current = true;
		}
	}, []); // Empty dependency array - only runs once

	// Handle file changes - update scope when switching files
	useEffect(() => {
		if (currentFilePathRef.current !== filePath) {
			currentFilePathRef.current = filePath;

			// Update scope for new file
			if (scopeInitializedRef.current) {
				const newContent = getCurrentCode();
				setCurrentScope({
					type: 'whole-file',
					code: newContent,
					text: newContent,
					lines: null,
					selection: null,
				});
			}
		}
	}, [filePath, getCurrentCode]); // Only depend on filePath to reduce unnecessary renders

	return (
		<div
			className={styles.editorLens}
			style={{
				// HACK: Force hardware acceleration to prevent flickering
				transform: 'translateZ(0)',
				backfaceVisibility: 'hidden',
				perspective: '1000px',
			}}
		>
			<div className={styles.header}>
				<h3>📖 Editor Mode</h3>
				{fileName && (
					<span className={styles.fileName}>{fileName}</span>
				)}
				{/* <div className={styles.scopeDisplay}>
          {currentScope.type === 'selection'
            ? `Lines ${currentScope.lines?.start}-${currentScope.lines?.end}`
            : 'Whole File'}
        </div> */}
				<div className={styles.saveStatus}>
					{(() => {
						// Enliven automatically manages changes, so we don't track them here
						const hasChanges = false;
						const hasEditorContent = false;

						return (
							<div className={styles.statusContainer}>
								<button
									className={styles.formatButton}
									onClick={async () => {
										// Format file content using enliven
										try {
											await currentFile?.format();

											// Update scope if in whole-file mode
											const formattedContent =
												currentFile?.content || '';
											if (
												currentScope.type ===
												'whole-file'
											) {
												setCurrentScope({
													type: 'whole-file',
													code: formattedContent,
													text: formattedContent,
													lines: null,
													selection: null,
												});
											}
										} catch (error) {
											console.error(
												'Format failed:',
												error
											);
										}
									}}
									title="Format code with Prettier"
								>
									Format
								</button>
								<button
									className={styles.resetButton}
									onClick={() => {
										// Reset file content using enliven
										currentFile?.reset();

										// Update scope if in whole-file mode
										const resetContent =
											currentFile?.content || '';
										if (
											currentScope.type === 'whole-file'
										) {
											setCurrentScope({
												type: 'whole-file',
												code: resetContent,
												text: resetContent,
												lines: null,
												selection: null,
											});
										}
									}}
									title="Reset to original code"
								>
									Reset
								</button>
							</div>
						);
					})()}
				</div>
			</div>

			<div className={styles.editorContainer}>
				{isVideoFile ? (
					/* Video Player for MP4 files - replaces the editor */
					<div className={styles.videoContainer}>
						<video
							className={styles.videoPlayer}
							controls
							preload="metadata"
							src={`data:video/mp4;base64,${btoa(code)}`}
						>
							<p>
								Your browser doesn't support HTML5 video.{' '}
								<a
									href={`data:video/mp4;base64,${btoa(code)}`}
									download={fileName}
								>
									Download the video
								</a>{' '}
								instead.
							</p>
						</video>
						<div className={styles.videoInfo}>
							<h4>📹 {fileName}</h4>
							<p>
								Size: {(code.length / 1024 / 1024).toFixed(2)}{' '}
								MB
							</p>
							<button
								className={styles.downloadButton}
								onClick={() => {
									const blob = new Blob([code], {
										type: 'video/mp4',
									});
									const url = URL.createObjectURL(blob);
									const a = document.createElement('a');
									a.href = url;
									a.download = fileName;
									a.click();
									URL.revokeObjectURL(url);
								}}
							>
								💾 Download
							</button>
						</div>
					</div>
				) : (
					/* CodeMirror Editor for non-video files */
					<div className={styles.editorWrapper}>
						<div
							ref={editorContainer}
							className={styles.codeEditor}
						/>
					</div>
				)}
			</div>

			{/* Additional Tools Panel for HTML Preview (kept below editor) */}
			{isHtmlFile && (
				<div className={styles.additionalToolsPanel}>
					<div className={styles.htmlSection}>
						<h4>🌐 HTML Live Preview</h4>
						<div className={styles.htmlControls}>
							<button
								className={styles.previewButton}
								onClick={() =>
									setShowHtmlPreview(!showHtmlPreview)
								}
							>
								{showHtmlPreview
									? '📝 Code Only'
									: '👁️ Live Preview'}
							</button>
							<button
								className={styles.previewButton}
								onClick={() => {
									// Create a sanitized version for new tab to avoid import errors
									const currentContent =
										currentScope.code || '';
									const sanitizedHtml = currentContent
										.replace(
											/import\s+.*?from\s+['"][^'"]*['"];?\s*/g,
											'// import removed for preview'
										)
										.replace(
											/from\s+['"]\.\/[^'"]*['"]/,
											'from "#"'
										);
									const blob = new Blob([sanitizedHtml], {
										type: 'text/html',
									});
									const url = URL.createObjectURL(blob);
									window.open(url, '_blank');
									setTimeout(
										() => URL.revokeObjectURL(url),
										1000
									);
								}}
							>
								🚀 Open in New Tab
							</button>
						</div>
						{showHtmlPreview && (
							<div className={styles.htmlPreview}>
								<iframe
									srcDoc={(currentScope.code || '').replace(
										/import\s+.*?from\s+['"][^'"]*['"];?\s*/g,
										'<!-- import removed for preview -->'
									)}
									title="HTML Preview"
									className={styles.previewFrame}
									sandbox="allow-scripts allow-forms allow-popups allow-same-origin allow-modals"
								/>
							</div>
						)}
					</div>
				</div>
			)}

			<div className={styles.instructions}>
				<h4
					className={styles.instructionsHeader}
					onClick={() => setShowInstructions(!showInstructions)}
				>
					💡 How to Use {showInstructions ? '▼' : '▶'}
				</h4>
				{showInstructions && (
					<ul className={styles.instructionsList}>
						<li>
							<strong>Whole File Study:</strong> Click the lens
							icon 🔍 in upper-right to change study mode
						</li>
						<li>
							<strong>Selection Study:</strong> Select text to
							narrow scope - icon moves to selection
						</li>
						<li>
							<strong>Run Code:</strong> Always enabled - runs
							whole file or selection based on scope
						</li>
						<li>
							<strong>Switch Lenses:</strong> Use dropdown to
							change between study modes
						</li>
					</ul>
				)}
			</div>

			{/* Step-Through Modal */}
			<StepThroughModal
				isOpen={showStepThroughModal}
				onClose={() => setShowStepThroughModal(false)}
			/>
		</div>
	);
};

// Editor lens - unified interface
export const id = 'editor';
export const label = 'Editor';
export const applicable = (file) => true; // Always applicable
export const render = (resource, _config) => {
	const finalConfig = { ...config, ..._config };
	return <EditorLens resource={resource} config={finalConfig} />;
};
export const config = deepFreeze({});
export const renderConfig = () => null; // No configuration UI needed

// Legacy edit exports removed - now using unified API pattern only

export default memo(EditorLens);
