import { base64ToUint8Array, uint8ArrayToBase64 } from 'uint8array-extras';

import { Y } from './index.mjs';

/**
 * @param {YDoc} yDoc
 */
export function encodeYDocToUpdateV2(yDoc) {
	const yjsUpdateState = Y.encodeStateAsUpdateV2(yDoc);

	return yjsUpdateState;
}

/**
 * @param {YDoc} yDoc
 */
export function encodeYDocToUpdate(yDoc) {
	const yjsUpdateState = Y.encodeStateAsUpdate(yDoc);

	return yjsUpdateState;
}

/**
 * @param {YDoc} yDoc
 */
export function encodeYDocToUpdateV2ToBase64(yDoc) {
	const yjsUpdateState = encodeYDocToUpdateV2(yDoc);
	const encodedContent = uint8ArrayToBase64(yjsUpdateState);

	return encodedContent;
}

/**
 * @param {Array<Pick<Prisma.YPostUpdate, 'content'>>} postUpdates
 */
export function postUpdatesToUint8Arr(postUpdates) {
	return postUpdates.map(({ content }) => base64ToUint8Array(content));
}

/**
 * @param {Array<Uint8Array>} arrOfUint8Arr
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
 * @param {YDoc} doc
 * @param {Uint8Array} diff
 * @param {any} [transactionOrigin]
 */
export function applyDiffToYDoc(doc, diff, transactionOrigin) {
	return Y.applyUpdate(doc, diff, transactionOrigin);
}

/**
 * @param {Array<Pick<Prisma.YPostUpdate, 'content'>>} postUpdates
 */
export function yPostUpdatesV2ToBase64(postUpdates) {
	const uint8ArrayArray = postUpdatesToUint8Arr(postUpdates);
	const mergedUpdates = mergePostUpdatesV2(uint8ArrayArray);
	const base64String = uint8ArrayToBase64(mergedUpdates);

	return base64String;
}

export function createNewYDoc() {
	return new Y.Doc();
}

export const YXmlText = Y.XmlText;

/**
 * @param {Uint8Array} uint8ArrayContent
 */
export function convertUpdateFormatV2ToV1(uint8ArrayContent) {
	return Y.convertUpdateFormatV2ToV1(uint8ArrayContent);
}

/**
 * @param {Uint8Array} newUpdate
 * @param {Uint8Array} existingStateVector
 */
export function diffUpdateUsingStateVector(newUpdate, existingStateVector) {
	return Y.diffUpdate(newUpdate, existingStateVector);
}

/**
 * @param {Uint8Array} update
 */
export function getStateVectorFromUpdate(update) {
	return Y.encodeStateVectorFromUpdate(update);
}
