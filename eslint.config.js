import { fileURLToPath } from 'node:url';
import globals from 'globals';
import eslint from '@eslint/js';
import { includeIgnoreFile } from '@eslint/compat';
import { defineConfig } from 'eslint/config';
import svelte from 'eslint-plugin-svelte';
import ts from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

const gitignorePath = fileURLToPath(new URL('.gitignore', import.meta.url));

/** @type { import('eslint').Linter.Config[] } */
export default defineConfig([
	eslint.configs.recommended,
	ts.configs.recommended,
	prettier,
	...svelte.configs['flat/recommended'],
	{
		files: ['**/*.svelte', '**/*.svelte.js', '**/*.svelte.ts'],
		languageOptions: {
			parserOptions: {
				parser: ts.parser,
				extraFileExtensions: ['.svelte'],
			},
		},
		rules: {
			'no-undef': 'off',
		},
	},
	includeIgnoreFile(gitignorePath, 'Imported .gitignore patterns'),
	{
		extends: [],
		settings: {},
		rules: {
			semi: ['error', 'always'],
			curly: ['error'],
			// JS files are typed with JSDoc, where `@ts-ignore` and `any` are sometimes needed.
			'@typescript-eslint/ban-ts-comment': 'off',
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
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
]);
