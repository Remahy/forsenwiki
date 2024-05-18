import { produce } from 'sveltekit-sse'

/**
 * @param {string} type
 * @param {any} value
 */
let emitFn = (type, value) => { }

/**
 * @param {string} type
 * @param {any} value
 */
export function _emit (type, value) {
	try {
		emitFn(type, typeof value !== 'string' ? JSON.stringify(value) : value)
	} catch {
		// noop
	}
}

export function POST() {
	return produce(async function start({ emit }) {
		emitFn = emit;
	});
}
