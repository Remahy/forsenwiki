import { error } from '@sveltejs/kit';
import { _getYPostAndHtml } from '../../api/article/read/[id]/+server';

export async function load({ params }) {
	const { title } = params;

	const article = await _getYPostAndHtml(title);

	/**
	 * @type {Array<{ name: string }>}
	 */
	const authors = [];

	if (article) {
		return { ...article, authors };
	}

	return error(404, 'Not found');
}
