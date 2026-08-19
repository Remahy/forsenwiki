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
		dedupe: ['yjs'],
		alias: {
			yjs: path.resolve('./node_modules/yjs/dist/yjs.mjs'),
			'@lexical/yjs': path.resolve('./node_modules/@lexical/yjs/dist/LexicalYjs.mjs'),
			'@lexical/clipboard': path.resolve('./node_modules/@lexical/clipboard/dist/LexicalClipboard.mjs'),
			'@lexical/code': path.resolve('./node_modules/@lexical/code/dist/LexicalCode.mjs'),
			'@lexical/file': path.resolve('./node_modules/@lexical/file/dist/LexicalFile.mjs'),
			'@lexical/hashtag': path.resolve('./node_modules/@lexical/hashtag/dist/LexicalHashtag.mjs'),
			'@lexical/history': path.resolve('./node_modules/@lexical/history/dist/LexicalHistory.mjs'),
			'@lexical/html': path.resolve('./node_modules/@lexical/html/dist/LexicalHtml.mjs'),
			'@lexical/link': path.resolve('./node_modules/@lexical/link/dist/LexicalLink.mjs'),
			'@lexical/list': path.resolve('./node_modules/@lexical/list/dist/LexicalList.mjs'),
			'@lexical/mark': path.resolve('./node_modules/@lexical/mark/dist/LexicalMark.mjs'),
			'@lexical/overflow': path.resolve('./node_modules/@lexical/overflow/dist/LexicalOverflow.mjs'),
			'@lexical/plain-text': path.resolve(
				'./node_modules/@lexical/plain-text/dist/LexicalPlainText.mjs'
			),
			'@lexical/rich-text': path.resolve('./node_modules/@lexical/rich-text/dist/LexicalRichText.mjs'),
			'@lexical/selection': path.resolve('./node_modules/@lexical/selection/dist/LexicalSelection.mjs'),
			'@lexical/table': path.resolve('./node_modules/@lexical/table/dist/LexicalTable.mjs'),
			'@lexical/utils': path.resolve('./node_modules/@lexical/utils/dist/LexicalUtils.mjs'),
			'@lexical/markdown': path.resolve('./node_modules/@lexical/markdown/dist/LexicalMarkdown.mjs'),
			'@lexical/text': path.resolve('./node_modules/@lexical/text/dist/LexicalText.mjs'),
			'@lexical/extension': path.resolve('./node_modules/@lexical/extension/dist/LexicalExtension.mjs'),
		},
	},
});
