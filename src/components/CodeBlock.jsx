import { useEffect, useRef } from 'preact/hooks';
import { useColorize } from '../context/ColorizeContext.jsx';

/**
 * CodeBlock component that conditionally applies Prism.js syntax highlighting
 * based on the global colorize setting
 */
const CodeBlock = ({
	children,
	language = 'plaintext',
	className = '',
	style = {},
	...props
}) => {
	const { enableColorize } = useColorize();
	const codeRef = useRef(null);
	const preRef = useRef(null);

	useEffect(() => {
		if (enableColorize && preRef.current && window.Prism) {
			// Use highlightAllUnder approach for better plugin support (especially line-numbers)
			// This follows the same pattern as PrintLens
			window.Prism.highlightAllUnder(preRef.current);
		}
	}, [enableColorize, children]);

	const prismClass = enableColorize ? `language-${language}` : '';
	const preClassNameFinal = `${prismClass} ${className}`.trim();

	return (
		<pre ref={preRef} className={preClassNameFinal} style={style} {...props}>
			<code ref={codeRef}>
				{children}
			</code>
		</pre>
	);
};

/**
 * Simple code span for inline code
 */
export const InlineCode = ({
	children,
	language = 'plaintext',
	className = '',
	...props
}) => {
	const { enableColorize } = useColorize();
	const codeRef = useRef(null);

	useEffect(() => {
		if (enableColorize && codeRef.current && window.Prism) {
			window.Prism.highlightElement(codeRef.current);
		}
	}, [enableColorize, children]);

	const prismClass = enableColorize ? `language-${language}` : '';
	const combinedClassName = `${prismClass} ${className}`.trim();

	return (
		<code ref={codeRef} className={combinedClassName} {...props}>
			{children}
		</code>
	);
};

export default CodeBlock;
