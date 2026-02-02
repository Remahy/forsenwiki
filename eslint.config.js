import eslint from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import { defineConfig } from 'eslint/config';
import { includeIgnoreFile } from '@eslint/compat';
import { fileURLToPath } from 'node:url';

const gitignorePath = fileURLToPath(new URL('.gitignore', import.meta.url));

/** @type { import('eslint').Linter.Config[] } */
export default defineConfig([
	eslint.configs.recommended,
	prettier,
	...svelte.configs['flat/recommended'],
	includeIgnoreFile(gitignorePath, 'Imported .gitignore patterns'),
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
]);
