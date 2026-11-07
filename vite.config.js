import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import path from 'path';
import tailwindcss from '@tailwindcss/vite';

// vite needs to work on proper support for Node.js worker_threads...
import modulePathPlugin from './modulePathPlugin';
import svelteLexicalCodePlugin from './svelteLexicalCodePlugin';

export default defineConfig({
	plugins: [tailwindcss(), modulePathPlugin(), svelteLexicalCodePlugin(), sveltekit()],
	server: {
		proxy: {
			'/usercontent': {
				target: 'http://localhost:5175/',
				rewrite: (path) => path.replace(/^\/usercontent/, ''),
			},
		},
	},
	optimizeDeps: {
		exclude: ['yjs'],
		// svelte-lexical gets pre-bundled in dev, which skips the regular plugins.
		rolldownOptions: {
			plugins: [svelteLexicalCodePlugin()],
		},
	},
	resolve: {
		dedupe: ['yjs'],
		alias: {
			yjs: path.resolve('./node_modules/yjs/dist/yjs.mjs'),
		},
	},
	test: {
		projects: [
			{
				extends: true,
				test: {
					name: 'server',
					include: ['src/**/*.test.ts'],
					exclude: ['src/**/*.svelte.test.ts'],
					// Same DOM the toHTML worker uses.
					environment: 'jsdom',
				},
			},
			{
				extends: true,
				// Mount components with Svelte's client build.
				resolve: { conditions: ['browser'] },
				test: {
					name: 'client',
					include: ['src/**/*.svelte.test.ts'],
					environment: 'jsdom',
				},
			},
		],
	},
});
