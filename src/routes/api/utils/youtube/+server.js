import { error, json } from '@sveltejs/kit';

export async function POST({ request }) {
	const { clip } = await request.json();

	if (clip) {
		try {
			const { default: youtubeClipURL } = await import('$lib/worker/youtubeClipURL');

			const res = await youtubeClipURL({ url: clip });

			return json(res);
		} catch {
			return error(500);
		}
	}

	return error(400);
}
