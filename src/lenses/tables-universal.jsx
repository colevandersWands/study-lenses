/**
 * Universal Tables Plugin for StudyButton
 *
 * Provides manual trace table functionality using wc-trace-table web components.
 * Works with any executable code language.
 */

import { deepFreeze } from '../utils/deepFreeze.js';

// Tables universal lens - unified interface
export const id = 'tables-universal';
export const label = 'Trace Table';

/**
 * Check if this plugin is applicable to the given file
 * @param {Object} file - File object with properties like lang, content, etc.
 * @returns {boolean} True if plugin should be available for this file
 */
export const applicable = (file) => {
	if (!file) return false;
	if (file.ext === '.qasm') return false;

	// Support executable code files (exclude static files like images, PDFs, etc.)
	const executableExtensions = [
		'.js',
		'.jsx',
		'.ts',
		'.tsx', // JavaScript
		'.py', // Python
		'.html',
		'.htm', // HTML (has executable potential)
		'.css', // CSS (for learning purposes)
	];

	if (file.lang && executableExtensions.includes(file.lang)) {
		return true;
	}

	// Also support files that look like code (have substantial content)
	if (file.content && file.content.trim().length > 10) {
		return true;
	}

	return false;
};

/**
 * Execute the plugin functionality
 * @param {string} code - Code (not used for tables, but kept for interface consistency)
 * @param {Object} config - Plugin configuration
 * @returns {Promise} Execution result
 */
export const execute = async (file, _config = {}) => {
	// const finalConfig = { ...config, ..._config };
	const code = file.content;

	try {
		// Clear any existing trace tables
		document
			.querySelectorAll('trace-table')
			.forEach((table) => table.remove());

		// Create new table using proper Web Component API
		const traceTable = document.createElement('trace-table');

		// Set attributes based on table type
		// if (finalConfig.tableType === 'steps') {
		traceTable.setAttribute('steps', '');
		// } else if (finalConfig.tableType === 'operators') {
		// 	traceTable.setAttribute('operators', '');
		// }
		// Values table is default, no attribute needed

		document.body.appendChild(traceTable);
	} catch (error) {
		console.error('Error creating trace table:', error);
		throw error;
	}
};

// /**
//  * Render configuration UI for this plugin as checkbox-style table selection
//  * @param {Object} currentConfig - Current configuration values
//  * @param {Function} onConfigChange - Callback for configuration changes
//  * @param {Function} onNestedConfigChange - Callback for nested configuration changes
//  * @returns {JSX.Element} Configuration UI component
//  */
// export const renderConfig = (
// 	currentConfig,
// 	onConfigChange,
// 	onNestedConfigChange
// ) => {
// 	const tableOptions = [
// 		{
// 			key: 'values',
// 			icon: '📊',
// 			label: 'Values Table',
// 			description: 'Track variable values line by line',
// 		},
// 		{
// 			key: 'steps',
// 			icon: '👣',
// 			label: 'Steps Table',
// 			description: 'Record execution steps and actions',
// 		},
// 		{
// 			key: 'operators',
// 			icon: '⚙️',
// 			label: 'Operators Table',
// 			description: 'Analyze operators and expressions',
// 		},
// 	];

// 	return (
// 		<div className="configSection">
// 			<div className="configSectionTitle">Select Table Type:</div>
// 			{tableOptions.map((option) => (
// 				<label key={option.key} className="configOption">
// 					<div>
// 						<input
// 							type="radio"
// 							name="tableType"
// 							checked={currentConfig.tableType === option.key}
// 							onChange={() =>
// 								onConfigChange('tableType', option.key)
// 							}
// 						/>
// 						<span className="optionIcon"> {option.label}</span>
// 					</div>
// 				</label>
// 			))}
// 		</div>
// 	);
// };
