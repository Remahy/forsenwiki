import * as esbuild from 'esbuild';
import sveltePlugin from 'esbuild-svelte';

import { writeFileSync, mkdirSync } from 'fs';

// Build the worker
async function buildInitialUpdateWorker() {
	const result = await esbuild.build({
		entryPoints: ['worker/initialUpdate.js'],
		conditions: ['svelte'],
		bundle: true,
		platform: 'node',
		target: 'node22',
		format: 'esm',
		outfile: './src/lib/worker/initialUpdate.js',
		write: false,
		plugins: [sveltePlugin()],
	});

	// Ensure dist directory exists
	mkdirSync('src/lib/worker/initialUpdate', { recursive: true });
	writeFileSync('src/lib/worker/initialUpdate/worker.js', result.outputFiles[0].contents);
}

async function buildToHTMLWorker() {
	const result = await esbuild.build({
		entryPoints: ['worker/toHTML.js'],
		conditions: ['svelte'],
		bundle: true,
		platform: 'node',
		target: 'node22',
		format: 'esm',
		outfile: './src/lib/worker/toHTML.js',
		write: false,
		plugins: [sveltePlugin()],
	});

	// Ensure dist directory exists
	mkdirSync('src/lib/worker/toHTML', { recursive: true });
	writeFileSync('src/lib/worker/toHTML/worker.js', result.outputFiles[0].contents);
}

async function buildYoutubeClipURLWorker() {
	const result = await esbuild.build({
		entryPoints: ['worker/youtubeClipURL.js'],
		bundle: true,
		platform: 'node',
		target: 'node22',
		format: 'esm',
		outfile: './src/lib/worker/youtubeClipURL.js',
		write: false,
	});

	// Ensure dist directory exists
	mkdirSync('src/lib/worker/youtubeClipURL', { recursive: true });
	writeFileSync('src/lib/worker/youtubeClipURL/worker.js', result.outputFiles[0].contents);
}


buildInitialUpdateWorker().catch(() => process.exit(1));
buildToHTMLWorker().catch(() => process.exit(1));
buildYoutubeClipURLWorker().catch(() => process.exit(1));
