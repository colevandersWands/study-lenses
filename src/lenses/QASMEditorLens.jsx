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
import styles from './QASMEditorLens.module.css';

import '../../public/static/q.js';

/**
 * QASMEditorLens - Interactive code editor with lens selection system
 * Implements the new mental model:
 * - Default: Whole file selected, lens icon in upper-right
 * - Selection: Icon moves to selection, scope narrows
 */
const QASMEditorLens = ({ resource }) => {
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
	
	// Two-panel synchronization state
	const [rightPanelContent, setRightPanelContent] = useState('');
	const debounceTimeoutRef = useRef(null);

	// Check file types
	const isHtmlFile =
		fileName.toLowerCase().endsWith('.html') ||
		fileName.toLowerCase().endsWith('.htm');
	const isVideoFile =
		fileName.toLowerCase().endsWith('.mp4') ||
		fileName.toLowerCase().endsWith('.webm') ||
		fileName.toLowerCase().endsWith('.mov');

	// Helper functions for external access (enliven-based) - MUST be defined before useEffect
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

	// Debounced function to update textarea from editor
	const updateTextareaFromEditor = useCallback((content) => {
		if (debounceTimeoutRef.current) {
			clearTimeout(debounceTimeoutRef.current);
		}
		
		debounceTimeoutRef.current = setTimeout(() => {
			if (rightPanelContent !== content) {
				setRightPanelContent(content);
			}
		}, 500);
	}, [rightPanelContent]);

	// Debounced function to update editor from textarea
	const updateEditorFromTextarea = useCallback((content) => {
		if (debounceTimeoutRef.current) {
			clearTimeout(debounceTimeoutRef.current);
		}
		
		debounceTimeoutRef.current = setTimeout(() => {
			const editor = getEditorLegacy();
			if (editor && editor.state.doc.toString() !== content) {
				editor.dispatch({
					changes: {
						from: 0,
						to: editor.state.doc.length,
						insert: content
					}
				});
			}
		}, 500);
	}, [getEditorLegacy]);

	// Setup enliven editor integration
	useEffect(() => {
		if (currentFile?.view && editorContainer.current) {
			// Clear container and append enliven editor
			editorContainer.current.innerHTML = '';
			editorContainer.current.appendChild(currentFile.view);

			// Set up polling to sync editor changes to textarea
			const pollEditor = () => {
				const editor = getEditorLegacy();
				if (editor) {
					const editorContent = editor.state.doc.toString();
					if (editorContent !== rightPanelContent) {
						updateTextareaFromEditor(editorContent);
					}
				}
			};

			const pollInterval = setInterval(pollEditor, 100); // Poll every 100ms

			return () => {
				clearInterval(pollInterval);
			};
		}
	}, [currentFile, getEditorLegacy, updateTextareaFromEditor, rightPanelContent]);

	// Initialize right panel content when currentFile changes
	useEffect(() => {
		if (currentFile?.content !== undefined) {
			setRightPanelContent(currentFile.content);
		}
	}, [currentFile?.content]);

	// Handle textarea changes
	const handleRightPanelChange = useCallback((event) => {
		const newContent = event.target.value;
		setRightPanelContent(newContent);
		updateEditorFromTextarea(newContent);
	}, [updateEditorFromTextarea]);

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

	// Cleanup debounce timeout on unmount
	useEffect(() => {
		return () => {
			if (debounceTimeoutRef.current) {
				clearTimeout(debounceTimeoutRef.current);
			}
		};
	}, []);

	return (
		<div
			className={styles.QASMEditorLens}
			style={{
				// HACK: Force hardware acceleration to prevent flickering
				transform: 'translateZ(0)',
				backfaceVisibility: 'hidden',
				perspective: '1000px',
			}}
		>
			<div className={styles.header}>
				<h3>Quantum Gates: OpenQasm 2.0</h3>
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
								{/* <button
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
								</button> */}
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
					/* Two-panel layout for QASM editor */
					<div className={styles.panelContainer}>
						{/* Left Panel - CodeMirror Editor */}
						<div className={styles.leftPanel}>
							<div className={styles.panelHeader}>
								📝 Editor
							</div>
							<div className={styles.editorWrapper}>
								<div
									ref={editorContainer}
									className={styles.codeEditor}
								/>
							</div>
						</div>
						
						{/* Right Panel - Plain Textarea */}
						<div className={styles.rightPanel}>
							<div className={styles.panelHeader}>
								📄 Content
							</div>
							<textarea
								className={styles.syncTextarea}
								value={rightPanelContent}
								onChange={handleRightPanelChange}
								placeholder="Content will sync with editor..."
								spellCheck={false}
							/>
						</div>
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
export const id = 'qasm';
export const label = 'OpenQASM2';
export const applicable = (file) => file && file.lang === '.qasm';
export const render = (resource, _config) => {
	const finalConfig = { ...config, ..._config };
	return <QASMEditorLens resource={resource} config={finalConfig} />;
};
export const config = deepFreeze({});
export const renderConfig = () => null; // No configuration UI needed

// Legacy edit exports removed - now using unified API pattern only

export default memo(QASMEditorLens);
