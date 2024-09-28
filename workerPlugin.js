import path from 'node:path';
import MagicString from 'magic-string';

/* utils - https://github.com/alex8088/electron-vite/blob/master/src/utils.ts */

export const queryRE = /\?.*$/s;
export const hashRE = /#.*$/s;

/**
 * @param {string} url
 * @returns {string}
 */
const cleanUrl = (url) => url.replace(hashRE, '').replace(queryRE, '');

/**
 * @param {string} id
 * @returns {Record<string, string> | null}
 */
function parseRequest(id) {
	const { search } = new URL(id, 'file:');
	if (!search) {
		return null;
	}
	return Object.fromEntries(new URLSearchParams(search));
}

/**
 * @param {string} filename
 * @param {string} importer
 * @returns {string}
 */
function toRelativePath(filename, importer) {
	const relPath = path.posix.relative(path.dirname(importer), filename);
	return relPath.startsWith('.') ? relPath : `./${relPath}`;
}

/* worker.ts - https://github.com/alex8088/electron-vite/blob/master/src/plugins/worker.ts */

const nodeWorkerAssetUrlRE = /__VITE_NODE_WORKER_ASSET__([\w$]+)__/g;

/**
 * Resolve `?nodeWorker` import and automatically generate `Worker` wrapper.
 * @returns {import('vite').Plugin}
 */
export default function workerPlugin() {
	/**
	 * @type {boolean | 'inline' | 'hidden'}
	 */
	let sourcemap = false;
	return {
		name: 'vite:node-worker',
		apply: 'build',
		enforce: 'pre',
		configResolved(config) {
			sourcemap = config.build.sourcemap;
		},
		/**
		 * @returns {string | void}
		 */
		resolveId(id, importer) {
			const query = parseRequest(id);
			if (query && typeof query.nodeWorker === 'string') {
				return id + `&importer=${importer}`;
			}
		},
		/**
		 * @returns {string | void}
		 */
		load(id) {
			const query = parseRequest(id);
			if (query && typeof query.nodeWorker === 'string' && typeof query.importer === 'string') {
				const cleanPath = cleanUrl(id);
				const hash = this.emitFile({
					type: 'chunk',
					id: cleanPath,
					importer: query.importer,
				});
				const assetRefId = `__VITE_NODE_WORKER_ASSET__${hash}__`;
				return `
        import { Worker } from 'node:worker_threads';
        export default function (options) { return new Worker(new URL(${assetRefId}, import.meta.url), options); }`;
			}
		},
		/**
		 * @returns {{ code: string; map: import('rollup').SourceMapInput } | null}
		 */
		renderChunk(code, chunk) {
			if (code.match(nodeWorkerAssetUrlRE)) {
				/**
				 * @type {RegExpExecArray | null}
				 */
				let match;
				const s = new MagicString(code);

				while ((match = nodeWorkerAssetUrlRE.exec(code))) {
					const [full, hash] = match;
					const filename = this.getFileName(hash);
					const outputFilepath = toRelativePath(filename, chunk.fileName);
					const replacement = JSON.stringify(outputFilepath);
					s.overwrite(match.index, match.index + full.length, replacement, {
						contentOnly: true,
					});
				}

				return {
					code: s.toString(),
					map: sourcemap ? s.generateMap({ hires: 'boundary' }) : null,
				};
			}

			return null;
		},
	};
}
