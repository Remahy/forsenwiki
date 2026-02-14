import { workerData, parentPort } from 'node:worker_threads';

import { getYjsAndEditor } from '$lib/yjs/getYjsAndEditor';
import { diffJSON } from '$lib/diff/index.server';
import { articleConfig } from '$lib/components/editor/config/article';
import { EDITOR_IS_READONLY } from '$lib/constants/constants';

export const getDiffJSONWorker = async (data) => {
	/**
	 * @type {{ updatesTo: Uint8Array<ArrayBufferLike>, updatesFrom: Uint8Array<ArrayBufferLike> }} workerData
	 */
	const { updatesTo, updatesFrom } = data || workerData;

	const { editor: tEditor } = getYjsAndEditor(
		articleConfig(null, EDITOR_IS_READONLY, null),
		updatesTo
	);
	const toUpdate = tEditor.toJSON();

	const { editor: fEditor } = getYjsAndEditor(
		articleConfig(null, EDITOR_IS_READONLY, null),
		updatesFrom
	);
	const fromUpdate = fEditor.toJSON();

	const diffJSONRes = diffJSON(toUpdate, fromUpdate);

	const diffJSONStr = JSON.stringify(diffJSONRes);

	parentPort?.postMessage(diffJSONStr);

	return diffJSONStr;
};

if (workerData) {
	try {
		getDiffJSONWorker();
	} catch (err) {
		console.error('getDiffJSONWorker error', err);
	}
}
