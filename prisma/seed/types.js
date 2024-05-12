import { PrismaClient } from '../../node_modules/.prisma/client/index.js'
import { Y_POST_TYPES, SYSTEM } from '../../src/lib/constants/yPostTypes.js'

const { ARTICLE, BIO } = Y_POST_TYPES;

const prisma = new PrismaClient()

async function yMain() {
	const sysUser = await prisma.user.upsert({
		where: { email: 'system@forsen.wiki' },
		update: {},
		create: {
			email: 'system@forsen.wiki',
			name: '%s [WIKI] System //\\\\',
			id: SYSTEM
		}
	})

	const sysPost = await prisma.yPost.upsert({
		where: { id: SYSTEM },
		update: {},
		create: {
			id: SYSTEM,
			postUpdates: {
				create: {
					title: 'SYSTEM',
					content: '',
					metadata: {
						create: {
							user: {
								connect: {
									id: sysUser.id
								}
							}
						}
					}
				}

			}
		}
	})

	const ids = [ARTICLE, BIO]

	const postPromises = []

	for (let index = 0; index < ids.length; index++) {
		const id = ids[index]
		postPromises.push(
			prisma.yPost.upsert({
				where: { id },
				update: {},
				create: {
					id,
					outRelations: {
						create: {
							isSystem: true,
							toPost: {
								connect: {
									id: sysPost.id
								}
							}
						}
					},
					postUpdates: {
						create: {
							content: '',
							title: id.toUpperCase(),
							metadata: {
								create: {
									user: {
										connect: {
											id: sysUser.id
										}
									}
								}
							}
						}
					}
				}
			})
		)
	}

	await Promise.all(postPromises)
}

try {
	await yMain()
	await prisma.$disconnect()
} catch (error) {
	await prisma.$disconnect()
	console.error(error)
	process.exit(1)
}
