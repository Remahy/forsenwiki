import path from 'path';
import fs from 'fs/promises';
import { staticDir } from '../../../../static';

/**
 * @param {Buffer} buffer
 * @param {string} sha256String
 */
export const writeContent = async (buffer, sha256String) => {
	const p = path.join(staticDir, sha256String);

	await fs.writeFile(p, buffer);
};

/** @param {string} fileName */
export const rmContentByFilename = async (fileName) => {
	const p = path.join(staticDir, fileName);

	await fs.rm(p);
};
