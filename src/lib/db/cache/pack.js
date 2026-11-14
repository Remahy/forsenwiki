import { promisify } from 'node:util';
import { gunzip, gzip } from 'node:zlib';

import { version } from '$lib/utils/version';

const compress = promisify(gzip);
const decompress = promisify(gunzip);

// What is cached depends on the nodes' code, so nothing written by another version is read.
export const MADE_BY = version;

/**
 * @param {unknown} value
 * @returns {Promise<Uint8Array<ArrayBuffer>>}
 */
export const pack = async (value) => new Uint8Array(await compress(JSON.stringify(value)));

/**
 * @param {Uint8Array} content
 * @returns {Promise<any>}
 */
export const unpack = async (content) => JSON.parse((await decompress(content)).toString());
