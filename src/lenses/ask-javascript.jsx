/**
 * JavaScript Ask Plugin for StudyButton
 *
 * Provides interactive code analysis questions using the SL1 ask system.
 * Falls back to manual questions if the ask system is not available.
 */

import { deepFreeze } from '../utils/deepFreeze.js';
import { askOpenEnded } from '../../public/static/ask/component/ask-questions.js';

// Ask JavaScript lens - unified interface
export const id = 'ask-javascript';
export const label = 'Study Question';

// Plugin configuration with deep freezing
export const config = deepFreeze({
	// Question Types
	theCode: true,
	howItWorks: true,
	variableTraces: true,
	connections: true,
	goals: true,
	userExperience: true,

	// Language Features
	variables: true,
	data: true,
	operators: true,
	controlFlow: true,
	functions: true,

	// Special Options
	alertQuestions: false,
	multipleChoice: false, // false = open-ended, true = multiple choice
	showAnswerHints: true,
});

/**
 * Check if this plugin is applicable to the given file
 * @param {Object} file - File object with properties like lang, content, etc.
 * @returns {boolean} True if plugin should be available for this file
 */
export const applicable = (file) => {
	if (!file) return false;

	// Support JavaScript languages primarily using language names (not extensions)
	const primaryLanguages = ['javascript', 'typescript'];

	if (file.lang && primaryLanguages.includes(file.lang)) {
		return true;
	}

	// Could also support other languages with basic fallback questions
	const supportedLanguages = ['html', 'css', 'python'];
	if (file.lang && supportedLanguages.includes(file.lang)) {
		return true;
	}

	return false;
};

/**
 * Execute the plugin functionality
 * @param {string} code - Code to analyze with questions
 * @param {Object} config - Plugin configuration
 * @param {Object} context - Additional context (file info, etc.)
 * @returns {Promise} Execution result
 */
export const execute = async (file, _config = {}) => {
	const finalConfig = { ...config, ..._config };
	const code = file.content

	try {
		// Try to use the SL1 ask system first
		askOpenEnded(code || '', finalConfig);
	} catch (error) {
		console.warn('Ask system failed, showing fallback questions:', error);
		showFallbackQuestions(code, file);
	}
};

/**
 * Show fallback questions when ask system is not available
 * @param {string} code - Code to analyze
 * @param {Object} file - File information
 */
const showFallbackQuestions = (file) => {
	const language = file?.lang || 'code';
	const isJavaScript = ['.js', '.jsx', '.ts', '.tsx'].includes(language);
	const isHTML = ['.html', '.htm'].includes(language);
	const isCSS = language === '.css';
	const isPython = language === '.py';

	let questions = [];

	if (isJavaScript) {
		questions = [
			'- What does this JavaScript code do step by step?',
			'- What are the main variables and their purposes?',
			'- Are there any functions defined? What do they do?',
			'- What would happen if you changed certain values?',
			'- Are there any patterns or structures you recognize?',
			'- What might break if you modified this code?',
			'- How could you test this code to make sure it works?',
		];
	} else if (isHTML) {
		questions = [
			'- What HTML elements are used in this structure?',
			'- How is the content organized and structured?',
			'- What attributes are used and what do they do?',
			'- How would this appear when rendered in a browser?',
			'- What semantic meaning do the elements convey?',
			'- How could you improve the accessibility of this HTML?',
		];
	} else if (isCSS) {
		questions = [
			'- What elements or classes are being styled?',
			'- What visual effects will these styles create?',
			'- How do the selectors target different elements?',
			'- What layout properties are being used?',
			'- How might this look on different screen sizes?',
			'- What happens if you change certain property values?',
		];
	} else if (isPython) {
		questions = [
			'- What does this Python code do step by step?',
			'- What variables are defined and how are they used?',
			'- Are there any functions or classes? What do they do?',
			'- What data types are being used?',
			'- How does the control flow work (if/else, loops)?',
			'- What would be the output of this code?',
			'- How could you test or debug this code?',
		];
	} else {
		questions = [
			'- What is the purpose of this code?',
			'- How is the code structured and organized?',
			'- What are the key components or sections?',
			'- What patterns do you notice?',
			'- How might you modify or extend this code?',
			'- What questions would you ask to understand it better?',
		];
	}

	// Display questions in console with nice formatting
	// console.log('🤔 CODE ANALYSIS QUESTIONS');
	// console.log('='.repeat(50));
	// console.log('Consider these questions about your code:');
	// console.log('');
	questions.forEach((question) => {
		// console.log(question);
	});
	// console.log('');
	// console.log(
	//	'💡 TIP: Try to answer these questions out loud or write down your thoughts!'
	// );
	// console.log('='.repeat(50));
};

/**
 * Render configuration UI for this plugin as dropdown-style options
 * @param {Object} currentConfig - Current configuration values
 * @param {Function} onConfigChange - Callback for configuration changes
 * @param {Function} onNestedConfigChange - Callback for nested configuration changes
 * @returns {JSX.Element} Configuration UI component
 */
// export const renderConfig = (
// 	currentConfig,
// 	onConfigChange,
// 	onNestedConfigChange
// ) => {
// 	return (
// 		<>
// 			<div className="configSection">
// 				<div className="configSectionTitle">Question Types:</div>

// 				<label className="configOption">
// 					<div>
// 						<input
// 							type="checkbox"
// 							checked={currentConfig.theCode}
// 							onChange={(e) => {
// 								if (e.target instanceof HTMLInputElement) {
// 									onConfigChange('theCode', e.target.checked);
// 								}
// 							}}
// 						/>
// 						<span className="optionIcon"> The Code</span>
// 					</div>
// 				</label>

// 				<label className="configOption">
// 					<div>
// 						<input
// 							type="checkbox"
// 							checked={currentConfig.howItWorks}
// 							onChange={(e) => {
// 								if (e.target instanceof HTMLInputElement) {
// 									onConfigChange(
// 										'howItWorks',
// 										e.target.checked
// 									);
// 								}
// 							}}
// 						/>
// 						<span className="optionIcon"> How It Works</span>
// 					</div>
// 				</label>

// 				<label className="configOption">
// 					<div>
// 						<input
// 							type="checkbox"
// 							checked={currentConfig.variableTraces}
// 							onChange={(e) => {
// 								if (e.target instanceof HTMLInputElement) {
// 									onConfigChange(
// 										'variableTraces',
// 										e.target.checked
// 									);
// 								}
// 							}}
// 						/>
// 						<span className="optionIcon"> Variable Traces</span>
// 					</div>
// 				</label>

// 				<label className="configOption">
// 					<div>
// 						<input
// 							type="checkbox"
// 							checked={currentConfig.connections}
// 							onChange={(e) => {
// 								if (e.target instanceof HTMLInputElement) {
// 									onConfigChange(
// 										'connections',
// 										e.target.checked
// 									);
// 								}
// 							}}
// 						/>
// 						<span className="optionIcon"> Connections</span>
// 					</div>
// 				</label>

// 				<label className="configOption">
// 					<div>
// 						<input
// 							type="checkbox"
// 							checked={currentConfig.goals}
// 							onChange={(e) => {
// 								if (e.target instanceof HTMLInputElement) {
// 									onConfigChange('goals', e.target.checked);
// 								}
// 							}}
// 						/>
// 						<span className="optionIcon"> Goals</span>
// 					</div>
// 				</label>

// 				<label className="configOption">
// 					<div>
// 						<input
// 							type="checkbox"
// 							checked={currentConfig.userExperience}
// 							onChange={(e) => {
// 								if (e.target instanceof HTMLInputElement) {
// 									onConfigChange(
// 										'userExperience',
// 										e.target.checked
// 									);
// 								}
// 							}}
// 						/>
// 						<span className="optionIcon"> User Experience</span>
// 					</div>
// 				</label>
// 			</div>

// 			<div className="configSection">
// 				<br />
// 				<div className="configSectionTitle">Language Features:</div>

// 				<label className="configOption">
// 					<div>
// 						<input
// 							type="checkbox"
// 							checked={currentConfig.variables}
// 							onChange={(e) => {
// 								if (e.target instanceof HTMLInputElement) {
// 									onConfigChange(
// 										'variables',
// 										e.target.checked
// 									);
// 								}
// 							}}
// 						/>
// 						<span className="optionIcon"> Variables</span>
// 					</div>
// 				</label>

// 				<label className="configOption">
// 					<div>
// 						<input
// 							type="checkbox"
// 							checked={currentConfig.data}
// 							onChange={(e) => {
// 								if (e.target instanceof HTMLInputElement) {
// 									onConfigChange('data', e.target.checked);
// 								}
// 							}}
// 						/>
// 						<span className="optionIcon"> Data</span>
// 					</div>
// 				</label>

// 				<label className="configOption">
// 					<div>
// 						<input
// 							type="checkbox"
// 							checked={currentConfig.operators}
// 							onChange={(e) => {
// 								if (e.target instanceof HTMLInputElement) {
// 									onConfigChange(
// 										'operators',
// 										e.target.checked
// 									);
// 								}
// 							}}
// 						/>
// 						<span className="optionIcon"> Operators</span>
// 					</div>
// 				</label>

// 				<label className="configOption">
// 					<div>
// 						<input
// 							type="checkbox"
// 							checked={currentConfig.controlFlow}
// 							onChange={(e) => {
// 								if (e.target instanceof HTMLInputElement) {
// 									onConfigChange(
// 										'controlFlow',
// 										e.target.checked
// 									);
// 								}
// 							}}
// 						/>
// 						<span className="optionIcon"> Control Flow</span>
// 					</div>
// 				</label>

// 				<label className="configOption">
// 					<div>
// 						<input
// 							type="checkbox"
// 							checked={currentConfig.functions}
// 							onChange={(e) => {
// 								if (e.target instanceof HTMLInputElement) {
// 									onConfigChange(
// 										'functions',
// 										e.target.checked
// 									);
// 								}
// 							}}
// 						/>
// 						<span className="optionIcon"> Functions</span>
// 					</div>
// 				</label>
// 			</div>

// 			<div className="configSection">
// 				<br />
// 				<div className="configSectionTitle">Special Options:</div>

// 				<label className="configOption">
// 					<div>
// 						<input
// 							type="checkbox"
// 							checked={currentConfig.alertQuestions}
// 							onChange={(e) => {
// 								if (e.target instanceof HTMLInputElement) {
// 									onConfigChange(
// 										'alertQuestions',
// 										e.target.checked
// 									);
// 								}
// 							}}
// 						/>
// 						<span className="optionIcon"> Alert Questions</span>
// 					</div>
// 				</label>

// 				<label className="configOption">
// 					<div>
// 						<input
// 							type="checkbox"
// 							checked={currentConfig.multipleChoice}
// 							onChange={(e) => {
// 								if (e.target instanceof HTMLInputElement) {
// 									onConfigChange(
// 										'multipleChoice',
// 										e.target.checked
// 									);
// 								}
// 							}}
// 						/>
// 						<span className="optionIcon"> Multiple Choice</span>
// 					</div>
// 				</label>

// 				<label className="configOption">
// 					<div>
// 						<input
// 							type="checkbox"
// 							checked={currentConfig.showAnswerHints}
// 							onChange={(e) => {
// 								if (e.target instanceof HTMLInputElement) {
// 									onConfigChange(
// 										'showAnswerHints',
// 										e.target.checked
// 									);
// 								}
// 							}}
// 						/>
// 						<span className="optionIcon"> Show Answer Hints</span>
// 					</div>
// 				</label>
// 			</div>
// 		</>
// 	);
// };
