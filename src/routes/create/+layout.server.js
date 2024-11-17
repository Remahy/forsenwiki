import { uint8ArrayToBase64 } from 'uint8array-extras';
import { error } from '@sveltejs/kit';
import { createInitialUpdate } from '$lib/lexical/createInitialUpdate';

export async function load() {
	try {
		const initialUpdate = createInitialUpdate();

		if (initialUpdate) {
			return {
				initialUpdate: uint8ArrayToBase64(initialUpdate),
			};
		}

		return error(500);
	} catch (err) {
		if (typeof err === 'number') {
			return error(err);
		}

		throw err;
	}
}
