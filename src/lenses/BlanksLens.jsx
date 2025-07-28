import { useState, useEffect, useCallback, useRef } from 'preact/hooks';
import { blankenate } from '../../public/static/blanks/blankenate.js';
import { EditorView } from '@codemirror/view';
import { basicSetup } from 'codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import { useColorize } from '../context/ColorizeContext.jsx';
import { useApp } from '../context/AppContext.jsx';
import URLManager from '../utils/urlManager.js';
import { askOpenEnded } from '../../public/static/ask/component/ask-questions.js';
import { deepFreeze } from '../utils/deepFreeze.js';
import styles from './BlanksLens.module.css';
import { BASE_PATH } from '../CONSTANTS.js';

/**
 * BlanksLens - Fill-in-the-blank programming exercises
 * Following SL1 patterns with CodeMirror integration
 * Step 1: Control panel UI with no logic
 */
const BlanksLens = ({ resource }) => {
	const fileName = resource?.name || '';
	const { enableColorize } = useColorize();
	const { currentFile } = useApp();

	// Get current content from enliven file
	const code = currentFile?.content || '';

	// Control panel state (no logic yet - just UI)
	const [difficulty, setDifficulty] = useState(50); // 0-100%
	const [contentTypes, setContentTypes] = useState({
		keywords: true,
		identifiers: true,
		operators: true, // Enable operators by default for testing
		primitives: true, // Enable primitives by default for testing
	});
	const [viewMode, setViewMode] = useState('blankenated'); // 'complete' or 'blankenated'
	const [showHints, setShowHints] = useState(false);
	const [hintsLevel, setHintsLevel] = useState('auto'); // 'auto', 'easy', 'medium', 'hard'
	const [hintsExpanded, setHintsExpanded] = useState(true);
	const [instructionsExpanded, setInstructionsExpanded] = useState(false);

	// Editor state
	const [currentCode, setCurrentCode] = useState(code);
	const [blankenatedTemplate, setBlankenatedTemplate] = useState(''); // Original blankenated code
	const [learnerCode, setLearnerCode] = useState(''); // Learner's edits to blankenated code
	const [scriptLoaded, setScriptLoaded] = useState(false);

	// Exercise evaluation state
	const [blanks, setBlanks] = useState([]); // Array of blank objects with expected answers
	const [correctnessMap, setCorrectnessMap] = useState({}); // Maps blank positions to correctness
	const [overallScore, setOverallScore] = useState(0); // Percentage score 0-100

	// Helper to build blanks configuration string from state
	const buildBlanksConfig = useCallback(() => {
		const params = [];
		params.push(`difficulty:${difficulty}`);

		const enabledTypes = Object.entries(contentTypes)
			.filter(([_, enabled]) => enabled)
			.map(([type, _]) => type);
		if (enabledTypes.length > 0) {
			params.push(`types:${enabledTypes.join('+')}`);
		}

		if (viewMode !== 'complete') {
			params.push(`view:${viewMode}`);
		}

		if (hintsLevel !== 'auto' && showHints) {
			params.push(`hints:${hintsLevel}`);
		}

		return params.join(',');
	}, [difficulty, contentTypes, viewMode, hintsLevel, showHints]);

	// URL-based configuration
	useEffect(() => {
		const blanksConfig = URLManager.getLensConfig('blanks');

		// Apply lens configuration if present
		if (blanksConfig) {
			try {
				// Parse blanks parameters (format: difficulty:50,types:keywords+identifiers,view:blankenated)
				const params = new URLSearchParams(
					blanksConfig.replace(/[+]/g, '&').replace(/:/g, '=')
				);

				// Set difficulty
				const difficultyParam = params.get('difficulty');
				if (difficultyParam) {
					const difficultyValue = parseInt(difficultyParam);
					if (
						!isNaN(difficultyValue) &&
						difficultyValue >= 0 &&
						difficultyValue <= 100
					) {
						setDifficulty(difficultyValue);
					}
				}

				// Set content types
				const typesParam = params.get('types');
				if (typesParam) {
					const types = typesParam.split('+');
					const newContentTypes = {
						keywords: types.includes('keywords'),
						identifiers: types.includes('identifiers'),
						operators: types.includes('operators'),
						primitives: types.includes('primitives'),
					};
					setContentTypes(newContentTypes);
				}

				// Set view mode
				const viewParam = params.get('view');
				if (
					viewParam &&
					(viewParam === 'complete' || viewParam === 'blankenated')
				) {
					setViewMode(viewParam);
				}

				// Set hints level
				const hintsParam = params.get('hints');
				if (
					hintsParam &&
					['auto', 'easy', 'medium', 'hard'].includes(hintsParam)
				) {
					setHintsLevel(hintsParam);
					setShowHints(true); // Auto-show hints if specified in URL
				}
			} catch (error) {
				console.warn('Failed to parse blanks parameters:', error);
			}
		}
	}, []); // Only run on component mount

	// Listen for hash changes to update configuration
	useEffect(() => {
		const handleHashChange = () => {
			const blanksConfig = URLManager.getLensConfig('blanks');

			// Apply lens configuration if present
			if (blanksConfig) {
				try {
					// Parse blanks parameters (format: difficulty:50,types:keywords+identifiers,view:blankenated)
					const params = new URLSearchParams(
						blanksConfig.replace(/[+]/g, '&').replace(/:/g, '=')
					);

					// Set difficulty
					const difficultyParam = params.get('difficulty');
					if (difficultyParam) {
						const difficultyValue = parseInt(difficultyParam);
						if (
							!isNaN(difficultyValue) &&
							difficultyValue >= 0 &&
							difficultyValue <= 100
						) {
							setDifficulty(difficultyValue);
						}
					}

					// Set content types
					const typesParam = params.get('types');
					if (typesParam) {
						const types = typesParam.split('+');
						const newContentTypes = {
							keywords: types.includes('keywords'),
							identifiers: types.includes('identifiers'),
							operators: types.includes('operators'),
							primitives: types.includes('primitives'),
						};
						setContentTypes(newContentTypes);
					}

					// Set view mode
					const viewParam = params.get('view');
					if (
						viewParam &&
						(viewParam === 'complete' ||
							viewParam === 'blankenated')
					) {
						setViewMode(viewParam);
					}

					// Set hints level
					const hintsParam = params.get('hints');
					if (
						hintsParam &&
						['auto', 'easy', 'medium', 'hard'].includes(hintsParam)
					) {
						setHintsLevel(hintsParam);
						setShowHints(true);
					}
				} catch (error) {
					console.warn(
						'Failed to parse blanks parameters from hash change:',
						error
					);
				}
			}
		};

		window.addEventListener('hashchange', handleHashChange);
		return () => window.removeEventListener('hashchange', handleHashChange);
	}, []);

	// Update URL when settings change (using URLManager)
	const updateURL = useCallback(() => {
		const blanksConfig = buildBlanksConfig();
		const currentFilePath =
			resource?.path || URLManager.getCurrentFilePath();

		// Use URLManager to update just the blanks configuration
		URLManager.updateLensConfig('blanks', blanksConfig);
	}, [buildBlanksConfig, resource?.path]);

	// Update URL when settings change (debounced)
	useEffect(() => {
		const timeoutId = setTimeout(updateURL, 500); // Debounce for 500ms
		return () => clearTimeout(timeoutId);
	}, [updateURL]);

	// Load SL1 blankenate script
	useEffect(() => {
		const loadBlankenateScript = async () => {
			if (!blankenate) {
				try {
					await new Promise((resolve, reject) => {
						const script = document.createElement('script');
						script.src = `${BASE_PATH}/static/blanks/blankenate.js`;
						script.onload = () => {
							setScriptLoaded(true);
							resolve();
						};
						script.onerror = (error) => {
							console.error(
								'Failed to load SL1 blankenate script:',
								error
							);
							setScriptLoaded(false);
							reject(error);
						};
						document.head.appendChild(script);
					});
				} catch (error) {
					console.error('Error loading blankenate script:', error);
					setScriptLoaded(false);
				}
			} else {
				setScriptLoaded(true);
			}
		};

		loadBlankenateScript();
	}, []);

	// CodeMirror setup
	const language = resource?.lang?.replace('.', '') || 'plaintext';

	// Simple CodeMirror setup for disposable practice
	const editorContainer = useRef();
	const editorView = useRef();

	const getValue = useCallback(() => {
		return editorView.current?.state.doc.toString() || '';
	}, []);

	const setValue = useCallback((content) => {
		if (editorView.current) {
			editorView.current.dispatch({
				changes: {
					from: 0,
					to: editorView.current.state.doc.length,
					insert: content,
				},
			});
		}
	}, []);

	// Initialize CodeMirror editor
	useEffect(() => {
		if (editorContainer.current && !editorView.current) {
			const onChange = EditorView.updateListener.of((update) => {
				if (update.docChanged && viewMode === 'blankenated') {
					const content = update.state.doc.toString();
					setCurrentCode(content);
					setLearnerCode(content);
				}
			});

			editorView.current = new EditorView({
				doc: currentCode,
				parent: editorContainer.current,
				extensions: [
					basicSetup,
					javascript(),
					oneDark,
					onChange,
					EditorView.editable.of(viewMode !== 'complete'),
				],
			});
		}
	}, []);

	// Update editor readonly state when viewMode changes
	useEffect(() => {
		if (editorView.current) {
			// Recreate editor with new editable state - this is the safest approach
			const currentParent = editorView.current.dom.parentNode;
			const currentContent = getValue();
			editorView.current.destroy();

			const onChange = EditorView.updateListener.of((update) => {
				if (update.docChanged && viewMode === 'blankenated') {
					const content = update.state.doc.toString();
					setCurrentCode(content);
					setLearnerCode(content);
				}
			});

			editorView.current = new EditorView({
				doc: currentContent || currentCode,
				parent: currentParent,
				extensions: [
					basicSetup,
					javascript(),
					oneDark,
					onChange,
					EditorView.editable.of(viewMode !== 'complete'),
				],
			});
		}
	}, [viewMode]);

	// Generate blankenated code when settings change
	const generateBlankenatedCode = useCallback(() => {
		if (!scriptLoaded || !blankenate || !code.trim()) {
			return code;
		}

		try {
			// Convert difficulty percentage to probability (0-100% -> 0.0-1.0)
			const probability = difficulty / 100;

			// Create config object based on selected content types
			// Note: SL1 blankenate expects this exact format
			const config = {
				keywords: contentTypes.keywords,
				identifiers: contentTypes.identifiers,
				operators: contentTypes.operators,
				literals: contentTypes.primitives,
			};

			// Call SL1 blankenate function
			const result = blankenate(code, probability, config);

			if (result && result.blankedCode) {
				// Save blanks for evaluation
				if (result.blanks) {
					setBlanks(result.blanks);
				}

				return result.blankedCode;
			} else {
				// console.warn('Blankenate returned invalid result:', result);
				return code; // Fallback to original
			}
		} catch (error) {
			console.error('Error during blankenation:', error);
			return code; // Fallback to original
		}
	}, [code, difficulty, contentTypes, scriptLoaded]);

	// Update blankenated template when settings change (NOT when toggling modes)
	useEffect(() => {
		if (scriptLoaded) {
			const newBlankenatedCode = generateBlankenatedCode();
			setBlankenatedTemplate(newBlankenatedCode);
			setLearnerCode(newBlankenatedCode); // Reset learner code to new template

			// If we're currently viewing blankenated mode, update the editor
			if (viewMode === 'blankenated') {
				setCurrentCode(newBlankenatedCode);
			}
		}
	}, [generateBlankenatedCode, scriptLoaded]); // Removed viewMode dependency

	// Exercise evaluation function
	const evaluateExercise = useCallback((learnerText, blanksArray) => {
		if (!learnerText || !blanksArray || blanksArray.length === 0) {
			return { correctnessMap: {}, score: 0 };
		}

		const newCorrectnessMap = {};
		let totalBlanks = blanksArray.length;
		let correctBlanks = 0;

		// For each blank, check if the learner's input matches the expected answer
		blanksArray.forEach((blank, index) => {
			const blankId = blank.id || `blank_${index}`;

			// Find what the learner wrote in place of this blank
			// We need to find the position of this blank in the current learner code
			const blankPattern = '__'; // The placeholder we use
			let blankPositions = [];
			let searchStart = 0;

			// Find all __ positions in learner text
			while (true) {
				const pos = learnerText.indexOf(blankPattern, searchStart);
				if (pos === -1) break;
				blankPositions.push(pos);
				searchStart = pos + blankPattern.length;
			}

			// If this blank still has __, it's unfilled
			if (index < blankPositions.length) {
				newCorrectnessMap[blankId] = 'unfilled';
			} else {
				// Try to extract what the learner wrote
				// This is complex since positions shift when blanks are filled
				// For now, do a simple text-based check
				const expectedAnswer = blank.original;

				// Simple heuristic: if the expected answer appears in the learner code
				// in roughly the right position, consider it correct
				if (learnerText.includes(expectedAnswer)) {
					newCorrectnessMap[blankId] = 'correct';
					correctBlanks++;
				} else {
					// Look for partial matches or common mistakes
					newCorrectnessMap[blankId] = 'incorrect';
				}
			}
		});

		const score =
			totalBlanks > 0
				? Math.round((correctBlanks / totalBlanks) * 100)
				: 0;

		return { correctnessMap: newCorrectnessMap, score };
	}, []);

	// Evaluate exercise when learner code changes
	useEffect(() => {
		if (viewMode === 'blankenated' && learnerCode && blanks.length > 0) {
			const { correctnessMap: newCorrectnessMap, score } =
				evaluateExercise(learnerCode, blanks);
			setCorrectnessMap(newCorrectnessMap);
			setOverallScore(score);
		} else {
			setCorrectnessMap({});
			setOverallScore(0);
		}
	}, [learnerCode, blanks, viewMode, evaluateExercise]);

	// Update editor content when currentCode changes (but not when viewMode changes)
	useEffect(() => {
		if (editorView.current && setValue && currentCode !== getValue()) {
			setValue(currentCode);
		}
	}, [currentCode, setValue, getValue]);

	// Handle difficulty slider change
	const handleDifficultyChange = (e) => {
		const newDifficulty = parseInt(e.target.value);
		setDifficulty(newDifficulty);
	};

	// Handle content type checkbox changes
	const handleContentTypeChange = (type) => {
		const newContentTypes = {
			...contentTypes,
			[type]: !contentTypes[type],
		};
		setContentTypes(newContentTypes);
	};

	// Handle view mode toggle
	const handleViewModeChange = (mode) => {
		setViewMode(mode);

		// Update editor content based on mode
		if (mode === 'complete') {
			setCurrentCode(code); // Show original code
		} else {
			// Show learner's current work (or template if no edits yet)
			const codeToShow = learnerCode || blankenatedTemplate || code;
			setCurrentCode(codeToShow);
		}
	};

	// Handle hints toggle
	const handleHintsToggle = () => {
		setShowHints(!showHints);
	};

	return (
		<div className={styles.blanksLens}>
			<div className={styles.header}>
				<h3>📝 Fill in the Blanks</h3>
				{fileName && (
					<span className={styles.fileName}>{fileName}</span>
				)}
				<button
					className={styles.askMeButton}
					onClick={async () => {
						try {
							// Use current code from enliven
							const codeToAnalyze = currentFile?.content || '';

							// Generate and log questions using SL1 library
							// window.askOpenEnded(codeToAnalyze);
							askOpenEnded(codeToAnalyze);
						} catch (error) {
							// console.log(
							//	'Fallback: Manual code analysis questions'
							// );
							// console.log('--- --- --- --- --- --- ---');
							// console.log(
							//	'Consider these questions about your code:'
							// );
							// console.log(
							//	'- What does this code do step by step?'
							// );
							// console.log(
							//	'- What are the main variables and their purposes?'
							// );
							// console.log(
							//	'- Are there any patterns or structures you recognize?'
							// );
							// console.log('--- --- --- --- --- --- ---');
						}
					}}
					title="Generate questions about this code (logged to console)"
				>
					🤔 Ask Me
				</button>
			</div>

			{/* Control Panel */}
			<div className={styles.controlPanel}>
				{/* Difficulty Slider */}
				<div className={styles.difficultySection}>
					{/* <label className={styles.difficultyLabel}>
            Difficulty: <span className={styles.difficultyValue}>{difficulty}%</span>
          </label> */}
					<input
						type="range"
						min="0"
						max="100"
						value={difficulty}
						onChange={handleDifficultyChange}
						className={styles.difficultySlider}
					/>
				</div>

				{/* Content Type Toggles */}
				<div className={styles.contentTypes}>
					<div className={styles.checkboxGrid}>
						<label className={styles.checkboxLabel}>
							<input
								type="checkbox"
								checked={contentTypes.keywords}
								onChange={() =>
									handleContentTypeChange('keywords')
								}
							/>
							<span>Keywords</span>
						</label>
						<label className={styles.checkboxLabel}>
							<input
								type="checkbox"
								checked={contentTypes.identifiers}
								onChange={() =>
									handleContentTypeChange('identifiers')
								}
							/>
							<span>Identifiers</span>
						</label>
						<label className={styles.checkboxLabel}>
							<input
								type="checkbox"
								checked={contentTypes.operators}
								onChange={() =>
									handleContentTypeChange('operators')
								}
							/>
							<span>Operators</span>
						</label>
						<label className={styles.checkboxLabel}>
							<input
								type="checkbox"
								checked={contentTypes.primitives}
								onChange={() =>
									handleContentTypeChange('primitives')
								}
							/>
							<span>Primitives</span>
						</label>
					</div>
				</div>

				{/* View Toggle */}
				<div className={styles.viewToggle}>
					<button
						className={`${styles.viewButton} ${viewMode === 'blankenated' ? styles.active : ''}`}
						onClick={() => handleViewModeChange('blankenated')}
					>
						📝 Blankenated Code
					</button>
					<button
						className={`${styles.viewButton} ${viewMode === 'complete' ? styles.active : ''}`}
						onClick={() => handleViewModeChange('complete')}
					>
						📖 Complete Code
					</button>
				</div>

				{/* Additional Controls */}
				{/* <div className={styles.additionalControls}>
          <button className={styles.hintsButton} onClick={handleHintsToggle}>
            💡 {showHints ? 'Hide' : 'Show'} Hints
          </button>
          {showHints && (
            <select
              value={hintsLevel}
              onChange={(e) => setHintsLevel(e.target.value)}
              className={styles.hintsLevelSelect}
            >
              <option value="auto">Auto (difficulty-based)</option>
              <option value="easy">Easy (full hints)</option>
              <option value="medium">Medium (score + colors)</option>
              <option value="hard">Hard (score only)</option>
            </select>
          )}
        </div> */}
			</div>

			{/* Code Editor */}
			<div className={styles.editorSection}>
				{/* <div className={styles.editorHeader}>
          <h4>
            {viewMode === 'complete'
              ? '📖 Complete Code (Read-only)'
              : '📝 Fill in the Blanks'}
          </h4>
          <div className={styles.editorStatus}>
            Mode: {viewMode} | Difficulty: {difficulty}% |
            {!scriptLoaded
              ? 'Loading blankenate...'
              : viewMode === 'blankenated' && blanks.length > 0
                ? `Score: ${overallScore}% | Blanks: ${blanks.length} | Remaining: ${((learnerCode || blankenatedTemplate).match(/__/g) || []).length}`
                : 'Ready'}
          </div>
        </div> */}
				<div className={styles.editorContainer}>
					<div
						ref={editorContainer}
						className={`${styles.codeEditor} ${viewMode === 'complete' ? styles.readonly : ''}`}
					/>
				</div>
			</div>

			{/* Hints Panel with Difficulty-Based Feedback */}
			{false && showHints && (
				<div className={styles.hintsPanel}>
					<div className={styles.hintsHeader}>
						<h4>💡 Hints & Feedback</h4>
						<button
							className={styles.collapseButton}
							onClick={() => setHintsExpanded(!hintsExpanded)}
						>
							{hintsExpanded ? '▼ Collapse' : '▶ Expand'}
						</button>
					</div>
					{hintsExpanded && (
						<div className={styles.hintsContent}>
							{!scriptLoaded ? (
								<p>⏳ Loading blankenation system...</p>
							) : viewMode === 'blankenated' &&
							  blanks.length > 0 ? (
								<>
									{/* <div className={styles.scoreSection}>
                    <p>
                      <strong>📊 Score: {overallScore}%</strong>
                    </p>
                    <div className={styles.progressBar}>
                      <div
                        className={styles.progressFill}
                        style={{ width: `${overallScore}%` }}
                      ></div>
                    </div>
                  </div> */}

									{/* Difficulty-based feedback */}
									{((hintsLevel === 'auto' &&
										difficulty >= 67) ||
										hintsLevel === 'easy') && ( // Easy mode - high difficulty = more blanks = more hints
										<div className={styles.easyModeHints}>
											<h5>🟢 Easy Mode - Full Hints</h5>
											<div
												className={
													styles.removedItemsList
												}
											>
												<p>
													<strong>
														Items removed from the
														code:
													</strong>
												</p>
												{blanks.length > 0 ? (
													blanks.map(
														(blank, index) => {
															const blankId =
																blank.id ||
																`blank_${index}`;
															const status =
																correctnessMap[
																	blankId
																] || 'unfilled';

															return (
																<div
																	key={
																		blankId
																	}
																	className={`${styles.hintItem} ${styles[status]}`}
																>
																	<span
																		className={
																			styles.blankNumber
																		}
																	>
																		#
																		{index +
																			1}
																	</span>
																	<span
																		className={
																			styles.blankType
																		}
																	>
																		{
																			blank.type
																		}
																	</span>
																	<span
																		className={
																			styles.blankHint
																		}
																	>
																		{status ===
																		'correct'
																			? '✅ Correct!'
																			: status ===
																				  'incorrect'
																				? `❌ Expected: "${blank.original}"`
																				: `💡 Missing: "${blank.original}" (${blank.type})`}
																	</span>
																</div>
															);
														}
													)
												) : (
													<p
														className={
															styles.noBlanksmessage
														}
													>
														No blanks generated yet.
														Adjust settings and
														switch to blankenated
														view.
													</p>
												)}
											</div>
										</div>
									)}

									{((hintsLevel === 'auto' &&
										difficulty >= 34 &&
										difficulty <= 66) ||
										hintsLevel === 'medium') && ( // Medium mode
										<div className={styles.mediumModeHints}>
											<h5>
												🟡 Medium Mode - Score & Colors
												Only
											</h5>
											<p>
												Fill in the blanks. Your score
												will update automatically.
											</p>
											<p>
												<strong>
													Blanks remaining:
												</strong>{' '}
												{
													(
														(
															learnerCode ||
															blankenatedTemplate
														).match(/__/g) || []
													).length
												}
											</p>
										</div>
									)}

									{((hintsLevel === 'auto' &&
										difficulty <= 33) ||
										hintsLevel === 'hard') && ( // Hard mode - low difficulty = fewer blanks = fewer hints
										<div className={styles.hardModeHints}>
											<h5>🔴 Hard Mode - Score Only</h5>
											<p>
												Challenge mode: Only your
												percentage score is shown.
											</p>
										</div>
									)}

									<div className={styles.exerciseInfo}>
										<p>
											<strong>Exercise Info:</strong>
										</p>
										<p>
											Types:{' '}
											{Object.entries(contentTypes)
												.filter(
													([_, enabled]) => enabled
												)
												.map(([type, _]) => type)
												.join(', ')}
										</p>
										<p>Total blanks: {blanks.length}</p>
									</div>
								</>
							) : (
								<>
									<p>
										Adjust settings and switch to
										"Blankenated Code" mode to see the
										exercise.
									</p>
									<p>
										Selected content types:{' '}
										{Object.entries(contentTypes)
											.filter(([_, enabled]) => enabled)
											.map(([type, _]) => type)
											.join(', ')}
									</p>
								</>
							)}
						</div>
					)}
				</div>
			)}

			{/* Instructions */}
			<div className={styles.instructions}>
				<h4
					className={styles.instructionsHeader}
					onClick={() =>
						setInstructionsExpanded(!instructionsExpanded)
					}
				>
					📚 How to Use {instructionsExpanded ? '▼' : '▶'}
				</h4>
				{instructionsExpanded && (
					<ul className={styles.instructionsList}>
						<li>
							<strong>Difficulty:</strong> Adjust slider to
							control how much code is blanked out
						</li>
						<li>
							<strong>Content Types:</strong> Choose which
							language features to blank (keywords, identifiers,
							etc.)
						</li>
						<li>
							<strong>View Toggle:</strong> Switch between
							complete code (read-only) and blankenated exercise
						</li>
						<li>
							<strong>Hints:</strong> Get help with understanding
							what goes in each blank
						</li>
					</ul>
				)}
			</div>
		</div>
	);
};

// Blanks lens - unified interface
export const id = 'blanks';
export const label = 'Blanks';
export const applicable = (file) => file.lang === 'javascript'; // Always applicable
export const render = (resource, _config) => {
	const finalConfig = { ...config, ..._config };
	return <BlanksLens resource={resource} config={finalConfig} />;
};
export const config = deepFreeze({});
export const renderConfig = () => null; // No configuration UI needed

export default BlanksLens;
