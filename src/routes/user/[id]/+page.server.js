import prisma from '$lib/prisma.server.js';
import { error } from '@sveltejs/kit';
import { _getSearch, _parseSearchParamsForSearch } from '../../api/search/+server.js';
import { SYSTEM } from '$lib/constants/constants.js';

export async function load({ url, params }) {
	const { id } = params;

	const user = await prisma.user.findUnique({
		where: { id },
		select: { name: true, createdAt: true, image: true, permissions: { select: { type: true } } },
	});

	if (!user) {
		return error(404, 'User not found.');
	}

	/**
	 * @type {import("../../api/search/+server.js").QueryResult[]}
	 */
	let results = [];

	if (url.searchParams.get('noload')) {
		return { results, user };
	}

	if (id !== SYSTEM) {
		const { query, types, options } = _parseSearchParamsForSearch(url);
		const searchRes = await _getSearch(query, types, options);
		results = searchRes.results;
	}

	return { results, user };
}
