import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import * as path from 'path';

export default defineConfig({
	plugins: [sveltekit()],
	resolve: {
		alias: {
			yjs: path.resolve('./node_modules/yjs/dist/yjs.mjs'),
			'@lexical/yjs': path.resolve('./node_modules/@lexical/yjs/LexicalYjs.mjs')
		},
	},
});
