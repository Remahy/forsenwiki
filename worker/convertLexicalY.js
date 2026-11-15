import { handleJobs } from './handleJobs.js';

import { base64ToUint8Array, uint8ArrayToBase64 } from 'uint8array-extras';

import { convertLegacyArticle } from '$lib/yjs/convertLegacy';

/**
 * @param {{ update: string }} data Merged Yjs 13 updates, base64 V2.
 * @returns {{ content: string, byteLength: number, differences: string[] }}
 */
export const convertLegacyUpdate = ({ update }) => {
	const { update: seed, differences } = convertLegacyArticle(base64ToUint8Array(update));

	return { content: uint8ArrayToBase64(seed), byteLength: seed.byteLength, differences };
};

handleJobs(convertLegacyUpdate);
