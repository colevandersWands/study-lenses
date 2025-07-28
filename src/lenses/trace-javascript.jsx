/**
 * JavaScript Trace Plugin for StudyButton
 *
 * Integrates with SL1 trace system to provide code execution tracing
 * functionality with configurable trace options.
 */

import { deepFreeze } from '../utils/deepFreeze.js';

// Trace JavaScript lens - unified interface
export const id = 'trace-javascript';
export const label = 'Trace Log';

// Plugin configuration with deep freezing
export const config = deepFreeze({
	variables: true,
	variablesDeclare: true,
	variablesRead: true,
	variablesAssign: true,
	operators: false,
	operatorsList: '',
	controlFlow: false,
	controlFlowList: '',
	functions: true,
	functionsList: '',
	this: true,
	lines: true,
	steps: true,
	console: true,
});

/**
 * Check if this plugin is applicable to the given file
 * @param {Object} file - File object with properties like lang, content, etc.
 * @returns {boolean} True if plugin should be available for this file
 */
export const applicable = (file) => {
	if (!file) return false;

	// Only support JavaScript languages for tracing using language names (not extensions)
	const supportedLanguages = ['javascript', 'typescript'];

	if (file.lang && supportedLanguages.includes(file.lang)) {
		return true;
	}

	// Don't support HTML/CSS for tracing as SL1 trace system is JS-specific
	return false;
};

/**
 * Execute the plugin functionality
 * @param {Object} file - File object with content and metadata
 * @param {Object} config - Plugin configuration
 * @returns {Promise} Execution result
 */
export const execute = async (file, _config = {}) => {
	const code = file.content;

	if (!code?.trim()) {
		console.warn('No code to trace');
		return;
	}

	try {
		// Set up trace configuration globally if available
		if (!window.traceConfig) {
			window.traceConfig = config;
		}

		// Check if trace system is available
		if (window.trace && typeof window.trace === 'function') {
			// Use SL1's trace function directly
			window.trace(code);
		} else {
			// Try to load trace system
			const traceSystemReady = await ensureTraceSystemLoaded();

			if (traceSystemReady && window.trace) {
				// Retry tracing
				window.trace(code);
			} else {
				console.error('❌ SL1 trace system failed to load');
				throw new Error(
					'SL1 trace system not available. Check console for loading errors.'
				);
			}
		}
	} catch (error) {
		console.error('Trace plugin execution error:', error);
		throw error;
	}
};

/**
 * Ensure SL1 trace system is loaded
 * @returns {Promise<boolean>} True if trace system is ready
 */
const ensureTraceSystemLoaded = () => {
	return new Promise((resolve) => {
		if (window.trace && typeof window.trace === 'function') {
			resolve(true);
			return;
		}

		// Check if trace loader is available
		if (
			window.loadTraceSystem &&
			typeof window.loadTraceSystem === 'function'
		) {
			// Use the custom loader
			window.loadTraceSystem().then(resolve);
			return;
		}

		// Fallback: wait for system to load
		let attempts = 0;
		const maxAttempts = 15; // Give more time

		const checkAgain = () => {
			attempts++;
			if (window.trace && typeof window.trace === 'function') {
				resolve(true);
			} else if (window.traceSystemError) {
				console.error(
					'Trace system failed to load:',
					window.traceSystemError
				);
				resolve(false);
			} else if (attempts < maxAttempts) {
				setTimeout(checkAgain, 300);
			} else {
				console.error('SL1 trace system not available after waiting');
				resolve(false);
			}
		};

		setTimeout(checkAgain, 100);
	});
};

// /**
//  * Render configuration UI for this plugin
//  * @param {Object} currentConfig - Current configuration values
//  * @param {Function} onConfigChange - Callback for configuration changes
//  * @param {Function} onNestedConfigChange - Callback for nested configuration changes (unused for trace)
//  * @returns {JSX.Element} Configuration UI component
//  */
// export const renderConfig = (
// 	currentConfig,
// 	onConfigChange,
// 	onNestedConfigChange
// ) => {
// 	return (
// 		<>
// 			<div className="configSection">
// 				<div className="configSectionTitle">Variable Tracking:</div>

// 				{/* <label className="configOption">
//             <input
//               type="checkbox"
//               checked={currentConfig.variables}
//               onChange={(e) => onConfigChange('variables', e.target.checked)}
//             />
//             <div>
//               <span className="optionIcon">Variable 📊</span>
//             </div>
//             <div>
//               <div className="optionLabel">Variables</div>
//               <div className="optionDescription">Track all variable operations</div>
//             </div>
//           </label> */}

// 				<label className="configOption">
// 					<div>
// 						<input
// 							type="checkbox"
// 							checked={currentConfig.variablesDeclare}
// 							onChange={(e) => {
// 								if (e.target instanceof HTMLInputElement) {
// 									onConfigChange(
// 										'variablesDeclare',
// 										e.target.checked
// 									);
// 								}
// 							}}
// 						/>
// 						<span className="optionIcon">
// 							Variable Declarations
// 						</span>
// 					</div>
// 				</label>

// 				<label className="configOption">
// 					<div>
// 						<input
// 							type="checkbox"
// 							checked={currentConfig.variablesAssign}
// 							onChange={(e) => {
// 								if (e.target instanceof HTMLInputElement) {
// 									onConfigChange(
// 										'variablesAssign',
// 										e.target.checked
// 									);
// 								}
// 							}}
// 						/>
// 						<span className="optionIcon">Variable Assignments</span>
// 					</div>
// 				</label>

// 				<label className="configOption">
// 					<div>
// 						<input
// 							type="checkbox"
// 							checked={currentConfig.variablesRead}
// 							onChange={(e) => {
// 								if (e.target instanceof HTMLInputElement) {
// 									onConfigChange(
// 										'variablesRead',
// 										e.target.checked
// 									);
// 								}
// 							}}
// 						/>
// 						<span className="optionIcon">Variable Reads</span>
// 					</div>
// 				</label>
// 			</div>

// 			<div className="configSection">
// 				<br />
// 				<div className="configSectionTitle">Code Analysis:</div>

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
// 						<span className="optionIcon">Operators</span>
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
// 						<span className="optionIcon">Control Flow</span>
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
// 						<span className="optionIcon">Function Calls</span>
// 					</div>
// 				</label>

// 				<label className="configOption">
// 					<div>
// 						<input
// 							type="checkbox"
// 							checked={currentConfig.this}
// 							onChange={(e) => {
// 								if (e.target instanceof HTMLInputElement) {
// 									onConfigChange('this', e.target.checked);
// 								}
// 							}}
// 						/>
// 						<span className="optionIcon">
// 							<code>this</code>
// 						</span>
// 					</div>
// 				</label>
// 			</div>

// 			<div className="configSection">
// 				<br />
// 				<div className="configSectionTitle">Display Options:</div>

// 				<label className="configOption">
// 					<div>
// 						<input
// 							type="checkbox"
// 							checked={currentConfig.lines}
// 							onChange={(e) => {
// 								if (e.target instanceof HTMLInputElement) {
// 									onConfigChange('lines', e.target.checked);
// 								}
// 							}}
// 						/>
// 						<span className="optionIcon">Line Numbers</span>
// 					</div>
// 				</label>

// 				<label className="configOption">
// 					<div>
// 						<input
// 							type="checkbox"
// 							checked={currentConfig.steps}
// 							onChange={(e) => {
// 								if (e.target instanceof HTMLInputElement) {
// 									onConfigChange('steps', e.target.checked);
// 								}
// 							}}
// 						/>
// 						<span className="optionIcon">Step Numbers</span>
// 					</div>
// 				</label>

// 				<label className="configOption">
// 					<div>
// 						<input
// 							type="checkbox"
// 							checked={currentConfig.console}
// 							onChange={(e) => {
// 								if (e.target instanceof HTMLInputElement) {
// 									onConfigChange('console', e.target.checked);
// 								}
// 							}}
// 						/>
// 						<span className="optionIcon">Console Output</span>
// 					</div>
// 				</label>
// 			</div>
// 		</>
// 	);
// };
