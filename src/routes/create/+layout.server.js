import { error } from '@sveltejs/kit';
import initialUpdate from '$lib/worker/initialUpdate';

export async function load() {
	try {
		const initUpdate = await initialUpdate();

		if (initUpdate) {
			return {
				initialUpdate: initUpdate,
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
