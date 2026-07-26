import { Y_POST_TYPES } from '$lib/constants/constants';
import { DOMAIN } from '$lib/environment/environment';
import prisma from '$lib/prisma.server';
import { getShouldCacheBust } from '$lib/utils/cacheBust';

/** @type {Map<string, number>} */
const cacheBustRateLimit = new Map();

/**
 * @param {{ url: string, lastUpdated: string }} arg
 */
const siteMapEntry = ({ url, lastUpdated }) => {
	return `<url>
		<loc>${DOMAIN}/w/${url}</loc>
		<lastmod>${lastUpdated}</lastmod>
	</url>
`;
};

const getAllArticles = async () => {
	const res = await prisma.yPost.findMany({
		where: {
			outRelations: {
				some: {
					isSystem: true,
					toPostId: Y_POST_TYPES.ARTICLE,
				},
			},
		},
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

const lastUpdated = new Date().toISOString();

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
			<url>
				<loc>${DOMAIN}/create</loc>
				<lastmod>${lastUpdated}</lastmod>
			</url>
			<url>
				<loc>${DOMAIN}/search</loc>
				<lastmod>${lastUpdated}</lastmod>
			</url>
			<url>
				<loc>${DOMAIN}/recentchanges</loc>
				<lastmod>${lastUpdated}</lastmod>
			</url>
			<url>
				<loc>${DOMAIN}/about</loc>
				<lastmod>${lastUpdated}</lastmod>
			</url>
			<url>
				<loc>${DOMAIN}/terms</loc>
				<lastmod>${lastUpdated}</lastmod>
			</url>
			<url>
				<loc>${DOMAIN}/privacy</loc>
				<lastmod>${lastUpdated}</lastmod>
			</url>
			<url>
				<loc>${DOMAIN}/dmca</loc>
				<lastmod>${lastUpdated}</lastmod>
			</url>
		</urlset>`.trim(),
		{
			headers: {
				'Content-Type': 'application/xml',
			},
		}
	);
}
