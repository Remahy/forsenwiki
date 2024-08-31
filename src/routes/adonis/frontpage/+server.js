import { writable } from 'svelte/store';
import { produce } from 'sveltekit-sse';

/** @type {Writable<{ type: string, value: string } | null>} */
const eventStore = writable(null);

/**
 * @param {string} type
 * @param {any} value
 */
export function _emit(type, value) {
	eventStore.set({ type, value: typeof value !== 'string' ? JSON.stringify(value) : value });
}

export function POST() {
	return produce(async function start({ emit }) {
		return eventStore.subscribe((event) => {
			if (!event) return;
			const { type, value } = event;

			emit(type, value);
		});
	});
}
