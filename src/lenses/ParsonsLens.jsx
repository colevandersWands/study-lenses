import { useState, useEffect, useRef, useCallback } from 'preact/hooks';
import CodeBlock from '../components/CodeBlock.jsx';
import { useApp } from '../context/AppContext.jsx';
import { deepFreeze } from '../utils/deepFreeze.js';
import styles from './ParsonsLens.module.css';

/**
 * ParsonsLens - Drag-and-drop code assembly exercise using iframe
 * Students arrange code blocks in correct order to understand program structure
 * Uses an iframe to embed the standalone parsons implementation
 */
const ParsonsLens = ({ resource }) => {
	const fileName = resource?.name || '';
	const { currentFile } = useApp();

	// Get current content from enliven file
	const code = currentFile?.content || '';
	const iframeRef = useRef(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState(null);
	const [iframeHeight] = useState(600);

	// Build iframe URL with encoded code
	const buildIframeUrl = useCallback(() => {
		if (!code.trim()) return null;

		try {
			const encodedCode = encodeURIComponent(code);
			const encodedFileName = encodeURIComponent(fileName);
			return `./parsons-iframe.html?code=${encodedCode}&file=${encodedFileName}`;
		} catch (error) {
			console.error('Error encoding code for iframe:', error);
			setError('Failed to encode code for parsons exercise');
			return null;
		}
	}, [code, fileName]);

	// Handle iframe load
	const handleIframeLoad = useCallback(() => {
		setIsLoading(false);
		setError(null);
	}, []);

	// Handle iframe error
	const handleIframeError = useCallback(() => {
		setIsLoading(false);
		setError('Failed to load parsons exercise');
	}, []);

	// Fallback component for when iframe fails or code is empty
	const FallbackComponent = () => (
		<div className={styles.fallbackContainer}>
			<h4>🧩 Parsons Exercise: {fileName}</h4>
			<p>
				{error
					? `Error: ${error}`
					: code.trim()
						? 'Parsons exercise is loading...'
						: 'No code available for this exercise'}
			</p>
			{code.trim() && (
				<>
					<p>Here's the original code:</p>
					<CodeBlock language={resource.lang}>{code}</CodeBlock>
				</>
			)}
		</div>
	);

	// Get iframe URL
	const iframeUrl = buildIframeUrl();

	// Show fallback if no code or URL generation failed
	if (!code.trim() || !iframeUrl) {
		return (
			<div className={styles.parsonsLens}>
				<div className={styles.header}>
					<h3>🧩 Parsons Problem</h3>
					<div className={styles.fileName}>{fileName}</div>
					<button onClick={() => window.open(iframeUrl, '_blank')}>
						Open in new tab.
					</button>
				</div>
				<FallbackComponent />
			</div>
		);
	}

	return (
		<div className={styles.parsonsLens}>
			<div className={styles.header}>
				<h3>🧩 Parsons Problem</h3>
				<div className={styles.fileName}>{fileName}</div>
				<button onClick={() => window.open(iframeUrl, '_blank')}>
					Open in new tab.
				</button>
			</div>

			<div className={styles.iframeContainer}>
				{isLoading && (
					<div className={styles.loadingContainer}>
						<h4>🧩 Loading Parsons Exercise...</h4>
						<p>Setting up the interactive puzzle...</p>
					</div>
				)}

				{error && (
					<div className={styles.errorContainer}>
						<h4>❌ Error Loading Exercise</h4>
						<p>{error}</p>
						<button
							onClick={() => {
								setError(null);
								setIsLoading(true);
								if (iframeRef.current) {
									iframeRef.current.src = iframeUrl;
								}
							}}
							className={styles.retryButton}
						>
							🔄 Retry
						</button>
					</div>
				)}

				<iframe
					ref={iframeRef}
					src={iframeUrl}
					className={styles.parsonsIframe}
					style={{
						height: `${iframeHeight}px`,
						display: isLoading || error ? 'none' : 'block',
					}}
					onLoad={handleIframeLoad}
					onError={handleIframeError}
					title={`Parsons Exercise: ${fileName}`}
					// sandbox="allow-scripts allow-same-origin"
				/>
			</div>

			<div className={styles.instructions}>
				<h4>📚 How to Use</h4>
				<ul>
					<li>
						<strong>Drag</strong> code blocks from the left panel to
						the solution area
					</li>
					<li>
						<strong>Arrange</strong> blocks in the correct logical
						order
					</li>
					<li>
						<strong>Get Feedback</strong> to check your solution and
						see errors
					</li>
					<li>
						<strong>New Instance</strong> to shuffle blocks and try
						again
					</li>
					<li>
						<strong>Review Guesses</strong> to see your previous
						attempts
					</li>
				</ul>
			</div>
		</div>
	);
};

// Parsons lens - unified interface
export const id = 'parsons';
export const label = 'Parsons';
export const applicable = (file) => true; // Always applicable
export const render = (resource, _config) => {
	const finalConfig = { ...config, ..._config };
	return <ParsonsLens resource={resource} config={finalConfig} />;
};
export const config = deepFreeze({});
export const renderConfig = () => null; // No configuration UI needed

export default ParsonsLens;
