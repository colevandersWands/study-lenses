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
	// const { enableColorize } = useColorize();
	const enableColorize = true;
	const codeRef = useRef(null);

	useEffect(() => {
		if (enableColorize && codeRef.current && window.Prism) {
			console.log('🔍 CodeBlock: About to call Prism.highlightElement');
			console.log('🔍 Code element:', codeRef.current);
			console.log('🔍 Code element classes:', codeRef.current.className);
			console.log('🔍 Parent element classes:', codeRef.current.parentElement?.className);
			
			// Add a temporary hook listener to see if complete fires
			const tempHook = (env) => {
				console.log('🔍 Prism complete hook fired!', env);
				console.log('🔍 Element after highlighting:', env.element);
				console.log('🔍 Element classes:', env.element.className);
				console.log('🔍 Parent element:', env.element.parentElement);
				console.log('🔍 Parent classes:', env.element.parentElement?.className);
				console.log('🔍 Looking for .line-numbers-rows:', env.element.parentElement?.querySelector('.line-numbers-rows'));
			};
			
			// Add temporary hook
			if (window.Prism?.hooks) {
				window.Prism.hooks.add('complete', tempHook);
			}
			
			// Apply Prism highlighting - original simple approach
			window.Prism.highlightElement(codeRef.current);
			
			// Remove temporary hook after a delay
			setTimeout(() => {
				if (window.Prism?.hooks) {
					window.Prism.hooks.remove('complete', tempHook);
				}
			}, 1000);
		}
	}, [enableColorize, children]);

	const prismClass = enableColorize ? `language-${language}` : '';
	const combinedClassName = `${prismClass} ${className}`.trim();

	return (
		<pre className={className} style={style} {...props}>
			<code ref={codeRef} className={combinedClassName}>
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
