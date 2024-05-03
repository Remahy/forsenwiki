import { json } from '@sveltejs/kit';

/** @type {import('./$types').RequestHandler} */
export function POST({ request }) {
	return json({
		// retrieve a specific header
		userAgent: request.headers.get('user-agent')
	});
}
