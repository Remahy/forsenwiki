import { error, json } from '@sveltejs/kit';
import { base64ToUint8Array, uint8ArrayToBase64 } from 'uint8array-extras';

import { ForbiddenError } from '$lib/errors/Forbidden';
import { sanitizeTitle } from '$lib/components/editor/utils/sanitizeTitle';
import { readYPostUpdatesByTitle } from '$lib/db/post/read';
import initialUpdate from '$lib/worker/initialUpdate';
import { isLegacyUpdate } from '$lib/y/headless';
import { currentRows, NOT_CONVERTED_MESSAGE, YJS13 } from '$lib/y/rows';
import { migrateLegacyChanges } from '$lib/yjs/migrateLegacy';
import { mergePostUpdatesV2, postUpdatesToUint8Arr } from '$lib/yjs/utils';

/**
 * @param {string | null} title Null for a new article.
 * @param {Uint8Array} legacyUpdate
 * @returns {Promise<Uint8Array | null>} Null when the draft changed nothing.
 */
export async function _migrateLegacyDraft(title, legacyUpdate) {
	if (!title) {
		const initUpdate = await initialUpdate();
		return migrateLegacyChanges({
			legacyArticle: null,
			legacyUpdate,
			base: base64ToUint8Array(initUpdate),
		});
	}

	const post = await readYPostUpdatesByTitle(sanitizeTitle(title).sanitized);

	if (!post) {
		error(404);
	}

	const [seed] = currentRows(post.postUpdates);

	if (!seed) {
		// See scripts/convertPostsToLexicalY.js.
		error(503, NOT_CONVERTED_MESSAGE);
	}

	const legacyRows = post.postUpdates.filter(({ format, content }) => format === YJS13 && content);

	return migrateLegacyChanges({
		legacyArticle: legacyRows.length ? mergePostUpdatesV2(postUpdatesToUint8Arr(legacyRows)) : null,
		legacyUpdate,
		base: base64ToUint8Array(seed.content),
	});
}

/**
 * @typedef {Object} LegacyDraftBody
 * @property {string | null} [title]
 * @property {string} content Base64 V2 update.
 */

export async function POST({ request, locals }) {
	if (locals.isBlocked) {
		return ForbiddenError();
	}

	/** @type {LegacyDraftBody} */
	const { title = null, content } = await request.json();

	if (typeof content !== 'string') {
		error(400, 'No draft provided.');
	}

	const legacyUpdate = base64ToUint8Array(content);

	if (!isLegacyUpdate(legacyUpdate)) {
		error(400, 'Not a draft of the previous editor.');
	}

	const update = await _migrateLegacyDraft(title, legacyUpdate);

	return json({ update: update ? uint8ArrayToBase64(update) : null });
}
