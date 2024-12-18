import { error, json } from '@sveltejs/kit';

import youtubeClipURL from '$lib/worker/youtubeClipURL';

export async function POST({ request }) {
	const { clip } = await request.json();

	if (clip) {
		const res = await youtubeClipURL({ url: clip });

		return json(res);
	}

	return error(400);
}
