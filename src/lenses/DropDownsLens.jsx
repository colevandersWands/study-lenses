import { useState, useEffect, useCallback } from 'preact/hooks';
import * as acorn from 'acorn';
import { useApp } from '../context/AppContext.jsx';
import styles from './DropDownsLens.module.css';

/**
 * DropDownsLens - Replaces tokens with dropdown selections
 * Supports keywords, identifiers, comments, operators, and primitives
 */
const DropDownsLens = () => {
	const { trackStudyAction, currentFile } = useApp();

	const code = currentFile?.content || '';

	// Configuration state - simplified like BlanksLens
	const [difficulty, setDifficulty] = useState(50); // Single unified probability 0-100%
	const [contentTypes, setContentTypes] = useState({
		keywords: true,
		identifiers: true,
		comments: true, // Only inline comments
		operators: false,
		primitives: false,
	});
	const [useDistractors, setUseDistractors] = useState(false);

	// Exercise state
	const [userAnswers, setUserAnswers] = useState({});
	const [showFeedback, setShowFeedback] = useState(false);
	const [elements, setElements] = useState([]);
	const [correctAnswers, setCorrectAnswers] = useState({});
	const [allTokens, setAllTokens] = useState({
		keywords: [],
		identifiers: [],
		comments: [],
		operators: [],
		primitives: [],
	});

	// Debounced config update
	const [pendingConfig, setPendingConfig] = useState({
		difficulty,
		contentTypes,
		useDistractors,
	});

	useEffect(() => {
		const timer = setTimeout(() => {
			// Apply the pending config to state
			setDifficulty(pendingConfig.difficulty);
			setContentTypes(pendingConfig.contentTypes);
			setUseDistractors(pendingConfig.useDistractors);
			setUserAnswers({}); // Reset answers on config change
			setShowFeedback(false);
		}, 500);

		return () => clearTimeout(timer);
	}, [pendingConfig]);

	/**
	 * Extract tokens from JavaScript code using Acorn
	 */
	const extractTokens = useCallback((code) => {
		const tokens = {
			keywords: [],
			identifiers: [],
			comments: [],
			operators: [],
			primitives: [],
		};

		// JavaScript keywords
		const KEYWORDS = new Set([
			'if',
			'else',
			'for',
			'while',
			'do',
			'switch',
			'case',
			'break',
			'continue',
			'function',
			'return',
			'const',
			'let',
			'var',
			'class',
			'extends',
			'new',
			'try',
			'catch',
			'finally',
			'throw',
			'async',
			'await',
			'import',
			'export',
			'default',
			'typeof',
			'instanceof',
			'in',
			'delete',
			'void',
			'this',
			'super',
		]);

		const OPERATORS = new Set([
			'+',
			'-',
			'*',
			'/',
			'%',
			'=',
			'==',
			'===',
			'!=',
			'!==',
			'<',
			'>',
			'<=',
			'>=',
			'&&',
			'||',
			'!',
			'++',
			'--',
			'+=',
			'-=',
			'*=',
			'/=',
			'%=',
			'<<',
			'>>',
			'>>>',
			'&',
			'|',
			'^',
			'~',
		]);

		try {
			// Parse code and collect inline comments only
			const comments = [];
			const ast = acorn.parse(code, {
				ecmaVersion: 'latest',
				sourceType: 'module',
				allowReturnOutsideFunction: true,
				allowHashBang: true,
				locations: true,
				onComment: (isBlock, text, start, end) => {
					if (!isBlock) {
						// Only inline comments per requirements
						comments.push({
							value: `//${text}`,
							start,
							end,
							text: text.trim(),
						});
					}
				},
			});

			tokens.comments = comments;

			// Use acorn tokenizer for precise token extraction
			const tokenizer = acorn.tokenizer(code, {
				ecmaVersion: 'latest',
				locations: true,
			});

			let token;
			while ((token = tokenizer.getToken()).type !== acorn.tokTypes.eof) {
				// Keywords
				if (token.type.keyword && KEYWORDS.has(token.value)) {
					tokens.keywords.push({
						value: token.value,
						start: token.start,
						end: token.end,
					});
				}
				// Identifiers (variable names)
				else if (
					token.type === acorn.tokTypes.name &&
					!KEYWORDS.has(token.value)
				) {
					tokens.identifiers.push({
						value: token.value,
						start: token.start,
						end: token.end,
					});
				}
				// Operators
				else if (OPERATORS.has(token.value)) {
					tokens.operators.push({
						value: token.value,
						start: token.start,
						end: token.end,
					});
				}
				// Primitives (literals)
				else if (
					token.type === acorn.tokTypes.num ||
					token.type === acorn.tokTypes.string ||
					token.type === acorn.tokTypes._true ||
					token.type === acorn.tokTypes._false ||
					token.type === acorn.tokTypes._null
				) {
					tokens.primitives.push({
						value: code.slice(token.start, token.end),
						start: token.start,
						end: token.end,
					});
				}
			}
		} catch (error) {
			// console.error('Failed to parse code:', error);
			// Return empty tokens on parse error
		}

		return tokens;
	}, []);

	/**
	 * Select tokens for replacement based on unified difficulty setting
	 */
	const selectTokensForDropdowns = useCallback(
		(tokens, contentTypes, difficulty) => {
			const selected = [];

			Object.entries(contentTypes).forEach(([type, enabled]) => {
				if (enabled && tokens[type]) {
					tokens[type].forEach((token) => {
						if (Math.random() * 100 < difficulty) {
							selected.push({
								...token,
								type,
								id: `${type}-${token.start}-${token.end}`,
							});
						}
					});
				}
			});

			// Sort by position in code
			return selected.sort((a, b) => a.start - b.start);
		},
		[]
	);

	/**
	 * Generate dropdown options with optional distractors
	 */
	const generateOptions = useCallback((token, allTokens, useDistractors) => {
		const options = [token.value];

		// if (useDistractors) {
		// Add distractor options from same token type
		const sameTypeTokens = allTokens[token.type] || [];
		const distractors = sameTypeTokens
			.map((t) => t.value)
			.filter((v) => v !== token.value)
			.filter((v, i, arr) => arr.indexOf(v) === i) // unique values
			.slice(0, 3); // limit to 3 distractors

		options.push(...distractors);

		// If not enough distractors, add some generic ones
		if (options.length < 4) {
			const genericDistractors = {
				keywords: ['if', 'for', 'function', 'return', 'const', 'let'],
				identifiers: [
					'temp',
					'result',
					'data',
					'value',
					'item',
					'index',
				],
				comments: ['// TODO', '// FIXME', '// NOTE', '// DEBUG'],
				operators: ['+', '-', '===', '&&', '||', '!='],
				primitives: ['""', '0', 'true', 'false', 'null', '1'],
			};

			const extras = genericDistractors[token.type] || [];
			for (const extra of extras) {
				if (!options.includes(extra) && options.length < 4) {
					options.push(extra);
				}
			}
		}
		// }

		// Shuffle options so correct answer isn't always first
		return options.sort(() => Math.random() - 0.5);
	}, []);

	/**
	 * Transform code into line-based elements for rendering with line numbers
	 */
	const transformCodeToElements = useCallback(
		(code, selectedTokens, allTokens, useDistractors) => {
			const lines = code.split('\n');
			const correctAnswers = {};
			const lineElements = [];

			lines.forEach((line, lineIndex) => {
				const lineStart =
					lines.slice(0, lineIndex).join('\n').length +
					(lineIndex > 0 ? 1 : 0);
				const lineEnd = lineStart + line.length;

				// Find tokens that belong to this line
				const lineTokens = selectedTokens.filter(
					(token) => token.start >= lineStart && token.end <= lineEnd
				);

				// Sort line tokens by position
				lineTokens.sort((a, b) => a.start - b.start);

				const elements = [];
				let lastIndex = 0; // Relative to line start

				lineTokens.forEach((token) => {
					const relativeStart = token.start - lineStart;
					const relativeEnd = token.end - lineStart;

					// Add code before this token
					if (relativeStart > lastIndex) {
						elements.push({
							type: 'code',
							content: line.slice(lastIndex, relativeStart),
						});
					}

					// Generate options for this dropdown
					const options = generateOptions(
						token,
						allTokens,
						useDistractors
					);

					// Add dropdown element
					elements.push({
						type: 'dropdown',
						id: token.id,
						options: options,
						correctValue: token.value,
						tokenType: token.type,
					});

					// Track correct answer
					correctAnswers[token.id] = token.value;

					lastIndex = relativeEnd;
				});

				// Add remaining code in this line
				if (lastIndex < line.length) {
					elements.push({
						type: 'code',
						content: line.slice(lastIndex),
					});
				}

				lineElements.push({
					type: 'line',
					lineNumber: lineIndex + 1,
					elements: elements,
				});
			});

			return { elements: lineElements, correctAnswers };
		},
		[generateOptions]
	);

	// Generate exercise when code or config changes
	useEffect(() => {
		if (!code.trim()) {
			setElements([]);
			setCorrectAnswers({});
			setAllTokens({
				keywords: [],
				identifiers: [],
				comments: [],
				operators: [],
				primitives: [],
			});
			return;
		}

		const tokens = extractTokens(code);
		setAllTokens(tokens);

		const selected = selectTokensForDropdowns(
			tokens,
			contentTypes,
			difficulty
		);
		const { elements: newElements, correctAnswers: newCorrectAnswers } =
			transformCodeToElements(code, selected, tokens, useDistractors);

		setElements(newElements);
		setCorrectAnswers(newCorrectAnswers);
	}, [
		code,
		difficulty,
		contentTypes,
		useDistractors,
		extractTokens,
		selectTokensForDropdowns,
		transformCodeToElements,
	]);

	// Handle configuration changes
	const handleConfigChange = useCallback((type, value) => {
		setPendingConfig((prev) => {
			if (type === 'difficulty') {
				return { ...prev, difficulty: value };
			} else if (type === 'useDistractors') {
				return { ...prev, useDistractors: value };
			} else {
				// Content type toggles
				return {
					...prev,
					contentTypes: {
						...prev.contentTypes,
						[type]: value,
					},
				};
			}
		});
	}, []);

	// Handle answer selection
	const handleAnswerChange = useCallback(
		(dropdownId, value) => {
			setUserAnswers((prev) => ({
				...prev,
				[dropdownId]: value,
			}));

			trackStudyAction('dropdown_answer', currentFile, {
				dropdownId,
				value,
				isCorrect: value === correctAnswers[dropdownId],
			});
		},
		[correctAnswers, currentFile, trackStudyAction]
	);

	// Check answers
	const handleCheck = useCallback(() => {
		setShowFeedback(true);

		const results = {
			correct: 0,
			total: Object.keys(correctAnswers).length,
		};

		Object.entries(correctAnswers).forEach(([id, correct]) => {
			if (userAnswers[id] === correct) {
				results.correct++;
			}
		});

		trackStudyAction('exercise_check', currentFile, {
			score: results.correct,
			total: results.total,
			percentage:
				results.total > 0
					? Math.round((results.correct / results.total) * 100)
					: 0,
		});
	}, [correctAnswers, userAnswers, currentFile, trackStudyAction]);

	// Reset exercise
	const handleReset = useCallback(() => {
		setUserAnswers({});
		setShowFeedback(false);

		// Re-generate exercise with same config
		const tokens = extractTokens(code);
		const selected = selectTokensForDropdowns(
			tokens,
			contentTypes,
			difficulty
		);
		const { elements: newElements, correctAnswers: newCorrectAnswers } =
			transformCodeToElements(code, selected, tokens, useDistractors);

		setElements(newElements);
		setCorrectAnswers(newCorrectAnswers);
	}, [
		code,
		difficulty,
		contentTypes,
		useDistractors,
		extractTokens,
		selectTokensForDropdowns,
		transformCodeToElements,
	]);

	// Handle empty or invalid files
	if (!currentFile || !code.trim()) {
		return (
			<div className={styles.container}>
				<div className={styles.emptyState}>
					<p>No JavaScript code to study.</p>
					<p>
						Please select a JavaScript file to create dropdown
						exercises.
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className={styles.container}>
			<ControlPanel
				difficulty={pendingConfig.difficulty}
				contentTypes={pendingConfig.contentTypes}
				useDistractors={pendingConfig.useDistractors}
				onConfigChange={handleConfigChange}
				onCheck={handleCheck}
				onReset={handleReset}
				totalDropdowns={Object.keys(correctAnswers).length}
				correctAnswers={
					Object.values(correctAnswers).filter(
						(_, i) =>
							userAnswers[Object.keys(correctAnswers)[i]] ===
							Object.values(correctAnswers)[i]
					).length
				}
				showFeedback={showFeedback}
			/>

			<div
				className={`${styles.codeContainer} ${styles.withLineNumbers}`}
			>
				{elements.length === 0 ? (
					<div className={styles.emptyState}>
						<p>No tokens found with current settings.</p>
						<p>
							Try enabling more token types or increasing
							difficulty.
						</p>
					</div>
				) : (
					elements.map((line, lineIndex) => (
						<div
							key={lineIndex}
							className={`${styles.codeLine} ${styles.withLineNumbers}`}
						>
							{line.elements.map((element, elementIndex) => {
								if (element.type === 'code') {
									return (
										<span
											key={elementIndex}
											className={styles.codeSegment}
										>
											{element.content}
										</span>
									);
								}

								const isCorrect =
									userAnswers[element.id] ===
									element.correctValue;
								const hasAnswer = userAnswers[element.id];
								const showResult = showFeedback && hasAnswer;

								return (
									<select
										key={element.id}
										className={`${styles.dropdown} ${
											showResult
												? isCorrect
													? styles.correct
													: styles.incorrect
												: ''
										}`}
										value={userAnswers[element.id] || ''}
										onChange={(e) =>
											handleAnswerChange(
												element.id,
												e.target.value
											)
										}
										title={`Choose the correct ${element.tokenType}`}
									>
										<option value="">{`{${element.tokenType
											.split('')
											.slice(
												0,
												element.tokenType.length - 1
											)
											.join('')}}`}</option>
										{element.options.map((option, i) => (
											<option key={i} value={option}>
												{option}
											</option>
										))}
									</select>
								);
							})}
						</div>
					))
				)}
			</div>
		</div>
	);
};

/**
 * Control Panel Component - Compact design with single slider
 */
const ControlPanel = ({
	difficulty,
	contentTypes,
	useDistractors,
	onConfigChange,
	onCheck,
	onReset,
	totalDropdowns,
	correctAnswers,
	showFeedback,
}) => {
	const tokenTypes = {
		keywords: 'Keywords',
		identifiers: 'Identifiers',
		comments: 'Comments',
		operators: 'Operators',
		primitives: 'Primitives',
	};

	// Add safety checks
	const safeDifficulty = difficulty || 50;
	const safeContentTypes = contentTypes || {
		keywords: true,
		identifiers: true,
		comments: true,
		operators: false,
		primitives: false,
	};
	// const safeUseDistractors = useDistractors || true;

	return (
		<div className={styles.controls}>
			{/* Difficulty slider with distractors checkbox */}
			<div className={styles.sliderRow}>
				<div className={styles.sliderContainer}>
					<label className={styles.sliderLabel}>
						Difficulty: {safeDifficulty}%
					</label>
					<input
						type="range"
						min="0"
						max="100"
						value={safeDifficulty}
						onChange={(e) =>
							onConfigChange('difficulty', Number(e.target.value))
						}
						className={styles.slider}
					/>
				</div>
				{/* <label className={styles.distractorsLabel}>
					<span> Distractors</span>
					<input
						type="checkbox"
						checked={safeUseDistractors}
						onChange={(e) =>
							onConfigChange('useDistractors', e.target.checked)
						}
					/>
				</label> */}
			</div>

			{/* Content type checkboxes in one row */}
			<div className={styles.checkboxRow}>
				{Object.entries(tokenTypes).map(([type, label]) => (
					<label key={type} className={styles.checkboxLabel}>
						<input
							type="checkbox"
							checked={safeContentTypes[type] || false}
							onChange={(e) =>
								onConfigChange(type, e.target.checked)
							}
						/>
						<span>{label}</span>
					</label>
				))}

				{showFeedback && (
					<span className={styles.score}>
						Score:{' '}
						{Math.round((correctAnswers / totalDropdowns) * 100)}%
					</span>
				)}

				<button
					className={styles.checkButton}
					onClick={onCheck}
					disabled={totalDropdowns === 0}
				>
					Check ({correctAnswers}/{totalDropdowns})
				</button>
			</div>

			{/* Action buttons */}
			{/* <div className={styles.actionButtons}></div> */}
		</div>
	);
};

// DropDowns lens - unified interface
export const id = 'dropdowns';
export const label = 'Dropdowns';
export const icon = '🔽';
export const applicable = (file) =>
	file && file.type === 'file' && file.lang === 'javascript';
export const render = (resource) => {
	// Handle different calling patterns - sometimes receives props object, sometimes direct resource
	const actualResource = resource?.resource || resource;
	return <DropDownsLens resource={actualResource} />;
};
export const config = {
	icon: '🔽',
	label: 'Dropdowns',
};

export default DropDownsLens;
