// Used to convert unconverted posts from YJS13 to LEXICAL_Y.
//
// --dry-run       Convert and compare, write nothing. Exits with 1 if a post can't be converted.
// --all           Also compare the posts that are already converted. They are never written again.
// --title <title> Only this post.

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
const all = args.includes('--all');
const onlyTitle = args.includes('--title') ? args[args.indexOf('--title') + 1] : null;

const SHOWN_DIFFERENCES = 5;

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const notConverted = { postUpdates: { none: { format: /** @type {const} */ ('LEXICAL_Y') } } };

async function main() {
	const posts = await prisma.yPost.findMany({
		where: { ...(onlyTitle ? { title: onlyTitle } : {}), ...(all ? {} : notConverted) },
		select: { id: true, title: true },
		orderBy: { createdTimestamp: 'asc' },
	});

	const stats = { converted: 0, checked: 0, empty: 0, legacyBytes: 0, seedBytes: 0 };
	/** @type {string[]} */
	const mismatched = [];
	/** @type {string[]} */
	const failed = [];

	for (const post of posts) {
		try {
			const rows = await prisma.yPostUpdate.findMany({
				where: { postId: post.id },
				select: { content: true, format: true },
				orderBy: { createdTimestamp: 'asc' },
			});

			const legacyRows = rows.filter(({ content, format }) => format === 'YJS13' && content);

			if (!legacyRows.length) {
				stats.empty++;
				continue;
			}

			const merged = mergeUpdatesV2(legacyRows.map(({ content }) => base64ToUint8Array(content)));
			const { content, byteLength, differences } = convertLegacyUpdate({
				update: uint8ArrayToBase64(merged),
			});

			if (differences.length) {
				mismatched.push(post.title);
				console.error(
					`MISMATCH ${post.title}: ${differences.length} differences, not converted`,
					differences.slice(0, SHOWN_DIFFERENCES)
				);
				continue;
			}

			stats.legacyBytes += merged.byteLength;
			stats.seedBytes += byteLength;

			console.log(`ok       ${post.title}: ${merged.byteLength} -> ${byteLength} bytes`);

			if (dryRun || rows.some(({ format }) => format === 'LEXICAL_Y')) {
				stats.checked++;
				continue;
			}

			const written = await prisma.$transaction(async (tx) => {
				// Another instance may have converted the post since it was listed.
				if (await tx.yPostUpdate.count({ where: { postId: post.id, format: 'LEXICAL_Y' } })) {
					return false;
				}

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

				return true;
			});

			stats[written ? 'converted' : 'checked']++;
		} catch (err) {
			failed.push(post.title);
			console.error(`FAILED   ${post.title}: not converted`, err);
		}
	}

	console.log(dryRun ? 'dry run' : 'done', stats);

	if (mismatched.length || failed.length) {
		console.error('NOT CONVERTED', { mismatched, failed });
	}

	return mismatched.length + failed.length;
}

try {
	const notConvertedCount = await main();
	await prisma.$disconnect();
	process.exit(dryRun && notConvertedCount ? 1 : 0);
} catch (err) {
	console.error(err);
	await prisma.$disconnect();
	process.exit(1);
}
