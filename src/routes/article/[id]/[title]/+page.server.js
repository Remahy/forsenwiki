import { error } from '@sveltejs/kit';
import { _getYPostAndHtml } from '../../../api/article/read/[id]/+server';

export async function load({ params }) {
	const { id } = params;

	const article = await _getYPostAndHtml(id);

	if (article) {
		return article;
	}

	return error(404, 'Not found');
}
