// Used to convert unconverted posts from YJS13 to LEXICAL_Y.

import dotenv from 'dotenv';
import dotenvExpand from 'dotenv-expand';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.ts';
import { SYSTEM } from '../src/lib/constants/constants.js';
import { mergeUpdatesV2 } from '@y/y';
import { base64ToUint8Array, uint8ArrayToBase64 } from 'uint8array-extras';

dotenvExpand.expand(dotenv.config());

// The worker bundle reads import.meta.env from process.env, so it loads after dotenv.
const { convertLegacyUpdate } = await import('../src/lib/worker/convertLexicalY/worker.js');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const onlyTitle = args.includes('--title') ? args[args.indexOf('--title') + 1] : null;

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const normalize = (/** @type {string} */ text) => text.replace(/\s+/g, ' ').trim();

async function main() {
	const posts = await prisma.yPost.findMany({
		where: onlyTitle ? { title: onlyTitle } : undefined,
		select: {
			id: true,
			title: true,
			postUpdates: {
				select: { content: true, format: true },
				orderBy: { createdTimestamp: 'asc' },
			},
		},
	});

	const stats = { converted: 0, skipped: 0, empty: 0, mismatched: 0, legacyBytes: 0, seedBytes: 0 };

	for (const post of posts) {
		if (post.postUpdates.some(({ format }) => format === 'LEXICAL_Y')) {
			stats.skipped++;
			continue;
		}

		const legacyRows = post.postUpdates.filter(({ content }) => content);

		if (!legacyRows.length) {
			stats.empty++;
			continue;
		}

		const merged = mergeUpdatesV2(legacyRows.map(({ content }) => base64ToUint8Array(content)));
		const { content, byteLength, text, legacyText } = convertLegacyUpdate({
			update: uint8ArrayToBase64(merged),
		});

		const same = normalize(text) === normalize(legacyText);
		if (!same) {
			stats.mismatched++;
		}

		stats.legacyBytes += merged.byteLength;
		stats.seedBytes += byteLength;

		console.log(
			`${same ? 'ok      ' : 'MISMATCH'} ${post.title}: ${merged.byteLength} -> ${byteLength} bytes`
		);

		if (dryRun) {
			continue;
		}

		await prisma.$transaction(async (tx) => {
			await tx.yPostUpdateMetadata.create({
				data: {
					user: { connect: { id: SYSTEM } },
					byteLength,
					postUpdate: {
						create: { content, format: 'LEXICAL_Y', post: { connect: { id: post.id } } },
					},
				},
			});

			await tx.yPost.update({ where: { id: post.id }, data: { totalByteLength: byteLength } });
		});

		stats.converted++;
	}

	console.log(dryRun ? 'dry run' : 'done', stats);
}

try {
	await main();
	await prisma.$disconnect();
	process.exit(0);
} catch (err) {
	console.error(err);
	await prisma.$disconnect();
	process.exit(1);
}
