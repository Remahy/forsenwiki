import eslint from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

/** @type { import('eslint').Linter.Config[] } */
export default [
	eslint.configs.recommended,
	prettier,
	...svelte.configs['flat/recommended'],
	{
		rules: {
			semi: ['error', 'always'],
			curly: ['error'],
		},
		languageOptions: {
			sourceType: 'module',
			ecmaVersion: 2022,
			globals: {
				...globals.browser,
				...globals.node,
				...globals.es2021,
			},
		},
		ignores: [
			'.DS_Store',
			'node_modules',
			'/build',
			'/.svelte-kit',
			'/package',
			'.env',
			'.env.*',
			'!.env.example',
			'pnpm-lock.yaml',
			'package-lock.json',
			'yarn.lock',
		],
	},
];
