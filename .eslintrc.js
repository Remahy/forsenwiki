/** @type { import("eslint").Linter.Config } */
export default {
	root: true,
	extends: ['eslint:recommended', 'plugin:svelte/recommended', 'prettier'],
	parserOptions: {
		sourceType: 'module',
		ecmaVersion: 2022,
		extraFileExtensions: ['.svelte']
	},
	env: {
		browser: true,
		es2022: true,
		node: true
	},
		ignorePatterns: [
		".DS_Store",
		"node_modules",
		"/build",
		"/.svelte-kit",
		"/package",
		".env",
		".env.*",
		"!.env.example",
		"pnpm-lock.yaml",
		"package-lock.json",
		"yarn.lock",
	]
};
