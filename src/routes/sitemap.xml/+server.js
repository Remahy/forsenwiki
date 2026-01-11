import { FULL_DOMAIN } from '$env/static/private';
import prisma from '$lib/prisma';
import { getShouldCacheBust } from '$lib/utils/cacheBust';

/** @type {Map<string, number>} */
const cacheBustRateLimit = new Map();

/**
 * @param {{ url: string, lastUpdated: string }} arg
 */
const siteMapEntry = ({ url, lastUpdated }) => {
	return `<url>
		<loc>${FULL_DOMAIN}/w/${url}</loc>
		<lastmod>${lastUpdated}</lastmod>
	</url>
`;
};

const getAllArticles = async () => {
	const res = await prisma.yPost.findMany({
		orderBy: {
			createdTimestamp: 'desc',
		},
		select: {
			id: true,
			title: true,
			rawTitle: true,
			createdTimestamp: true,
			lastUpdated: true,
		},
	});

	return res.map((yPost) => ({ url: yPost.title, lastUpdated: yPost.lastUpdated.toISOString() }));
};

/** @type {Array<{ url: string, lastUpdated: string }>} */
let lastResults = [];

export async function GET() {
	const cacheBust = getShouldCacheBust(cacheBustRateLimit, 'sitemap', 3_600_000);

	if (cacheBust) {
		lastResults = await getAllArticles();
	}

	return new Response(
		`
		<?xml version="1.0" encoding="UTF-8" ?>
		<urlset
			xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
			xmlns:xhtml="http://www.w3.org/1999/xhtml"
			xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0"
			xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
			xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
			xmlns:video="http://www.google.com/schemas/sitemap-video/1.1"
		>
			${lastResults.map(siteMapEntry).join('')}
		</urlset>`.trim(),
		{
			headers: {
				'Content-Type': 'application/xml',
			},
		}
	);
}
