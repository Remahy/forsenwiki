import { createSubscriber } from 'svelte/reactivity';

/**
 * Reads a Lexical extension signal from Svelte runes.
 * @template T
 * @param {import('@lexical/extension').ReadonlySignal<T>} signal
 * @returns {{ readonly current: T }}
 */
export const fromSignal = (signal) => {
	const subscribe = createSubscriber((update) => signal.subscribe(update));

	return {
		get current() {
			subscribe();
			return signal.value;
		},
	};
};
