import { useState, useEffect, useRef, useCallback } from 'preact/hooks';
import { EditorView } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { basicSetup } from 'codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { deepFreeze } from '../utils/deepFreeze.js';
import { oneDark } from '@codemirror/theme-one-dark';
import { useColorize } from '../context/ColorizeContext.jsx';
import { useApp } from '../context/AppContext.jsx';
import URLManager from '../utils/urlManager.js';
import styles from './WritemeLens.module.css';

/**
 * Write Me Lens - Exercise where students write code from scratch
 * Features overlaid write/read modes for educational feedback
 * Following the principle: "DEEPER MORE CORRECT AND MORE ANALYTICAL"
 */
const WritemeLens = ({ resource }) => {
	const fileName = resource?.name || '';
	const { currentFile } = useApp();
	const { enableColorize } = useColorize();

	// Get current content from enliven file
	const originalCode = currentFile?.content || '';

	// Removed studentCode state - using getStudentValue() directly to prevent feedback loops
	const [mode, setMode] = useState('write'); // 'write' or 'read'
	const [feedback, setFeedback] = useState(null);
	const [hints, setHints] = useState([]);
	const [showHints, setShowHints] = useState(false);
	const [keepComments, setKeepComments] = useState(true);
	const [studentEditorInitialized, setStudentEditorInitialized] =
		useState(false);

	const [progress, setProgress] = useState(0);
	const [isComplete, setIsComplete] = useState(false);
	const [instructionsExpanded, setInstructionsExpanded] = useState(false);

	// Helper to build writeme configuration string from state
	const buildWritemeConfig = useCallback(() => {
		const params = [];
		if (!keepComments) params.push('nocomments:true');
		if (showHints) params.push('hints:true');
		return params.join(',') || 'active';
	}, [keepComments, showHints]);

	// URL-based configuration
	useEffect(() => {
		const writemeConfig = URLManager.getLensConfig('writeme');

		// Apply lens configuration if present
		if (writemeConfig && writemeConfig !== 'active') {
			try {
				const params = new URLSearchParams(
					writemeConfig.replace(/[+]/g, '&').replace(/:/g, '=')
				);

				const noComments = params.get('nocomments') === 'true';
				if (noComments !== undefined) {
					setKeepComments(!noComments);
				}

				const hints = params.get('hints') === 'true';
				if (hints !== undefined) {
					setShowHints(hints);
				}
			} catch (error) {
				console.warn('Failed to parse writeme parameters:', error);
			}
		}
	}, []);

	// Update URL when settings change
	useEffect(() => {
		const config = buildWritemeConfig();
		URLManager.updateLensConfig('writeme', config);
	}, [buildWritemeConfig]);

	// Simple CodeMirror setup for student editor (disposable practice)
	const studentEditorContainer = useRef();
	const studentEditorView = useRef();

	const getStudentValue = useCallback(() => {
		return studentEditorView.current?.state.doc.toString() || '';
	}, []);

	const setStudentValue = useCallback((content) => {
		if (studentEditorView.current) {
			studentEditorView.current.dispatch({
				changes: {
					from: 0,
					to: studentEditorView.current.state.doc.length,
					insert: content,
				},
			});
		}
	}, []);

	// Simple CodeMirror setup for solution editor (read-only)
	const solutionEditorContainer = useRef();
	const solutionEditorView = useRef();

	const getSolutionValue = useCallback(() => {
		return solutionEditorView.current?.state.doc.toString() || '';
	}, []);

	const setSolutionValue = useCallback((content) => {
		if (solutionEditorView.current) {
			solutionEditorView.current.dispatch({
				changes: {
					from: 0,
					to: solutionEditorView.current.state.doc.length,
					insert: content,
				},
			});
		}
	}, []);

	// Initialize both CodeMirror editors
	useEffect(() => {
		// Student editor (editable)
		if (studentEditorContainer.current && !studentEditorView.current) {
			studentEditorView.current = new EditorView({
				doc: '',
				parent: studentEditorContainer.current,
				extensions: [
					basicSetup,
					javascript(),
					oneDark,
					EditorView.editable.of(true),
				],
			});
		}

		// Solution editor (read-only)
		if (solutionEditorContainer.current && !solutionEditorView.current) {
			solutionEditorView.current = new EditorView({
				doc: '',
				parent: solutionEditorContainer.current,
				extensions: [
					basicSetup,
					javascript(),
					oneDark,
					EditorView.editable.of(false),
				],
			});
		}
	}, []);

	// Setup solution editor - ALWAYS show original code (mirrors student editor pattern)
	useEffect(() => {
		if (!originalCode || !setSolutionValue) {
			return;
		}

		// Use timing pattern that works for student editor
		const setupSolutionEditor = () => {
			try {
				setSolutionValue(originalCode);

				// Verify after setValue
				setTimeout(() => {
					const actualSolutionContent = getSolutionValue();

					if (actualSolutionContent !== originalCode) {
						// console.error('❌ SOLUTION EDITOR SETUP FAILED!');
						// console.error(
						//   'Expected length:',
						//   originalCode.length,
						//   'Actual length:',
						//   actualSolutionContent.length,
						// );

						// Retry once more
						setTimeout(() => {
							setSolutionValue(originalCode);
						}, 100);
					} else {
					}
				}, 100);
			} catch (error) {
				console.error('❌ Error setting up solution editor:', error);
			}
		};

		// Wait for CodeMirror to be ready (same timing as student editor)
		setTimeout(setupSolutionEditor, 50);
	}, [originalCode, setSolutionValue, getSolutionValue]);

	// Setup student editor - show template based on settings (ONLY on initialization)
	useEffect(() => {
		if (!originalCode || !setStudentValue || studentEditorInitialized) {
			return;
		}

		// Generate template inline to avoid dependency issues
		let template = '';
		if (keepComments) {
			// Inline template generation to avoid callback dependency issues
			try {
				const lines = originalCode.split('\n');
				const emptyTemplate = [];

				lines.forEach((line, index) => {
					const singleLineComment = line.match(/\/\/.*$/);
					const multiLineCommentStart = line.match(/\/\*.*$/);
					const multiLineCommentEnd = line.match(/^.*?\*\//);
					const multiLineCommentFull = line.match(/\/\*.*?\*\//);

					const codeWithoutComments = line
						.replace(/\/\/.*$/, '')
						.replace(/\/\*.*?\*\//g, '')
						.replace(/\/\*.*$/, '')
						.replace(/^.*?\*\//, '');

					if (codeWithoutComments.trim() === '') {
						emptyTemplate.push(line);
					} else {
						let commentParts = [];

						if (singleLineComment) {
							commentParts.push(singleLineComment[0]);
						}

						if (multiLineCommentFull) {
							const matches = line.match(/\/\*.*?\*\//g);
							commentParts.push(...matches);
						} else if (multiLineCommentStart) {
							commentParts.push(multiLineCommentStart[0]);
						} else if (multiLineCommentEnd) {
							commentParts.push(multiLineCommentEnd[0]);
						}

						const beforeThisLine = lines.slice(0, index).join('\n');
						const openComments = (
							beforeThisLine.match(/\/\*/g) || []
						).length;
						const closeComments = (
							beforeThisLine.match(/\*\//g) || []
						).length;
						const insideMultiLineComment =
							openComments > closeComments;

						if (insideMultiLineComment && !multiLineCommentEnd) {
							emptyTemplate.push(line);
						} else if (commentParts.length > 0) {
							const leadingWhitespace = line.match(/^\s*/)[0];
							emptyTemplate.push(
								leadingWhitespace + commentParts.join(' ')
							);
						} else {
							emptyTemplate.push('');
						}
					}
				});

				template = emptyTemplate.join('\n');
			} catch (error) {
				console.warn('❌ Error generating template:', error);
				template = '';
			}
		} else {
			template = '';
		}

		setStudentValue(template);
		setStudentEditorInitialized(true); // Mark as initialized to prevent overwrites

		// VERIFY: Check what the student editor actually contains after setValue
		setTimeout(() => {
			const actualStudentContent = getStudentValue();
		}, 100);
	}, [originalCode, keepComments, setStudentValue, studentEditorInitialized]);

	// Initialize hints based on original code
	useEffect(() => {
		if (!originalCode.trim()) {
			setHints([]);
			return;
		}

		const processedCode = keepComments
			? originalCode
			: stripComments(originalCode);
		const generatedHints = generateHints(processedCode, keepComments);
		setHints(generatedHints);
	}, [originalCode, keepComments]);

	// Strip comments from code for advanced exercise mode
	const stripComments = (code) => {
		// Remove single-line comments
		let cleaned = code.replace(/\/\/.*$/gm, '');
		// Remove multi-line comments
		cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, '');
		// Remove empty lines that result from comment removal
		cleaned = cleaned.replace(/^\s*\n/gm, '');
		return cleaned;
	};

	// Generate hints based on code analysis
	const generateHints = (code, withComments) => {
		const lines = code.split('\n').filter((line) => line.trim());
		const hints = [];

		// Extract key programming concepts based on mode
		const patterns = withComments
			? [
					// When comments are kept, focus on implementation details
					{
						regex: /function\s+(\w+)/g,
						hint: 'Implement the function body for "{match}"',
					},
					{
						regex: /let\s+(\w+)/g,
						hint: 'Initialize the variable "{match}" with appropriate value',
					},
					{
						regex: /const\s+(\w+)/g,
						hint: 'Set the constant "{match}" to the correct value',
					},
					{
						regex: /if\s*\(/g,
						hint: 'Add the condition for the if statement',
					},
					{
						regex: /for\s*\(/g,
						hint: 'Complete the for loop syntax and body',
					},
					{
						regex: /return\s+/g,
						hint: 'Return the calculated result',
					},
				]
			: [
					// When comments are stripped, provide structural guidance
					{
						regex: /function\s+(\w+)/g,
						hint: 'Define a function named "{match}"',
					},
					{
						regex: /let\s+(\w+)/g,
						hint: 'Declare a variable called "{match}"',
					},
					{
						regex: /const\s+(\w+)/g,
						hint: 'Create a constant named "{match}"',
					},
					{
						regex: /console\.log\(/g,
						hint: 'Add a console.log statement',
					},
					{ regex: /if\s*\(/g, hint: 'Add a conditional statement' },
					{ regex: /for\s*\(/g, hint: 'Create a for loop' },
					{ regex: /while\s*\(/g, hint: 'Add a while loop' },
					{ regex: /\.\w+\(/g, hint: 'Call a method on an object' },
					{
						regex: /class\s+(\w+)/g,
						hint: 'Define a class called "{match}"',
					},
					{ regex: /=>\s*/g, hint: 'Use arrow function syntax' },
				];

		for (const pattern of patterns) {
			const matches = [...code.matchAll(pattern.regex)];
			for (const match of matches) {
				hints.push({
					id: `hint_${hints.length}`,
					text: pattern.hint.replace('{match}', match[1] || ''),
					revealed: false,
					type: 'concept',
				});
			}
		}

		// Add structural hints
		const structuralHints = [
			{
				text: `This program has ${lines.length} lines of code`,
				type: 'structure',
			},
			{
				text: 'Think about the logical flow of the program',
				type: 'structure',
			},
			{
				text: 'Consider what inputs and outputs are needed',
				type: 'structure',
			},
		];

		hints.push(
			...structuralHints.map((hint, idx) => ({
				id: `structural_${idx}`,
				...hint,
				revealed: false,
			}))
		);

		return hints.slice(0, 8); // Limit to 8 hints max
	};

	// Check student's progress
	const checkProgress = () => {
		const currentStudentCode = getStudentValue();
		if (!currentStudentCode.trim() || !originalCode.trim()) {
			setProgress(0);
			return;
		}

		// Simple similarity check
		const studentLines = currentStudentCode
			.split('\n')
			.filter((l) => l.trim());
		const originalLines = originalCode.split('\n').filter((l) => l.trim());

		let matches = 0;
		let totalConcepts = 0;

		// Check for key programming concepts
		const concepts = [
			/function\s+\w+/g,
			/let\s+\w+/g,
			/const\s+\w+/g,
			/if\s*\(/g,
			/for\s*\(/g,
			/while\s*\(/g,
			/return\s+/g,
			/console\.log\(/g,
			/class\s+\w+/g,
			/=>\s*/g,
		];

		for (const concept of concepts) {
			const inOriginal = originalCode.match(concept);
			const inStudent = currentStudentCode.match(concept);

			if (inOriginal) {
				totalConcepts++;
				if (inStudent && inStudent.length >= inOriginal.length) {
					matches++;
				}
			}
		}

		const conceptProgress =
			totalConcepts > 0 ? (matches / totalConcepts) * 100 : 0;
		const lengthProgress = Math.min(
			(studentLines.length / originalLines.length) * 100,
			100
		);

		const overallProgress = Math.round(
			(conceptProgress + lengthProgress) / 2
		);
		setProgress(overallProgress);

		// Check if complete
		if (overallProgress >= 85) {
			setIsComplete(true);
			setFeedback({
				type: 'success',
				message:
					'🎉 Excellent work! Your code demonstrates understanding of the key concepts.',
			});
		} else if (overallProgress >= 50) {
			setFeedback({
				type: 'partial',
				message: `Good progress! You're ${overallProgress}% there. Keep going!`,
			});
		}
	};

	// Compare with original code
	const compareWithOriginal = () => {
		const currentStudentCode = getStudentValue();
		if (!currentStudentCode.trim()) {
			setFeedback({
				type: 'warning',
				message: 'Write some code first before comparing!',
			});
			return;
		}

		checkProgress();

		// Provide specific feedback
		const suggestions = [];

		// Check for missing concepts
		const studentLower = currentStudentCode.toLowerCase();
		const originalLower = originalCode.toLowerCase();

		if (
			originalLower.includes('function') &&
			!studentLower.includes('function')
		) {
			suggestions.push('Consider adding function definitions');
		}
		if (originalLower.includes('if') && !studentLower.includes('if')) {
			suggestions.push('You might need conditional logic');
		}
		if (originalLower.includes('for') && !studentLower.includes('for')) {
			suggestions.push('Think about using loops');
		}
		if (
			originalLower.includes('return') &&
			!studentLower.includes('return')
		) {
			suggestions.push("Don't forget return statements");
		}

		if (suggestions.length > 0) {
			setFeedback({
				type: 'info',
				message: 'Suggestions: ' + suggestions.join(', '),
			});
		}
	};

	// Reveal a hint
	const revealHint = (hintId) => {
		setHints((prev) =>
			prev.map((hint) =>
				hint.id === hintId ? { ...hint, revealed: true } : hint
			)
		);
	};

	// Reset exercise
	const resetExercise = () => {
		if (!setStudentValue || !setSolutionValue || !originalCode) return;

		// Reset solution editor to original code (should already be there)
		setSolutionValue(originalCode);

		// Reset student editor to template (inline generation)
		let template = '';
		if (keepComments) {
			// Same inline template generation as in the effect
			try {
				const lines = originalCode.split('\n');
				const emptyTemplate = [];

				lines.forEach((line, index) => {
					const singleLineComment = line.match(/\/\/.*$/);
					const multiLineCommentStart = line.match(/\/\*.*$/);
					const multiLineCommentEnd = line.match(/^.*?\*\//);
					const multiLineCommentFull = line.match(/\/\*.*?\*\//);

					const codeWithoutComments = line
						.replace(/\/\/.*$/, '')
						.replace(/\/\*.*?\*\//g, '')
						.replace(/\/\*.*$/, '')
						.replace(/^.*?\*\//, '');

					if (codeWithoutComments.trim() === '') {
						emptyTemplate.push(line);
					} else {
						let commentParts = [];

						if (singleLineComment) {
							commentParts.push(singleLineComment[0]);
						}

						if (multiLineCommentFull) {
							const matches = line.match(/\/\*.*?\*\//g);
							commentParts.push(...matches);
						} else if (multiLineCommentStart) {
							commentParts.push(multiLineCommentStart[0]);
						} else if (multiLineCommentEnd) {
							commentParts.push(multiLineCommentEnd[0]);
						}

						const beforeThisLine = lines.slice(0, index).join('\n');
						const openComments = (
							beforeThisLine.match(/\/\*/g) || []
						).length;
						const closeComments = (
							beforeThisLine.match(/\*\//g) || []
						).length;
						const insideMultiLineComment =
							openComments > closeComments;

						if (insideMultiLineComment && !multiLineCommentEnd) {
							emptyTemplate.push(line);
						} else if (commentParts.length > 0) {
							const leadingWhitespace = line.match(/^\s*/)[0];
							emptyTemplate.push(
								leadingWhitespace + commentParts.join(' ')
							);
						} else {
							emptyTemplate.push('');
						}
					}
				});

				template = emptyTemplate.join('\n');
			} catch (error) {
				console.warn('Error generating reset template:', error);
				template = '';
			}
		}

		setStudentValue(template);
		// Removed setStudentCode - no longer needed

		// Reset UI state
		setFeedback(null);
		setProgress(0);
		setIsComplete(false);
		setHints((prev) => prev.map((hint) => ({ ...hint, revealed: false })));
	};

	// Show solution (read mode)
	const showSolution = () => {
		// VERIFY: Check solution editor content before mode switch
		const currentSolutionContent = getSolutionValue();
		const currentStudentContent = getStudentValue();

		setMode('read');

		// VERIFY: Check editor states after mode switch
		setTimeout(() => {
			const afterSolutionContent = getSolutionValue();
			const afterStudentContent = getStudentValue();
		}, 50);
	};

	// Switch to write mode
	const switchToWriteMode = () => {
		setMode('write');
	};

	return (
		<div className={styles.writememeLens}>
			<div className={styles.header}>
				<h3>✏️ Write the Code</h3>
				{fileName && (
					<span className={styles.fileName}>{fileName}</span>
				)}

				<div className={styles.controls}>
					<div className={styles.modeToggle}>
						<button
							className={`${styles.modeButton} ${mode === 'write' ? styles.active : ''}`}
							onClick={switchToWriteMode}
						>
							✏️ Write
						</button>
						<button
							className={`${styles.modeButton} ${mode === 'read' ? styles.active : ''}`}
							onClick={showSolution}
						>
							👁️ Read
						</button>
					</div>

					<label className={styles.checkboxLabel}>
						<input
							type="checkbox"
							checked={keepComments}
							onChange={(e) => setKeepComments(e.target.checked)}
							className={styles.commentsCheckbox}
						/>
						<span className={styles.checkboxText}>
							💬 Keep Comments
						</span>
					</label>

					<button
						className={styles.controlButton}
						onClick={() => setShowHints(!showHints)}
					>
						💡 {showHints ? 'Hide' : 'Show'} Hints
					</button>

					<button
						className={styles.controlButton}
						onClick={compareWithOriginal}
						disabled={!getStudentValue().trim()}
					>
						🔍 Check Progress
					</button>

					<button
						className={styles.controlButton}
						onClick={resetExercise}
					>
						🔄 Reset
					</button>
				</div>
			</div>

			{/* Progress Bar */}
			<div className={styles.progressSection}>
				<div className={styles.progressBar}>
					<div
						className={styles.progressFill}
						style={{ width: `${progress}%` }}
					/>
				</div>
				<span className={styles.progressText}>
					{progress}% Complete
				</span>
			</div>

			{feedback && (
				<div className={`${styles.feedback} ${styles[feedback.type]}`}>
					{feedback.message}
				</div>
			)}

			<div className={styles.exerciseContent}>
				{/* WRITE MODE - always rendered but visible only in write mode */}
				<div
					className={styles.writeMode}
					style={{ display: mode === 'write' ? 'flex' : 'none' }}
				>
					<div className={styles.editorPanel}>
						<h4>Write Your Code</h4>
						<div className={styles.codeEditorContainer}>
							<div
								ref={studentEditorContainer}
								className={`${styles.codeEditor} ${styles.noCopyPaste}`}
							/>
						</div>
						<div className={styles.editorFooter}>
							<span className={styles.lineCount}>
								Lines: {getStudentValue().split('\n').length}
							</span>
							<span className={styles.charCount}>
								Characters: {getStudentValue().length}
							</span>
						</div>
					</div>

					{showHints && (
						<div className={styles.hintsPanel}>
							<h4>💡 Hints</h4>
							<div className={styles.hintsList}>
								{hints.map((hint) => (
									<div
										key={hint.id}
										className={styles.hintItem}
									>
										{hint.revealed ? (
											<div
												className={styles.revealedHint}
											>
												<span
													className={styles.hintType}
												>
													{hint.type === 'concept'
														? '🧩'
														: '🏗️'}
												</span>
												{hint.text}
											</div>
										) : (
											<button
												className={styles.hintButton}
												onClick={() =>
													revealHint(hint.id)
												}
											>
												🔒 Reveal Hint
											</button>
										)}
									</div>
								))}
							</div>
						</div>
					)}
				</div>

				{/* READ MODE - always rendered but visible only in read mode */}
				<div
					className={styles.readMode}
					style={{ display: mode === 'read' ? 'flex' : 'none' }}
				>
					<div className={styles.solutionPanel}>
						<h4>📖 Solution Code</h4>
						<div className={styles.solutionCodeContainer}>
							<div
								ref={solutionEditorContainer}
								className={`${styles.solutionCode} ${styles.readonly} ${styles.noCopyPaste}`}
							/>
						</div>
						<div className={styles.solutionFooter}>
							<button
								className={styles.backToWriteButton}
								onClick={switchToWriteMode}
							>
								← Back to Writing
							</button>
						</div>
					</div>

					{getStudentValue().trim() && (
						<div className={styles.comparisonPanel}>
							<h4>📊 Your Code vs Solution</h4>
							<div className={styles.comparisonGrid}>
								<div className={styles.yourCode}>
									<h5>Your Code</h5>
									<pre>
										<code>{getStudentValue()}</code>
									</pre>
								</div>
								<div className={styles.solutionCode}>
									<h5>Expected Solution</h5>
									<pre>
										<code>{originalCode}</code>
									</pre>
								</div>
							</div>
						</div>
					)}
				</div>
			</div>

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
							<strong>Write Mode:</strong> Code from scratch using
							hints as guidance
						</li>
						<li>
							<strong>Read Mode:</strong> Study the solution and
							compare with your attempt
						</li>
						<li>
							<strong>Progress Check:</strong> Get feedback on
							your implementation
						</li>
						<li>
							<strong>Hints:</strong> Reveal clues about
							programming concepts needed
						</li>
						<li>
							<strong>Keep Comments:</strong> When checked,
							comments guide implementation; when unchecked, focus
							on code structure
						</li>
					</ul>
				)}
			</div>
		</div>
	);
};

// Writeme lens - unified interface
export const id = 'writeme';
export const label = 'Write Me';
export const applicable = (file) =>
	file && file.lang === 'javascript' && file.ext !== '.mjs';
export const render = (resource, _config) => {
	const finalConfig = { ...config, ..._config };
	return <WritemeLens resource={resource} config={finalConfig} />;
};
export const config = deepFreeze({});
export const renderConfig = () => null; // No configuration UI needed

export default WritemeLens;
