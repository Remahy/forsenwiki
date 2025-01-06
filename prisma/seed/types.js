import { PrismaClient } from '@prisma/client';
import { SYSTEM, Y_POST_TYPES } from '../../src/types.js';

const { ARTICLE, BIO } = Y_POST_TYPES;

const prisma = new PrismaClient();

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
} catch (error) {
	await prisma.$disconnect();
	console.error(error);
	process.exit(1);
}
