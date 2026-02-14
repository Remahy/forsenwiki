import path from 'node:path';
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

// Copied from https://github.com/evanw/esbuild/issues/1051#issuecomment-806325487
export const nativeNodeModulesPlugin = () => {
	return {
		name: 'native-node-modules',
		setup(build) {
			// If a ".node" file is imported within a module in the "file" namespace, resolve
			// it to an absolute path and put it into the "node-file" virtual namespace.
			build.onResolve({ filter: /\.node$/, namespace: 'file' }, (args) => {
				const resolvedId = require.resolve(args.path, {
					paths: [args.resolveDir],
				});
				if (resolvedId.endsWith('.node')) {
					return {
						path: resolvedId,
						namespace: 'node-file',
					};
				}
				return {
					path: resolvedId,
				};
			});

			// Files in the "node-file" virtual namespace call "require()" on the
			// path from esbuild of the ".node" file in the output directory.
			build.onLoad({ filter: /.*/, namespace: 'node-file' }, (args) => {
				return {
					contents: `
            import path from ${JSON.stringify(args.path)}
            try { module.exports = require(path) }
            catch {}
          `,
					resolveDir: path.dirname(args.path),
				};
			});

			// If a ".node" file is imported within a module in the "node-file" namespace, put
			// it in the "file" namespace where esbuild's default loading behavior will handle
			// it. It is already an absolute path since we resolved it to one above.
			build.onResolve({ filter: /\.node$/, namespace: 'node-file' }, (args) => ({
				path: args.path,
				namespace: 'file',
			}));

			// Tell esbuild's default loading behavior to use the "file" loader for
			// these ".node" files.
			const opts = build.initialOptions;
			opts.loader = opts.loader || {};
			opts.loader['.node'] = 'file';
		},
	};
};

async function buildGetDiffJSONWorker() {
	const result = await esbuild.build({
		entryPoints: ['worker/getDiffJSON.js'],
		conditions: ['svelte'],
		bundle: false,
		platform: 'node',
		target: 'node22',
		format: 'esm',
		outfile: './src/lib/worker/getDiffJSON.js',
		write: false,
		plugins: [sveltePlugin(), nativeNodeModulesPlugin()],
	});

	// Ensure dist directory exists
	mkdirSync('src/lib/worker/getDiffJSON', { recursive: true });
	writeFileSync('src/lib/worker/getDiffJSON/worker.js', result.outputFiles[0].contents);
}

buildInitialUpdateWorker().catch(() => process.exit(1));
buildToHTMLWorker().catch(() => process.exit(1));
buildYoutubeClipURLWorker().catch(() => process.exit(1));
buildGetDiffJSONWorker().catch(() => process.exit(1));
