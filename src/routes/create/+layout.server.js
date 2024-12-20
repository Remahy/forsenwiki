import { error } from '@sveltejs/kit';

export async function load() {
	try {
		const { default: initialUpdate } = await import('$lib/worker/initialUpdate');

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
