import { useState, useRef, useEffect, useCallback } from 'preact/hooks';
import { getLens as getPlugin, getApplicableLenses as getApplicablePlugins } from '../lenses/index.js';
import URLManager from '../utils/urlManager.js';
import styles from './StudyButton.module.css';

/**
 * StudyButton - Unified study button component using plugin architecture
 * Delegates functionality to specific plugins based on type
 */
const StudyButton = ({
	type, // plugin ID - 'run-javascript' | 'trace-javascript' | 'ask-javascript' | 'tables-universal'
	getCode, // () => string - function to get current code
	getFile = null, // () => object - function to get current file object
	variant = 'full', // 'compact' | 'full' | 'icon-only'
	showConfig = false, // boolean - show config dropdown
	config = {}, // button-specific configuration object
	onConfigChange = null, // (newConfig) => void
	persistConfig = true, // boolean - persist config to URL
	configKey = null, // string - custom key for URL persistence (defaults to type)
	onCustomAction = null, // (type, code) => void - custom action handler for specific buttons
	className = '',
	disabled = false,
	...buttonProps
}) => {
	// Button state
	const [isExecuting, setIsExecuting] = useState(false);
	const [showConfigPanel, setShowConfigPanel] = useState(false);
	const [urlConfig, setUrlConfig] = useState({});
	const [buttonPosition, setButtonPosition] = useState({
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		width: 0,
		height: 0,
	});
	const [dragState, setDragState] = useState({
		isDragging: false,
		dragOffset: { x: 0, y: 0 },
		startPos: { x: 0, y: 0 },
	});
// 	console.log(showConfig, type);

	// Refs
	const executionContainerRef = useRef(null);
	const configButtonRef = useRef(null);

	// Get plugin instance
	const plugin = getPlugin(type);

	// Get the key used for URL persistence
	const getConfigKey = useCallback(() => {
		return configKey || `study_${type}`;
	}, [configKey, type]);

	// Get default config from plugin
	const getDefaultConfig = useCallback(() => {
		return plugin?.config || {};
	}, [plugin]);

	// Load configuration from URL on mount
	useEffect(() => {
		if (persistConfig) {
			const savedConfig = URLManager.getLensConfig(getConfigKey());
			if (savedConfig) {
				try {
					// Parse the configuration string (format: key1:value1,key2:value2)
					const parsedConfig = parseConfigString(savedConfig);
					setUrlConfig(parsedConfig);
				} catch (error) {
					console.warn(
						'Failed to parse URL config for',
						getConfigKey(),
						':',
						error
					);
				}
			}
		}
	}, [persistConfig, getConfigKey]);

	// Listen for URL changes to update configuration
	useEffect(() => {
		if (!persistConfig) return;

		const handleHashChange = () => {
			const savedConfig = URLManager.getLensConfig(getConfigKey());
			if (savedConfig) {
				try {
					const parsedConfig = parseConfigString(savedConfig);
					setUrlConfig(parsedConfig);
				} catch (error) {
					console.warn(
						'Failed to parse URL config from hash change:',
						error
					);
				}
			} else {
				setUrlConfig({});
			}
		};

		window.addEventListener('hashchange', handleHashChange);
		return () => window.removeEventListener('hashchange', handleHashChange);
	}, [persistConfig, getConfigKey]);

	// Calculate button position when dropdown opens
	useEffect(() => {
		if (showConfigPanel && configButtonRef.current) {
			const rect = configButtonRef.current.getBoundingClientRect();
			setButtonPosition({
				top: rect.top,
				left: rect.left,
				right: rect.right,
				bottom: rect.bottom,
				width: rect.width,
				height: rect.height,
			});
			// Reset drag state when opening new panel
			setDragState({
				isDragging: false,
				dragOffset: { x: 0, y: 0 },
				startPos: { x: 0, y: 0 },
			});
		}
	}, [showConfigPanel]);

	// Mouse event handlers for dragging
	const handleMouseDown = useCallback((e) => {
		e.preventDefault(); // Prevent default drag behavior
		e.stopPropagation(); // Stop event from bubbling to overlay
		setDragState({
			isDragging: true,
			dragOffset: { x: 0, y: 0 },
			startPos: { x: e.clientX, y: e.clientY },
		});
	}, []);

	const handleMouseMove = useCallback(
		(e) => {
			if (dragState.isDragging) {
				setDragState((prev) => ({
					...prev,
					dragOffset: {
						x: e.clientX - prev.startPos.x,
						y: e.clientY - prev.startPos.y,
					},
				}));
			}
		},
		[dragState.isDragging]
	);

	const handleMouseUp = useCallback(() => {
		setDragState((prev) => ({ ...prev, isDragging: false }));
	}, []);

	// Add global mouse event listeners for smooth dragging
	useEffect(() => {
		if (dragState.isDragging) {
			document.addEventListener('mousemove', handleMouseMove);
			document.addEventListener('mouseup', handleMouseUp);
			return () => {
				document.removeEventListener('mousemove', handleMouseMove);
				document.removeEventListener('mouseup', handleMouseUp);
			};
		}
	}, [dragState.isDragging, handleMouseMove, handleMouseUp]);

	// Merge default config with provided config and URL config
	const currentConfig = {
		...getDefaultConfig(),
		...config,
		...urlConfig,
	};

	// Helper function to parse configuration string
	const parseConfigString = useCallback((configString) => {
		const config = {};
		if (!configString) return config;

		const pairs = configString.split(',');
		pairs.forEach((pair) => {
			const [key, value] = pair.split(':');
			if (key && value !== undefined) {
				// Parse boolean values
				if (value === 'true') {
					config[key] = true;
				} else if (value === 'false') {
					config[key] = false;
				} else if (!isNaN(value)) {
					// Parse numeric values
					config[key] = parseInt(value);
				} else {
					// String values
					config[key] = value;
				}
			}
		});

		return config;
	}, []);

	// Helper function to serialize configuration to string
	const serializeConfig = useCallback((config) => {
		const pairs = Object.entries(config)
			.filter(([key, value]) => value !== undefined && value !== null)
			.map(([key, value]) => `${key}:${value}`);
		return pairs.join(',');
	}, []);

	// Update URL with new configuration
	const updateURLConfig = useCallback(
		(newConfig) => {
			if (!persistConfig) return;

			const configString = serializeConfig(newConfig);
			if (configString) {
				URLManager.updateLensConfig(getConfigKey(), configString);
			} else {
				URLManager.updateLensConfig(getConfigKey(), null);
			}
		},
		[persistConfig, getConfigKey, serializeConfig]
	);

	// Get button info from plugin
	const buttonInfo = plugin?.config || {
		icon: '❓',
		label: 'Unknown',
		loadingLabel: 'Processing...',
		loadingIcon: '⏳',
	};

	// Handle configuration changes
	const handleConfigChange = useCallback(
		(key, value) => {
			const newConfig = {
				...currentConfig,
				[key]: value,
			};

			// Update URL if persistence is enabled
			if (persistConfig) {
				updateURLConfig(newConfig);
			}

			if (onConfigChange) {
				onConfigChange(newConfig);
			}
		},
		[currentConfig, onConfigChange, persistConfig, updateURLConfig]
	);

	// Handle nested configuration changes (e.g., loopGuard)
	const handleNestedConfigChange = useCallback(
		(parentKey, key, value) => {
			const newConfig = {
				...currentConfig,
				[parentKey]: {
					...currentConfig[parentKey],
					[key]: value,
				},
			};

			// Update URL if persistence is enabled
			if (persistConfig) {
				updateURLConfig(newConfig);
			}

			if (onConfigChange) {
				onConfigChange(newConfig);
			}
		},
		[currentConfig, onConfigChange, persistConfig, updateURLConfig]
	);

	// Execute button action using plugin
	const handleExecute = useCallback(async () => {
		if (!plugin) {
			console.warn(`No plugin found for type: ${type}`);
			return;
		}

		const code = getCode();
		const file = getFile ? getFile() : null;

		// Check if plugin needs code and we don't have any
		if (
			!code?.trim() &&
			type !== 'tables-universal' &&
			type !== 'ask-javascript'
		) {
			console.warn(`No code to execute for ${type}`);
			return;
		}

		setIsExecuting(true);

		try {
			// Use plugin's execute method
			await plugin.execute(code, currentConfig);
		} catch (error) {
			console.error(`Error executing plugin ${type}:`, error);
		} finally {
			setIsExecuting(false);
		}
	}, [plugin, getCode, getFile, type, currentConfig]);

	// Render button text based on variant
	const renderButtonContent = () => {
		const { icon, label, loadingIcon, loadingLabel } = buttonInfo;

		if (variant === 'text-only') {
			return isExecuting ? loadingLabel : label;
		}

		if (variant === 'embedded') {
			return isExecuting ? loadingLabel : label; // Text-only for embedded
		}

		if (variant === 'icon-only') {
			return isExecuting ? loadingIcon : icon;
		}

		if (variant === 'compact') {
			return isExecuting
				? `${loadingIcon} ${loadingLabel}`
				: `${icon} ${label}`;
		}

		// full variant
		return isExecuting
			? `${loadingIcon} ${loadingLabel}`
			: `${icon} ${label}`;
	};

	// Get current code for button state
	const hasCode = () => {
		try {
			const code = getCode();
			return code && code.trim().length > 0;
		} catch {
			return false;
		}
	};

	// Determine if button should be disabled
	const isDisabled =
		disabled ||
		isExecuting ||
		(type !== 'tables-universal' &&
			type !== 'ask-javascript' &&
			!hasCode());

	return (
		<div className={`${styles.studyButton} ${className}`}>
			<div className={styles.buttonContainer}>
				<button
					className={`${styles.button} ${styles[type.replace('-', '')]} ${styles[variant]}`}
					onClick={handleExecute}
					disabled={isDisabled}
					{...buttonProps}
				>
					{renderButtonContent()}
				</button>

				{showConfig && (
					<button
						ref={configButtonRef}
						className={`${styles.configButton} ${styles[variant]}`}
						onClick={() => setShowConfigPanel(!showConfigPanel)}
						title="Configuration options"
					>
						⚙️
					</button>
				)}
			</div>

			{/* Configuration Panel */}
			{showConfigPanel && showConfig && (
				<div className={styles.configOverlay}>
					<div
						className={`${styles.configDropdown} ${dragState.isDragging ? styles.dragging : ''}`}
						style={{
							position: 'fixed',
							top: '50%',
							left: '50%',
							transform: `translate(-50%, -50%) translate(${dragState.dragOffset.x}px, ${dragState.dragOffset.y}px)`,
						}}
						onClick={(e) => e.stopPropagation()}
					>
						<div
							className={styles.configHeader}
							onMouseDown={handleMouseDown}
						>
							<h3>{getConfigTitle()}</h3>
							<button
								className={styles.configClose}
								onClick={(e) => {
									e.stopPropagation();
									setShowConfigPanel(false);
								}}
								title="Close configuration"
							>
								×
							</button>
						</div>
						<div className={styles.configBody}>
							{renderConfigPanel()}
						</div>
					</div>
				</div>
			)}

			{/* Execution Container (for run output) */}
			{type === 'run-javascript' && (
				<div
					ref={executionContainerRef}
					className={styles.executionContainer}
				></div>
			)}
		</div>
	);

	// Get configuration title based on plugin type
	function getConfigTitle() {
		const titles = {
			'run-javascript': 'Run Configuration',
			'trace-javascript': 'Trace Configuration',
			'ask-javascript': 'Ask Configuration',
			'tables-universal': 'Select Tables to Display',
		};
		return titles[type] || 'Configuration';
	}

	// Render configuration panel using plugin
	function renderConfigPanel() {
		if (!plugin || !plugin.renderConfig) {
			return null;
		}

		return plugin.renderConfig(
			currentConfig,
			handleConfigChange,
			handleNestedConfigChange
		);
	}
};

export default StudyButton;
