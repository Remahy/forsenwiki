import * as esbuild from 'esbuild';
import sveltePlugin from 'esbuild-svelte';

import { writeFileSync, mkdirSync } from 'fs';

// Fix the mess that is Svelte being a dumbfuck.
const injectPlugin = {
	name: 'inject-at-point',
	setup(build) {
		build.onEnd((result) => {
			for (const outputFile of result.outputFiles) {
				let code = outputFile.text;

				const marker = 'globalThis.document?.contentType.includes("xml") ?? false;';
				const injection = 'false;';

				if (code.includes(marker)) {
					code = code.replace(marker, injection);
				}

				// Overwrite the file content
				outputFile.contents = Buffer.from(code);
			}
		});
	},
};

// Build the worker
async function buildInitialUpdateWorker() {
	const name = 'initialUpdate';

	const result = await esbuild.build({
		entryPoints: [`worker/${name}.js`],
		conditions: ['svelte'],
		bundle: true,
		platform: 'node',
		format: 'esm',
		outfile: `./src/lib/worker/${name}.js`,
		write: false,
		plugins: [sveltePlugin(), injectPlugin],
	});

	// Ensure dist directory exists
	mkdirSync(`src/lib/worker/${name}`, { recursive: true });
	writeFileSync(`src/lib/worker/${name}/worker.js`, result.outputFiles[0].contents);
}

async function buildToHTMLWorker() {
	const name = 'toHTML';

	const result = await esbuild.build({
		entryPoints: [`worker/${name}.js`],
		conditions: ['svelte'],
		bundle: true,
		platform: 'node',
		format: 'esm',
		outfile: `./src/lib/worker/${name}.js`,
		write: false,
		plugins: [sveltePlugin(), injectPlugin],
	});

	// Ensure dist directory exists
	mkdirSync(`src/lib/worker/${name}`, { recursive: true });
	writeFileSync(`src/lib/worker/${name}/worker.js`, result.outputFiles[0].contents);
}

async function buildYoutubeClipURLWorker() {
	const name = 'youtubeClipURL';

	const result = await esbuild.build({
		entryPoints: [`worker/${name}.js`],
		bundle: true,
		platform: 'node',
		format: 'esm',
		outfile: `./src/lib/worker/${name}.js`,
		write: false,
	});

	// Ensure dist directory exists
	mkdirSync(`src/lib/worker/${name}`, { recursive: true });
	writeFileSync(`src/lib/worker/${name}/worker.js`, result.outputFiles[0].contents);
}

async function buildTwitchThumbnailURLWorker() {
	const name = 'twitchThumbnailURL';

	const result = await esbuild.build({
		entryPoints: [`worker/${name}.js`],
		bundle: true,
		platform: 'node',
		format: 'esm',
		outfile: `./src/lib/worker/${name}.js`,
		write: false,
	});

	// Ensure dist directory exists
	mkdirSync(`src/lib/worker/${name}`, { recursive: true });
	writeFileSync(`src/lib/worker/${name}/worker.js`, result.outputFiles[0].contents);
}

buildInitialUpdateWorker().catch(() => process.exit(1));
buildToHTMLWorker().catch(() => process.exit(1));
buildYoutubeClipURLWorker().catch(() => process.exit(1));
buildTwitchThumbnailURLWorker().catch(() => process.exit(1));
