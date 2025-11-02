import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import path from 'path';
import tailwindcss from '@tailwindcss/vite';

// vite needs to work on proper support for Node.js worker_threads...
import modulePathPlugin from './modulePathPlugin';

export default defineConfig({
	plugins: [tailwindcss(), modulePathPlugin(), sveltekit()],
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
	},
	resolve: {
		alias: {
			yjs: path.resolve('./node_modules/yjs/dist/yjs.mjs'),
			'@lexical/yjs': path.resolve('./node_modules/@lexical/yjs/LexicalYjs.mjs'),
			'@lexical/clipboard': path.resolve('./node_modules/@lexical/clipboard/LexicalClipboard.mjs'),
			'@lexical/code': path.resolve('./node_modules/@lexical/code/LexicalCode.mjs'),
			'@lexical/file': path.resolve('./node_modules/@lexical/file/LexicalFile.mjs'),
			'@lexical/hashtag': path.resolve('./node_modules/@lexical/hashtag/LexicalHashtag.mjs'),
			'@lexical/history': path.resolve('./node_modules/@lexical/history/LexicalHistory.mjs'),
			'@lexical/html': path.resolve('./node_modules/@lexical/html/LexicalHtml.mjs'),
			'@lexical/link': path.resolve('./node_modules/@lexical/link/LexicalLink.mjs'),
			'@lexical/list': path.resolve('./node_modules/@lexical/list/LexicalList.mjs'),
			'@lexical/mark': path.resolve('./node_modules/@lexical/mark/LexicalMark.mjs'),
			'@lexical/overflow': path.resolve('./node_modules/@lexical/overflow/LexicalOverflow.mjs'),
			'@lexical/plain-text': path.resolve(
				'./node_modules/@lexical/plain-text/LexicalPlainText.mjs'
			),
			'@lexical/rich-text': path.resolve('./node_modules/@lexical/rich-text/LexicalRichText.mjs'),
			'@lexical/selection': path.resolve('./node_modules/@lexical/selection/LexicalSelection.mjs'),
			'@lexical/table': path.resolve('./node_modules/@lexical/table/LexicalTable.mjs'),
			'@lexical/utils': path.resolve('./node_modules/@lexical/utils/LexicalUtils.mjs'),
		},
	},
});
