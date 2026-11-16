// Runs on launch (start.sh), after the add_post_content migration records the uploads articles use. It records every
// link in one transaction, ending with a link to the wiki itself. Once that exists it has run and is skipped, as saving
// articles records links since.
//
// Records the external links of every article as content, from the rendered HTML, credited to the system user and
// dated by the article's last edit. A link in several articles dates from the earliest of them, and dates already
// recorded are only ever moved earlier.
// Saving an article replaces its links with what the editor holds, so differences correct themselves on the next save.
//
// --dry-run Count, write nothing.
// --force   Run even though it has run before.

import dotenv from 'dotenv';
import dotenvExpand from 'dotenv-expand';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.ts';
import { SYSTEM } from '../src/lib/constants/constants.js';
import { classifyLink, LINK_CONTENT_TYPE, wikiLinkOf } from '../src/lib/utils/externalLink.js';
import { hashLink } from '../src/lib/utils/hashLink.server.js';

dotenvExpand.expand(dotenv.config());

const dryRun = process.argv.includes('--dry-run');
const force = process.argv.includes('--force');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const origins = { domain: process.env.VITE_DOMAIN, staticDomain: process.env.VITE_STATIC_DOMAIN };

if (!origins.domain) {
	throw new Error('VITE_DOMAIN is not set.');
}

const wikiLink = wikiLinkOf(origins.domain);
const wikiLinkHash = hashLink(wikiLink);

const ENTITIES = { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>' };

/** @param {string} value */
const decodeEntities = (value) =>
	value.replace(/&(#x[\da-f]+|#\d+|\w+);/gi, (entity, code) => {
		if (code[0] === '#') {
			const point =
				code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : Number(code.slice(1));

			return String.fromCodePoint(point);
		}

		return /** @type {Record<string, string>} */ (ENTITIES)[code.toLowerCase()] ?? entity;
	});

/** @param {string} html */
const getExternalLinks = (html) => {
	/** @type {Set<string>} */
	const links = new Set();

	// Empty anchors are left over in old HTML but the editor doesn't keep them.
	for (const [, href] of html.matchAll(/<a\b[^>]*?\shref="([^"]*)"[^>]*>(?!<\/a>)/gi)) {
		const target = classifyLink(decodeEntities(href), origins);

		if (target && 'url' in target) {
			links.add(target.url);
		}
	}

	return [...links];
};

const TRANSACTION_TIMEOUT = 10 * 60 * 1000;

async function main() {
	const hasRun = await prisma.content.findUnique({
		where: { hash: wikiLinkHash },
		select: { id: true },
	});

	if (hasRun && !force) {
		console.log('skipped, it has run before');
		return;
	}

	const htmls = await prisma.html.findMany({
		select: { postId: true, content: true, post: { select: { lastUpdated: true } } },
	});

	const stats = { articles: 0, links: 0, usages: 0, newContent: 0, redated: 0 };

	const articles = htmls
		.map(({ postId, content, post }) => ({
			postId,
			lastUpdated: post.lastUpdated,
			links: getExternalLinks(content).map((url) => ({ url, hash: hashLink(url) })),
		}))
		.filter(({ links }) => links.length);

	for (const { links } of articles) {
		stats.articles++;
		stats.links += links.length;
	}

	if (dryRun) {
		console.log('dry run', stats);
		return;
	}

	await prisma.$transaction(
		async (tx) => {
			for (const { postId, lastUpdated, links } of articles) {
				const { count } = await tx.content.createMany({
					data: links.map(({ url, hash }) => ({
						hash,
						name: url,
						type: LINK_CONTENT_TYPE,
						authorId: SYSTEM,
						createdTimestamp: lastUpdated,
					})),
					skipDuplicates: true,
				});

				const { count: redated } = await tx.content.updateMany({
					where: {
						hash: { in: links.map(({ hash }) => hash) },
						type: LINK_CONTENT_TYPE,
						createdTimestamp: { gt: lastUpdated },
					},
					data: { createdTimestamp: lastUpdated },
				});

				const contents = await tx.content.findMany({
					where: { hash: { in: links.map(({ hash }) => hash) } },
					select: { id: true },
				});

				const usages = await tx.yPostContent.createMany({
					data: contents.map(({ id }) => ({
						postId,
						contentId: id,
						createdTimestamp: lastUpdated,
					})),
					skipDuplicates: true,
				});

				stats.newContent += count;
				stats.redated += redated;
				stats.usages += usages.count;
			}

			await tx.content.createMany({
				data: [{ hash: wikiLinkHash, name: wikiLink, type: LINK_CONTENT_TYPE, authorId: SYSTEM }],
				skipDuplicates: true,
			});
		},
		{ timeout: TRANSACTION_TIMEOUT }
	);

	console.log('done', stats);
}

try {
	await main();
} finally {
	await prisma.$disconnect();
}
