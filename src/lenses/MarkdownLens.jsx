import { useState, useEffect, useRef } from 'preact/hooks';
import { render as preactRender } from 'preact';
import { useApp } from '../context/AppContext.jsx';
import StepThroughModal from '../components/StepThroughModal.jsx';
import EmbeddedTrace from '../components/EmbeddedTrace.jsx';
import InteractiveCodeBlock from '../components/InteractiveCodeBlock.jsx';
import LensModal from '../components/LensModal.jsx';
import { editorialize } from '../../load-virtual-fs.js';
import { deepFreeze } from '../utils/deepFreeze.js';
import styles from './MarkdownLens.module.css';
import { BASE_PATH } from '../CONSTANTS.js';

// Import Prism.js for syntax highlighting
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-markdown';
import 'prismjs/themes/prism-tomorrow.css'; // Dark theme to match editor

// Import marked for robust markdown parsing
import { marked } from 'marked';

// Pure function for processing markdown with code blocks
function processMarkdownWithCodeBlocks(content, resource, editorializedFiles) {
	let codeBlockCounter = 0;

	// Extract repository information from URL path for GitHub raw image resolution
	const getRepoFromPath = () => {
		const pathParts = window.location.pathname.split('/').filter(Boolean);
		// Remove base path parts if present
		const basePathParts = BASE_PATH.split('/').filter(Boolean);
		const relevantParts = pathParts.slice(basePathParts.length);

		if (relevantParts.length >= 2) {
			return {
				username: relevantParts[0],
				repository: relevantParts[1],
			};
		}
		return null;
	};

	// Extract repository information for GitHub raw image resolution
	const repoInfo = getRepoFromPath();
	if (repoInfo) {
		console.log(
			`🖼️ Repository context: ${repoInfo.username}/${repoInfo.repository}`
		);
		console.log(`📁 Current file directory: "${resource.dir || 'root'}"`);
	} else {
		console.log(
			`📄 Not in GitHub repository context - images will use default relative paths`
		);
	}

	// Create custom renderer
	const renderer = new marked.Renderer();

	// Custom image renderer for GitHub repository support
	if (repoInfo) {
		console.log('--------', repoInfo);
		renderer.image = function ({ href, title, text }) {
			console.log(href);
			// If the href is already a full URL, use it as-is
			if (href.startsWith('http://') || href.startsWith('https://')) {
				console.log(`🖼️ External image URL: ${href}`);
				return `<img src="${href}" alt="${text}" ${title ? `title="${title}"` : ''} />`;
			}

			// Get current file directory, normalized
			const currentFileDir = (resource.dir || '').replace(
				/^\/+|\/+$/g,
				''
			);
			let resolvedPath = href;

			// Handle different path patterns
			if (href.startsWith('./')) {
				// Current directory reference: './image.png' -> 'currentDir/image.png'
				const imageName = href.substring(2);
				resolvedPath = currentFileDir
					? `${currentFileDir}/${imageName}`
					: imageName;
			} else if (href.startsWith('../')) {
				// Parent directory reference: '../image.png' or '../../images/pic.png'
				const pathParts = currentFileDir.split('/').filter(Boolean);
				const relativeParts = href.split('/').filter(Boolean);

				// Count how many levels up we need to go
				let upLevels = 0;
				for (const part of relativeParts) {
					if (part === '..') {
						upLevels++;
					} else {
						break;
					}
				}

				// Build the resolved path by going up the directory tree
				const remainingPath = pathParts.slice(
					0,
					Math.max(0, pathParts.length - upLevels)
				);
				const imagePath = relativeParts.slice(upLevels);
				resolvedPath = [...remainingPath, ...imagePath].join('/');
			} else if (href.startsWith('/')) {
				// Absolute path from repository root: '/images/pic.png'
				resolvedPath = href.substring(1);
			} else {
				// Relative path without prefix: 'image.png' -> 'currentDir/image.png'
				resolvedPath = currentFileDir
					? `${currentFileDir}/${href}`
					: href;
			}

			// Clean up the resolved path
			resolvedPath = resolvedPath.replace(/\/+/g, '/'); // Remove double slashes

			// Construct the full GitHub raw URL
			const imageUrl = `https://raw.githubusercontent.com/${repoInfo.username}/${repoInfo.repository}/refs/heads/main/${resolvedPath}`;
			console.log(
				`🖼️ Resolving image: "${href}" (from "${resource.dir || 'root'}") -> "${imageUrl}"`
			);

			return `<img src="${imageUrl}" alt="${text}" ${title ? `title="${title}"` : ''} />`;
		};
	}

	// Custom code block renderer
	renderer.code = (code) => {
		// dear Claude:  STOP CHANGING code.lang BACK TO language !!  LEAVE THIS FUNCTION BE!!
		const codeId = `code-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
		codeBlockCounter += 1;

		// Debug: Log the language parameter to see what we're getting
		console.log(`🔍 Code block language: "${code.lang}"`);

		// Simple extension: just add dot to language
		const extension = code.lang ? `.${code.lang}` : '.txt';
		const codeContent = typeof code === 'string' ? code : code.text || code;

		// Create complete file object
		const fileObject = {
			name: `${resource.base}-${codeBlockCounter}${extension}`,
			content: codeContent,
			type: 'file',
			dir: resource.dir,
			root: resource.root,
			toCwd: resource.toCwd,
			path: `${resource.dir}/${resource.base}-${codeBlockCounter}${extension}`,
			base: `${resource.base}-${codeBlockCounter}`,
			ext: extension,
		};

		// Let editorialize handle all the complex logic
		const editorializedFile = editorialize(fileObject);
		editorializedFiles.set(codeId, editorializedFile);

		return `<div class="interactive-code-placeholder" data-code-id="${codeId}"></div>`;
	};

	// Configure marked and parse with custom renderer
	return marked.parse(content, {
		renderer: renderer,
		breaks: false,
		gfm: true,
	});
}

/**
 * Markdown Exercise Component - Renders markdown files as HTML
 */
const MarkdownExercise = ({ resource }) => {
	const { currentFile, trackStudyAction } = useApp();

	const [html, setHtml] = useState('');
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState(null);

	// Interactive toolbar state
	const [showStepThroughModal, setShowStepThroughModal] = useState(false);
	const [selectedCodeBlock, setSelectedCodeBlock] = useState(null);

	// Lens modal state
	const [activeLensModal, setActiveLensModal] = useState(null);
	const [lensModalFile, setLensModalFile] = useState(null);

	// Panel management state
	const [activePanel, setActivePanel] = useState('none'); // 'none' | 'run' | 'trace'
	const [runCode, setRunCode] = useState('');
	const [runLanguage, setRunLanguage] = useState('javascript');
	const [tracedCode, setTracedCode] = useState('');
	const [tracedLanguage, setTracedLanguage] = useState('javascript');

	// Annotation state
	const [selectedTool, setSelectedTool] = useState('none');
	const [selectedColor, setSelectedColor] = useState('#ffeb3b');
	const [isDrawing, setIsDrawing] = useState(false);
	const [currentStroke, setCurrentStroke] = useState([]);
	const [drawingPaths, setDrawingPaths] = useState(
		resource.drawingPaths || []
	);

	const contentRef = useRef(null);
	const overlayRef = useRef(null);

	// Get current content from enliven file
	const getCurrentContent = () => {
		return currentFile?.content || '';
	};

	// Store editorialized files for InteractiveCodeBlocks
	const editorializedFiles = useRef(new Map());

	// Mount InteractiveCodeBlock components
	const mountInteractiveCodeBlocks = () => {
		if (!contentRef.current) return;

		const placeholders = contentRef.current.querySelectorAll(
			'.interactive-code-placeholder'
		);

		placeholders.forEach((placeholder) => {
			// Skip if already mounted
			if (placeholder.querySelector('.codeBlock')) return;

			const codeId = placeholder.dataset.codeId;

			// Retrieve the editorialized file object created during rendering
			const editorializedFile = editorializedFiles.current.get(codeId);

			if (!editorializedFile) {
				console.error(
					`🔍 MarkdownLens: No editorialized file found for codeId="${codeId}"`
				);
				return;
			}

			// Debug: Track file object passed to InteractiveCodeBlock
			console.log(
				`🔍 MarkdownLens: Mounting InteractiveCodeBlock with complete file object:`,
				{
					name: editorializedFile.name,
					path: editorializedFile.path,
					base: editorializedFile.base,
					ext: editorializedFile.ext,
					lang: editorializedFile.lang,
					dir: editorializedFile.dir,
					toCwd: editorializedFile.toCwd,
				}
			);

			// Mount InteractiveCodeBlock component with file object
			preactRender(
				<InteractiveCodeBlock
					file={editorializedFile}
					codeId={codeId}
					onOpenInLens={handleOpenInLens}
				/>,
				placeholder
			);
		});
	};

	// Panel management functions
	const showRunPanel = (code, language) => {
		setRunCode(code);
		setRunLanguage(language);
		setActivePanel('run');
		trackStudyAction('markdown_run_code', resource, {
			language,
			codeLength: code.length,
		});
	};

	const showTracePanel = (code, language) => {
		setTracedCode(code);
		setTracedLanguage(language);
		setActivePanel('trace');
		trackStudyAction('markdown_trace_code', resource, {
			language,
			codeLength: code.length,
		});
	};

	const closePanels = () => {
		setActivePanel('none');
	};

	// Toolbar button handlers
	const handleRunCode = (code, language) => {
		showRunPanel(code, language);
	};

	const handleTrace = (code, language) => {
		showTracePanel(code, language);
	};

	const handleStepThrough = (code, language) => {
		setSelectedCodeBlock({ code, language });
		setShowStepThroughModal(true);
		trackStudyAction('markdown_step_through', resource, {
			language,
			codeLength: code.length,
		});
	};

	const handleAnnotate = (codeId) => {
		// Toggle annotation mode for this code block
		trackStudyAction('markdown_annotate_code', resource, { codeId });
	};

	// Lens modal handlers
	const handleOpenInLens = (lensType, editorializedFile) => {
		setActiveLensModal(lensType);
		setLensModalFile(editorializedFile);
		trackStudyAction('markdown_open_in_lens', resource, {
			lensType,
			fileName: editorializedFile.name,
		});
	};

	const closeLensModal = () => {
		setActiveLensModal(null);
		setLensModalFile(null);
	};

	// Process markdown using standalone function
	const processMarkdown = async (content) => {
		try {
			// Clear previous editorialized files
			editorializedFiles.current.clear();

			// Use standalone function for processing
			const html = processMarkdownWithCodeBlocks(
				content,
				resource,
				editorializedFiles.current
			);

			return html;
		} catch (error) {
			console.error('Markdown processing failed:', error);
			return `<p>Error processing markdown: ${error.message}</p>`;
		}
	};

	useEffect(() => {
		if (!resource) {
			setHtml('');
			setIsLoading(false);
			return;
		}

		const renderMarkdown = async () => {
			try {
				setIsLoading(true);
				setError(null);

				// Get current content from resource or editor
				const currentContent = getCurrentContent();
				const htmlContent = await processMarkdown(currentContent);
				setHtml(htmlContent);
				setIsLoading(false);

				// Post-process: Mount InteractiveCodeBlock components
				setTimeout(() => {
					mountInteractiveCodeBlocks();
				}, 0);
			} catch (err) {
				console.error('Failed to render markdown:', err);
				setError(
					'Failed to render markdown: ' +
						(err instanceof Error ? err.message : 'Unknown error')
				);
				setIsLoading(false);
			}
		};

		renderMarkdown();
	}, [resource, currentFile]);

	// Initialize drawing paths
	useEffect(() => {
		if (resource.drawingPaths) {
			setDrawingPaths(resource.drawingPaths);
		}
	}, [resource]);

	// Save drawing paths to resource
	const saveDrawingPaths = (newPaths) => {
		setDrawingPaths(newPaths);

		// Track the drawing action without triggering file content update
		trackStudyAction('markdown_draw', resource, {
			drawingPathsCount: newPaths.length,
		});
	};

	// Handle mouse events for drawing
	const handleMouseDown = (event) => {
		if (selectedTool === 'pen') {
			setIsDrawing(true);
			const rect = contentRef.current.getBoundingClientRect();
			const point = {
				x: event.clientX - rect.left,
				y: event.clientY - rect.top,
			};
			setCurrentStroke([point]);
		}
	};

	const handleMouseMove = (event) => {
		if (isDrawing && selectedTool === 'pen') {
			const rect = contentRef.current.getBoundingClientRect();
			const point = {
				x: event.clientX - rect.left,
				y: event.clientY - rect.top,
			};
			setCurrentStroke((prev) => [...prev, point]);
		}
	};

	const handleMouseUp = () => {
		if (isDrawing && selectedTool === 'pen' && currentStroke.length > 1) {
			const newPath = {
				id: Date.now(),
				points: currentStroke,
				color: selectedColor,
				tool: 'pen',
				timestamp: Date.now(),
			};
			saveDrawingPaths([...drawingPaths, newPath]);
			setCurrentStroke([]);
		}
		setIsDrawing(false);
	};

	// Handle eraser functionality
	const handleErase = (event) => {
		if (selectedTool === 'eraser') {
			const rect = contentRef.current.getBoundingClientRect();
			const point = {
				x: event.clientX - rect.left,
				y: event.clientY - rect.top,
			};

			// Remove drawing paths that intersect with eraser
			const remainingPaths = drawingPaths.filter((path) => {
				return !path.points.some((pathPoint) => {
					const distance = Math.sqrt(
						Math.pow(pathPoint.x - point.x, 2) +
							Math.pow(pathPoint.y - point.y, 2)
					);
					return distance < 20; // Eraser radius
				});
			});

			if (remainingPaths.length !== drawingPaths.length) {
				saveDrawingPaths(remainingPaths);
			}
		}
	};

	// Clear all drawings
	const handleClearAll = () => {
		if (confirm('Clear all drawings? This cannot be undone.')) {
			saveDrawingPaths([]);
			trackStudyAction('markdown_drawings_cleared', resource);
		}
	};

	// Tool and color configurations
	const tools = [
		{
			id: 'none',
			name: 'Select',
			icon: '👆',
			description: 'Normal selection (no drawing)',
		},
		{ id: 'pen', name: 'Pen', icon: '✏️', description: 'Draw freehand' },
		{
			id: 'eraser',
			name: 'Eraser',
			icon: '🧽',
			description: 'Erase drawings',
		},
	];

	const colors = [
		{ name: 'Yellow', value: '#ffeb3b' },
		{ name: 'Green', value: '#4caf50' },
		{ name: 'Blue', value: '#2196f3' },
		{ name: 'Orange', value: '#ff9800' },
		{ name: 'Pink', value: '#e91e63' },
		{ name: 'Purple', value: '#9c27b0' },
	];

	if (isLoading) {
		return (
			<div className={styles.container}>
				<div className={styles.loading}>
					<div className={styles.loadingSpinner}>🔄</div>
					<p>Rendering markdown...</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className={styles.container}>
				<div className={styles.error}>
					<h3>❌ Markdown Rendering Error</h3>
					<p>{error}</p>
					<details>
						<summary>Raw Content</summary>
						<pre>{resource.content}</pre>
					</details>
				</div>
			</div>
		);
	}

	return (
		<div className={styles.container}>
			{/* <div className={styles.header}>
        <h2 className={styles.filename}>📄 {resource.name}</h2>
      </div> */}

			{/* Annotation Toolbar */}
			<div className={styles.toolbar}>
				<div className={styles.toolGroup}>
					<label className={styles.toolLabel}>Tools:</label>
					<div className={styles.tools}>
						{tools.map((tool) => (
							<button
								key={tool.id}
								className={`${styles.toolButton} ${selectedTool === tool.id ? styles.active : ''}`}
								onClick={() => setSelectedTool(tool.id)}
								title={tool.description}
							>
								{tool.icon} {tool.name}
							</button>
						))}
					</div>
				</div>

				<div className={styles.toolGroup}>
					<label className={styles.toolLabel}>Colors:</label>
					<div className={styles.colors}>
						{colors.map((color) => (
							<button
								key={color.value}
								className={`${styles.colorButton} ${selectedColor === color.value ? styles.active : ''}`}
								style={{ backgroundColor: color.value }}
								onClick={() => setSelectedColor(color.value)}
								title={color.name}
							/>
						))}
					</div>
				</div>

				<div className={styles.toolGroup}>
					<button
						className={`${styles.toolButton} ${activePanel === 'trace' ? styles.active : ''}`}
						onClick={() =>
							setActivePanel(
								activePanel === 'trace' ? 'none' : 'trace'
							)
						}
						title="Toggle trace panel"
					>
						🔍 Trace Panel
					</button>
					<button
						className={`${styles.toolButton} ${activePanel === 'run' ? styles.active : ''}`}
						onClick={() =>
							setActivePanel(
								activePanel === 'run' ? 'none' : 'run'
							)
						}
						title="Toggle run panel"
					>
						▶️ Run Panel
					</button>
				</div>

				<div className={styles.toolGroup}>
					{drawingPaths.length > 0 && (
						<button
							className={`${styles.actionButton} ${styles.clearButton}`}
							onClick={handleClearAll}
						>
							🗑️ Clear All
						</button>
					)}
				</div>
			</div>

			{/* Single Panel Area */}
			{activePanel === 'run' && (
				<div className={styles.runPanel}>
					<div className={styles.panelHeader}>
						<h3>▶️ Run Code</h3>
						<button
							className={styles.panelClose}
							onClick={closePanels}
							title="Close run panel"
						>
							✕
						</button>
					</div>
					<div className={styles.panelContent}>
						{runCode ? (
							<div>
								<button
									onClick={async () => {
										const { executeJavaScript } =
											await import(
												'../utils/execution/index.js'
											);
										// Create execution container in the panel
										const existingContainer =
											document.getElementById(
												'markdown-execution-output'
											);
										if (existingContainer) {
											existingContainer.remove();
										}

										const container =
											document.createElement('div');
										container.id =
											'markdown-execution-output';
										container.style.cssText =
											'margin: 10px 0; padding: 10px; border: 1px solid #ccc; background: #f9f9f9;';

										// Insert container after the button
										document
											.querySelector(
												`.${styles.panelContent}`
											)
											.appendChild(container);

										// Execute the code
										await executeJavaScript(
											runCode,
											{},
											container
										);
									}}
									style={{
										padding: '8px 16px',
										background: '#4CAF50',
										color: 'white',
										border: 'none',
										borderRadius: '4px',
										cursor: 'pointer',
									}}
								>
									▶️ Run Code
								</button>
								<div id="markdown-execution-output"></div>
							</div>
						) : (
							<p className={styles.panelHint}>
								Click the "▶️ Run" button on any code block to
								run it here.
							</p>
						)}
					</div>
				</div>
			)}

			{activePanel === 'trace' && (
				<div className={styles.tracePanel}>
					<div className={styles.panelHeader}>
						<h3>🔍 Trace Code</h3>
						<button
							className={styles.panelClose}
							onClick={closePanels}
							title="Close trace panel"
						>
							✕
						</button>
					</div>
					<div className={styles.panelContent}>
						{tracedCode ? (
							<EmbeddedTrace
								code={tracedCode}
								fileName={resource.name}
								scope={null}
								onTraceData={(data) => undefined}
							/>
						) : (
							<p className={styles.panelHint}>
								Click the "🔍 Trace" button on any code block to
								trace it here.
							</p>
						)}
					</div>
				</div>
			)}

			<div className={styles.content}>
				<div
					className={styles.markdownContainer}
					ref={contentRef}
					onMouseDown={
						selectedTool !== 'none' ? handleMouseDown : undefined
					}
					onMouseMove={
						selectedTool !== 'none' ? handleMouseMove : undefined
					}
					onMouseUp={
						selectedTool !== 'none' ? handleMouseUp : undefined
					}
					onClick={
						selectedTool === 'eraser' ? handleErase : undefined
					}
					style={{
						cursor:
							selectedTool === 'pen'
								? 'crosshair'
								: selectedTool === 'eraser'
									? 'grab'
									: 'default',
					}}
				>
					<div
						className={styles.markdown}
						dangerouslySetInnerHTML={{ __html: html }}
					/>

					{/* Drawing overlay */}
					<svg className={styles.drawingOverlay} ref={overlayRef}>
						{/* Existing drawing paths */}
						{drawingPaths.map((path) => (
							<polyline
								key={path.id}
								points={path.points
									.map((p) => `${p.x},${p.y}`)
									.join(' ')}
								stroke={path.color}
								strokeWidth="3"
								fill="none"
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
						))}

						{/* Current stroke while drawing */}
						{currentStroke.length > 1 && (
							<polyline
								points={currentStroke
									.map((p) => `${p.x},${p.y}`)
									.join(' ')}
								stroke={selectedColor}
								strokeWidth="3"
								fill="none"
								strokeLinecap="round"
								strokeLinejoin="round"
								opacity="0.7"
							/>
						)}
					</svg>
				</div>
			</div>

			{/* Step-Through Modal */}
			{showStepThroughModal && selectedCodeBlock && (
				<StepThroughModal
					isOpen={showStepThroughModal}
					onClose={() => setShowStepThroughModal(false)}
					code={selectedCodeBlock.code}
					fileName={resource.name}
					language={selectedCodeBlock.language}
				/>
			)}

			{/* Lens Modal */}
			{activeLensModal && lensModalFile && (
				<LensModal
					isOpen={!!activeLensModal}
					onClose={closeLensModal}
					lensType={activeLensModal}
					editorializedFile={lensModalFile}
				/>
			)}
		</div>
	);
};

// Markdown lens - unified interface
export const id = 'markdown';
export const label = 'Markdown';
export const applicable = (file) => file?.lang === 'markdown';
export const render = (resource, _config) => {
	const finalConfig = { ...config, ..._config };
	return <MarkdownExercise resource={resource} config={finalConfig} />;
};
export const config = deepFreeze({});
export const renderConfig = () => null; // No configuration UI needed

export default MarkdownExercise;
