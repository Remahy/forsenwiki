import { fileURLToPath } from 'node:url';
import globals from 'globals';
import eslint from '@eslint/js';
import { includeIgnoreFile } from '@eslint/compat';
import { defineConfig } from 'eslint/config';
import svelte from 'eslint-plugin-svelte';
import prettier from 'eslint-config-prettier';
import eslintPluginBetterTailwindcss from 'eslint-plugin-better-tailwindcss';

const gitignorePath = fileURLToPath(new URL('.gitignore', import.meta.url));

/** @type { import('eslint').Linter.Config[] } */
export default defineConfig([
	eslint.configs.recommended,
	prettier,
	...svelte.configs['flat/recommended'],
	includeIgnoreFile(gitignorePath, 'Imported .gitignore patterns'),
	{
		extends: [eslintPluginBetterTailwindcss.configs.recommended],
		settings: {
			'better-tailwindcss': {
				entryPoint: 'src/app.css',
			},
		},
		rules: {
			'better-tailwindcss/enforce-consistent-line-wrapping': [
				'warn',
				{
					indent: 'tab',
					strictness: 'loose',
				},
			],
			'better-tailwindcss/no-unknown-classes': ['off'],
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
