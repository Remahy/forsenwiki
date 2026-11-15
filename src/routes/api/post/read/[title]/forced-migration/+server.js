import { error, json } from '@sveltejs/kit';
import { base64ToUint8Array, uint8ArrayToBase64 } from 'uint8array-extras';

import { ForbiddenError } from '$lib/errors/Forbidden';
import { sanitizeTitle } from '$lib/components/editor/utils/sanitizeTitle';
import { ALREADY_MIGRATED_MESSAGE } from '$lib/y/rows';
import { convertLegacyArticle } from '$lib/yjs/convertLegacy';
import { _getYPostByTitle } from '../+server';

/**
 * @typedef {Object} ForcedMigration
 * @property {string} update Base64 V2 update
 * @property {string[]} differences
 */

export async function GET({ params, locals }) {
	if (!locals.isModerator) {
		return ForbiddenError();
	}

	const { sanitized: title } = sanitizeTitle(params.title);

	let post;
	try {
		post = await _getYPostByTitle(title, { allowUnconverted: true });
	} catch (err) {
		if (typeof err === 'number') {
			return error(err);
		}

		throw err;
	}

	if (!post.legacyUpdate) {
		return error(409, ALREADY_MIGRATED_MESSAGE);
	}

	let migration;
	try {
		migration = convertLegacyArticle(base64ToUint8Array(post.legacyUpdate));
	} catch (err) {
		console.error(err);
		return error(500, 'This article could not be migrated.');
	}

	/** @type {ForcedMigration} */
	const body = {
		update: uint8ArrayToBase64(migration.update),
		differences: migration.differences,
	};

	return json(body);
}
