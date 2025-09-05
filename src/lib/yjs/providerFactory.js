import { getContext } from 'svelte';
import { base64ToUint8Array } from 'uint8array-extras';
import { IndexeddbPersistence } from 'y-indexeddb';
import { applyDiffToYDoc, createNewYDoc, diffUpdateUsingStateVector, encodeYDocToUpdateV2, getStateVectorFromUpdate } from './utils';

const noop = () => {};

/**
 * @typedef {IndexeddbPersistence & { awareness: any, connect: typeof noop, disconnect: typeof noop }} IndexeddbPersistenceProvider
 *
 * @typedef {{ update: string, id: string, yjsDocMap: Map<string, YDoc>, initialUpdate?: string }} ProviderFactory
 */

/**
 * @param {ProviderFactory} arg1
 * @returns {import('@lexical/yjs').Provider}
 */
function providerFactory({ update, id = 'new', yjsDocMap, initialUpdate }) {

	// https://github.com/facebook/lexical/issues/3085#issuecomment-1498064163

	let doc = yjsDocMap.get(id);

	if (doc === undefined) {
		doc = createNewYDoc();
		yjsDocMap.set(id, doc);
	} else {
		doc.load();
	}

	/**
	 * @type {IndexeddbPersistenceProvider}
	 */
	// @ts-ignore
	const idbPersistence = new IndexeddbPersistence(id, doc);

	idbPersistence.connect = noop;
	idbPersistence.disconnect = idbPersistence.destroy;
	idbPersistence.awareness = {
		setLocalState: noop,
		getStates: () => [],
		getLocalState: () => null,
		on: noop,
		off: noop,
	};

	const persistence = idbPersistence;

	persistence.on('synced', (/** @type {any[]} */ ...args) => {
		persistence.emit('sync', args);
	});

	persistence.once('synced', () => {
		let useInitialUpdate = false;

		if (doc.store.clients.size === 0) {
			useInitialUpdate = true;
		}

		if (update) {
			// https://github.com/yjs/yjs/blob/52b906898fee761a6223eeef6a33adc2a4041b80/README.md#example-syncing-clients-without-loading-the-ydoc

			// Current
			const currentStateUpdate = encodeYDocToUpdateV2(doc);
			const stateVector = getStateVectorFromUpdate(currentStateUpdate);

			// Incoming update
			const uint8ArrayContent = base64ToUint8Array(update);

			// Diff the updates
			const diff = diffUpdateUsingStateVector(uint8ArrayContent, stateVector);

			applyDiffToYDoc(doc, diff, { isUpdateRemote: true });
		}

		if (!update && useInitialUpdate && initialUpdate) {
			// Current
			const currentStateUpdate = encodeYDocToUpdateV2(doc);
			const stateVector = getStateVectorFromUpdate(currentStateUpdate);

			// Incoming update
			const uint8ArrayContent = base64ToUint8Array(initialUpdate);

			// Diff the updates
			const diff = diffUpdateUsingStateVector(uint8ArrayContent, stateVector);

			applyDiffToYDoc(doc, diff, { isUpdateRemote: true });
		}
	});

	// For future reference: These contexts makes it so only one editor can be active at a time.

	getContext('YDOC').set(doc);

	// This is for clearing persistence on create & update submit.
	getContext('YDOCPERSISTENCE').set(persistence);


	return persistence;
}

/**
 * @param {string} update
 * @param {string} [initialUpdate]
 */
export function instantiateProvider(update, initialUpdate) {
	/**
	 * @param {ProviderFactory['id']} id
	 * @param {ProviderFactory['yjsDocMap']} yjsDocMap
	 */
	return (id, yjsDocMap) => providerFactory({ update, id, yjsDocMap, initialUpdate });
}
