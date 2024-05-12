import { getContext } from 'svelte'
import { base64ToUint8Array } from 'uint8array-extras'
import { IndexeddbPersistence } from 'y-indexeddb'

import { Y } from './index.mjs'

const noop = () => { }

/**
 * @type {undefined | import('@lexical/yjs').Provider}
 */
let provider

/**
 * @typedef {IndexeddbPersistence & { awareness: any, connect: typeof noop, disconnect: typeof noop }} IndexeddbPersistenceProvider
 */

/**
 * @param {string} update
 * @param {string} id
 * @param {Map<string, Y.Doc>} yjsDocMap
 * @returns {import('@lexical/yjs').Provider}
 */
function providerFactory(update, id = 'new', yjsDocMap) {
	if (provider) {
		return provider
	}

	// https://github.com/facebook/lexical/issues/3085#issuecomment-1498064163

	let doc = yjsDocMap.get(id)

	if (doc === undefined) {
		doc = new Y.Doc()
		yjsDocMap.set(id, doc)
	} else {
		doc.load()
	}

	/**
	 * @type {IndexeddbPersistenceProvider}
	 */
	// @ts-ignore
	const idbPersistence = new IndexeddbPersistence(id, doc)

	idbPersistence.connect = noop
	idbPersistence.disconnect = idbPersistence.destroy
	idbPersistence.awareness = {
		setLocalState: noop,
		getStates: () => [],
		getLocalState: () => null,
		on: noop,
		off: noop
	}

	const persistence = idbPersistence

	persistence.on('synced', (/** @type {any[]} */ ...args) => {
		persistence.emit('sync', args)
	})

	persistence.once('synced', () => {
		if (update) {
			// https://github.com/yjs/yjs/blob/52b906898fee761a6223eeef6a33adc2a4041b80/README.md#example-syncing-clients-without-loading-the-ydoc

			// Current
			const currentStateUpdate = Y.encodeStateAsUpdate(doc)
			const stateVector = Y.encodeStateVectorFromUpdate(currentStateUpdate)

			// Incoming update
			const uint8ArrayContent = base64ToUint8Array(update)
			const convertedUpdate = Y.convertUpdateFormatV2ToV1(uint8ArrayContent)

			// Diff the updates
			const diff = Y.diffUpdate(convertedUpdate, stateVector)

			Y.applyUpdate(doc, diff)
		}
	})

	// For future reference: These contexts makes it so only one editor can be active at a time.

	// This is for resetEditorModalContent.
	getContext('YDOCPERSISTENCE').set(persistence);

	getContext('YDOC').set(doc);

	provider = persistence

	return provider
}

/**
 * @param {string} update
 */
export function instantiateProvider (update) {
	/**
	 * @param {string} id
	 * @param {any} yjsDocMap
	 */
	return (id, yjsDocMap) => providerFactory(update, id, yjsDocMap)
}
