// Drafts saved by the Yjs 13 editor.
// TODO: Remove once no such drafts are around anymore.
import { base64ToUint8Array, uint8ArrayToBase64 } from 'uint8array-extras';

export const LEGACY_DRAFT_KEY = 'legacyDraft';

const TIMEOUT = 60_000;

/**
 * What a draft changed in its article, from the server: only it has the article's Yjs 13 history.
 * @param {string | null} title Null for an article that is not created yet.
 * @param {Uint8Array} legacyUpdate
 * @returns {Promise<Uint8Array | null>} A V2 update for the article's document, if anything changed.
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
