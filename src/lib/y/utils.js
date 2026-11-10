import * as Y from '@y/y';
import { base64ToUint8Array, uint8ArrayToBase64 } from 'uint8array-extras';

/**
 * @param {YDoc} yDoc
 */
export function encodeYDocToUpdateV2(yDoc) {
	return Y.encodeStateAsUpdateV2(yDoc);
}

/**
 * @param {YDoc} yDoc
 */
export function encodeYDocToUpdate(yDoc) {
	return Y.encodeStateAsUpdate(yDoc);
}

/**
 * @param {YDoc} yDoc
 */
export function encodeYDocToUpdateV2ToBase64(yDoc) {
	return uint8ArrayToBase64(encodeYDocToUpdateV2(yDoc));
}

/**
 * @param {Array<Pick<Prisma.YPostUpdate, 'content'>>} postUpdates
 */
export function postUpdatesToUint8Arr(postUpdates) {
	return postUpdates.map(
		({ content }) => /** @type {Uint8Array<ArrayBuffer>} */ (base64ToUint8Array(content))
	);
}

/**
 * @param {Array<Uint8Array<ArrayBuffer>>} arrOfUint8Arr
 */
export function mergePostUpdatesV2(arrOfUint8Arr) {
	return Y.mergeUpdatesV2(arrOfUint8Arr);
}

/**
 * @param {Uint8Array} update
 */
export function getStateVectorFromUpdateV2(update) {
	return Y.encodeStateVectorFromUpdateV2(update);
}

/**
 * @param {Uint8Array} newUpdate
 * @param {Uint8Array} existingStateVector
 */
export function diffUpdateUsingStateVectorV2(newUpdate, existingStateVector) {
	return Y.diffUpdateV2(newUpdate, existingStateVector);
}

/**
 * @param {Array<Pick<Prisma.YPostUpdate, 'content'>>} postUpdates
 */
export function yPostUpdatesV2ToBase64(postUpdates) {
	return uint8ArrayToBase64(mergePostUpdatesV2(postUpdatesToUint8Arr(postUpdates)));
}

/**
 * @param {Uint8Array} updateV2
 */
export function convertUpdateFormatV2ToV1(updateV2) {
	return Y.convertUpdateFormatV2ToV1(updateV2);
}

/**
 * @param {Uint8Array} updateV1
 */
export function convertUpdateFormatV1ToV2(updateV1) {
	return Y.convertUpdateFormatV1ToV2(updateV1);
}

/**
 * Applies what `doc` is missing from a V2 update, as a provider would.
 * @param {YDoc} doc
 * @param {Uint8Array} updateV2
 */
export function applyRemoteUpdateV2(doc, updateV2) {
	const update = convertUpdateFormatV2ToV1(updateV2);
	const diff = Y.diffUpdate(update, Y.encodeStateVector(doc));

	Y.applyUpdate(doc, diff, { isUpdateRemote: true });
}

/**
 * @param {YDoc} doc
 * @param {string} name
 */
export function hasSharedContent(doc, name) {
	/** @type {any} */
	const type = doc.share.get(name);

	if (type === undefined) {
		return false;
	}

	if (type._map.size > 0) {
		return true;
	}

	for (let item = type._start; item !== null; item = item.right) {
		if (!item.deleted) {
			return true;
		}
	}

	return false;
}
