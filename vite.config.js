import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import path from 'path';
import tailwindcss from '@tailwindcss/vite';

// vite needs to work on proper support for Node.js worker_threads...
import modulePathPlugin from './modulePathPlugin';

export default defineConfig({
	plugins: [tailwindcss(), modulePathPlugin(), sveltekit()],
	optimizeDeps: {
		exclude: ['yjs'],
	},
	resolve: {
		dedupe: ['yjs', '@y/y'],
		alias: {
			yjs: path.resolve('./node_modules/yjs/dist/yjs.mjs'),
		},
	},
	ssr: {
		noExternal: ['@lexical/yjs'],
	},
	test: {
		projects: [
			{
				extends: true,
				test: {
					name: 'server',
					include: ['src/**/*.test.ts'],
					exclude: ['src/**/*.svelte.test.ts', 'src/**/timing.test.ts'],
					// Same DOM the toHTML worker uses.
					environment: 'jsdom',
				},
			},
			{
				extends: true,
				test: {
					name: 'timing',
					include: ['src/**/timing.test.ts'],
					environment: 'jsdom',
					fileParallelism: false,
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
