import { redirect } from '@sveltejs/kit';

import prisma from '$lib/prisma';

import { Y_POST_TYPES, SYSTEM } from '../../../types';

const { ARTICLE, BIO } = Y_POST_TYPES;

const systemArticles = [ARTICLE, BIO, SYSTEM];

function unluckyRedirect () {
	return redirect(307, '/');
}

export async function GET() {
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

		if (systemArticles.includes(randomArticle.id)) {
			return unluckyRedirect();
		}

		randomURL = `/w/${randomArticle.title}`;
	} else {
		/**
		 * @type {[import('@prisma/client').Content]}
		 */
		// DO NOT pass in or accept user input here
		const [randomContent] = await prisma.$queryRaw`SELECT * FROM "Content" ORDER BY RANDOM() LIMIT 1;`;

		if (!randomContent) {
			return unluckyRedirect();
		}

		randomURL = `/content/${randomContent.id}`;
	}

	return redirect(307, randomURL);
}
