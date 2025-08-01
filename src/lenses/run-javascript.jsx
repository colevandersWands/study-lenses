/**
 * JavaScript Execution Plugin for StudyButton
 *
 * Handles execution of JavaScript, HTML, and CSS code in isolated iframes
 * with optional loop guards, debugging, and testing framework support.
 */

import { executeJavaScript } from '../utils/execution/run-javascript.js';

// Run JavaScript lens - unified interface
export const id = 'run-javascript';
export const label = 'Run';

/**
 * Check if this plugin is applicable to the given file
 * @param {Object} file - File object with properties like lang, content, etc.
 * @returns {boolean} True if plugin should be available for this file
 */
export const applicable = (file) => {
	if (!file) return false;
	if (file.lang === 'javascript') return true;
	return false;
};

const container = document.createElement('div');
container.style.display = 'none';
document.body.appendChild(container);
/**
 * Execute the plugin functionality
 * @param {Object} file - File object with content and metadata
 * @param {Object} config - Plugin configuration
 * @returns {Promise} Execution result
 */
export const execute = async (file) =>
	executeJavaScript(
		file.content,
		{ type: file.ext === '.mjs' ? 'module' : 'script' },
		container
	);

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
// 	const loopGuardOptions = [
// 		{ key: 'off', label: 'none', max: 0 },
// 		{ key: 'low', label: '100 iterations', max: 100 },
// 		{ key: 'medium', label: '1000 iterations', max: 1000 },
// 		{ key: 'high', label: '10000 iterations', max: 10000 },
// 	];

// 	const currentLoopGuardKey = !currentConfig.loopGuard?.active
// 		? 'off'
// 		: currentConfig.loopGuard.max <= 100
// 			? 'low'
// 			: currentConfig.loopGuard.max <= 1000
// 				? 'medium'
// 				: 'high';

// 	return (
// 		<>
// 			<div className="configSection">
// 				<br />
// 				<div className="configSectionTitle">Execution Options:</div>

// 				<label className="configOption">
// 					<div>
// 						<input
// 							type="checkbox"
// 							checked={currentConfig.debug}
// 							onChange={(e) => {
// 								if (e.target instanceof HTMLInputElement) {
// 									onConfigChange('debug', e.target.checked);
// 								}
// 							}}
// 						/>
// 						<span className="optionIcon"> Debugger</span>
// 					</div>
// 				</label>

// 				<label className="configOption">
// 					<div>
// 						<input
// 							type="checkbox"
// 							checked={currentConfig.type === 'module'}
// 							onChange={(e) => {
// 								if (e.target instanceof HTMLInputElement) {
// 									onConfigChange(
// 										'type',
// 										e.target.checked ? 'module' : 'script'
// 									);
// 								}
// 							}}
// 						/>
// 						<span className="optionIcon"> ES Module</span>
// 					</div>
// 				</label>

// 				<label className="configOption">
// 					<div>
// 						<input
// 							type="checkbox"
// 							checked={currentConfig.testing}
// 							onChange={(e) => {
// 								if (e.target instanceof HTMLInputElement) {
// 									onConfigChange('testing', e.target.checked);
// 								}
// 							}}
// 						/>
// 						<span className="optionIcon"> Unit Tests</span>
// 					</div>
// 				</label>
// 			</div>

// 			<div className="configSection">
// 				<br />
// 				<div className="configSectionTitle">Loop Guards:</div>
// 				{loopGuardOptions.map((option) => (
// 					<label key={option.key} className="configOption">
// 						<input
// 							type="radio"
// 							name="loopGuard"
// 							checked={currentLoopGuardKey === option.key}
// 							onChange={() => {
// 								if (option.key === 'off') {
// 									onNestedConfigChange(
// 										'loopGuard',
// 										'active',
// 										false
// 									);
// 								} else {
// 									onNestedConfigChange(
// 										'loopGuard',
// 										'active',
// 										true
// 									);
// 									onNestedConfigChange(
// 										'loopGuard',
// 										'max',
// 										option.max
// 									);
// 								}
// 							}}
// 						/>
// 						<span className="optionIcon"> {option.label}</span>
// 						<br />
// 					</label>
// 				))}
// 			</div>
// 		</>
// 	);
// };
