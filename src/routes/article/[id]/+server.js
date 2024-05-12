import { error, redirect } from "@sveltejs/kit";

import { _getYPost } from "../../api/article/read/[id]/+server.js";

export async function GET({ params }) {
	const { id } = params;

	const article = await _getYPost(id);
	const title = article.post.postUpdates[0].title;

	if (article) {
		return redirect(301, `/article/${id}/${title}`)
	}

	return error(404, 'Article not found.')
}