import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import * as path from 'path';

export default defineConfig({
	plugins: [sveltekit()],
	resolve: {
		alias: {
			yjs: path.resolve('./node_modules/yjs/dist/yjs.mjs'),
			'@lexical/yjs': path.resolve('./node_modules/@lexical/yjs/LexicalYjs.mjs'),
			'@lexical/rich-text': path.resolve('./node_modules/@lexical/rich-text/LexicalRichText.mjs'),
			'@lexical/link': path.resolve('./node_modules/@lexical/link/LexicalLink.mjs'),
			'@lexical/list': path.resolve('./node_modules/@lexical/list/LexicalList.mjs'),
			'@lexical/mark': path.resolve('./node_modules/@lexical/mark/LexicalMark.mjs'),
			'@lexical/selection': path.resolve('./node_modules/@lexical/selection/LexicalSelection.mjs'),
			'@lexical/table': path.resolve('./node_modules/@lexical/table/LexicalTable.mjs'),
		},
	},
});
