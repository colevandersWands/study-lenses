export default [
	{
		languageOptions: {
			ecmaVersion: 2020,
			sourceType: 'module',
			globals: {
				window: 'readonly',
				document: 'readonly',
				console: 'readonly',
			},
		},
		rules: {
			'no-unused-vars': 'warn',
			'no-undef': 'error',
		},
		ignores: ['node_modules/**', 'dist/**', 'public/**'],
	},
];
