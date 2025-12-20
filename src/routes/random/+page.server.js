import { redirect } from '@sveltejs/kit';

import prisma from '$lib/prisma';

function unluckyRedirect () {
	return redirect(307, '/');
}

export async function load() {
	/**
	 * @type {string}
	 */
	let randomURL = '';

	if (Math.random() >= 0.1) {
		/**
		 * @type {[import('@prisma/client').YPost]}
		 */
			// DO NOT pass in or accept user input here
		const [randomArticle] = await prisma.$queryRaw`SELECT * FROM "YPost" ORDER BY RANDOM() LIMIT 1;`;

		randomURL = `/w/${randomArticle.title}?random`;
	} else {
		/**
		 * @type {[import('@prisma/client').Content]}
		 */
		// DO NOT pass in or accept user input here
		const [randomContent] = await prisma.$queryRaw`SELECT * FROM "Content" ORDER BY RANDOM() LIMIT 1;`;

		if (!randomContent) {
			return unluckyRedirect();
		}

		randomURL = `/content/${randomContent.id}?random`;
	}

	return redirect(307, randomURL);
}
