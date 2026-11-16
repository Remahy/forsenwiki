import { createHash } from 'node:crypto';
import { LINK_HASH_PREFIX } from './externalLink.js';

/** @param {string} url */
export const hashLink = (url) =>
	`${LINK_HASH_PREFIX}${createHash('sha256').update(url).digest('hex')}`;
