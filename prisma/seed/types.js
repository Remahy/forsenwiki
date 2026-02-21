import dotenv from 'dotenv';
import dotenvExpand from 'dotenv-expand';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../src/generated/prisma/client.ts';
import { SYSTEM, Y_POST_TYPES } from '../../src/lib/constants/constants.js';

dotenvExpand.expand(dotenv.config());

const { ARTICLE, BIO } = Y_POST_TYPES;

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function yMain() {
	const sysUser = await prisma.user.upsert({
		where: { email: 'system@forsen.wiki', id: SYSTEM },
		update: {},
		create: {
			email: 'system@forsen.wiki',
			name: '%s [WIKI] System //\\\\',
			id: SYSTEM,
		},
	});

	const sysPost = await prisma.yPost.upsert({
		where: { id: SYSTEM },
		update: {},
		create: {
			id: SYSTEM,
			title: SYSTEM.toUpperCase(),
			postUpdates: {
				create: {
					content: '',
					metadata: {
						create: {
							user: {
								connect: {
									id: sysUser.id,
								},
							},
						},
					},
				},
			},
		},
	});

	const ids = [ARTICLE, BIO];

	const postPromises = [];

	for (let index = 0; index < ids.length; index++) {
		const id = ids[index];
		postPromises.push(
			prisma.yPost.upsert({
				where: { id },
				update: {},
				create: {
					id,
					title: id.toUpperCase(),
					outRelations: {
						create: {
							isSystem: true,
							toPost: {
								connect: {
									id: sysPost.id,
								},
							},
						},
					},
					postUpdates: {
						create: {
							content: '',
							metadata: {
								create: {
									user: {
										connect: {
											id: sysUser.id,
										},
									},
								},
							},
						},
					},
				},
			})
		);
	}

	await Promise.all(postPromises);
}

try {
	await yMain();
	await prisma.$disconnect();
	process.exit(0);
} catch (err) {
	console.error(err);
	await prisma.$disconnect();
	process.exit(1);
}
