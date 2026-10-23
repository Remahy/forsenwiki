import { error} from '@sveltejs/kit';

export async function POST({ request }) {
	const { clip } = await request.json();

	if (clip) {
		try {
			const { default: youtubeClipURL } = await import('#lib/worker/youtubeClipURL/index.js');

			const res = await youtubeClipURL({ url: clip });

			return Response.json(res);
		} catch {
			return error(500);
		}
	}

	return error(400);
}
