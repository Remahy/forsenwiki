// TODO: Remove once no Yjs 13 drafts are around anymore.
import { base64ToUint8Array, uint8ArrayToBase64 } from 'uint8array-extras';

export const LEGACY_DRAFT_KEY = 'legacyDraft';

const TIMEOUT = 60_000;

/**
 * Done on the server, which has the article's Yjs 13 history.
 * @param {string | null} title Null for a new article.
 * @param {Uint8Array} legacyUpdate
 * @returns {Promise<Uint8Array | null>} V2 update.
 */
export const migrateLegacyDraft = async (title, legacyUpdate) => {
	/** @type {import('../../routes/api/post/legacy-draft/+server').LegacyDraftBody} */
	const body = { title, content: uint8ArrayToBase64(legacyUpdate) };

	const response = await fetch('/api/post/legacy-draft', {
		method: 'POST',
		body: JSON.stringify(body),
		headers: { 'content-type': 'application/json' },
		signal: AbortSignal.timeout(TIMEOUT),
	});

	if (!response.ok) {
		throw new Error(`The draft could not be migrated (${response.status}).`);
	}

	const { update } = await response.json();

	return update ? base64ToUint8Array(update) : null;
};
