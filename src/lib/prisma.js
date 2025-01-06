import { PrismaClient, Permissions as Perm } from '@prisma/client';
import { building } from '$app/environment';
import { _emit } from '../routes/adonis/frontpage/+server';
import { Y_POST_TYPES } from '../types';

const p = new PrismaClient();

/**
 * @type {PrismaClient}
 */
const prisma = /** @type {any} */ (
	p.$extends({
		query: {
			user: {
				async create({ query, args }) {
					_emit('user:create', { name: args.data.name });
					return query(args);
				},
			},
			yPost: {
				async create({ query, args }) {
					// @ts-ignore
					const { user } = args._metadata;

					_emit('article:create', {
						title: args.data.title,
						rawTitle: args.data.rawTitle,
						createdTimestamp: args.data.createdTimestamp?.toString() || new Date().toString(),
						author: user.name,
					});

					// @ts-ignore
					delete args._metadata;
					return query(args);
				},
				// See "src/routes/api/article/update/[title]/+server.js" for "article:update".
			},
		},
	})
);

if (!building) {
	const articleYPost = await prisma.yPost.findUnique({
		where: {
			id: Y_POST_TYPES.ARTICLE,
		},
	});

	if (!articleYPost) {
		console.error(
			new Error('Could not find post with article constant id, prisma:seed has not been run.')
		);
		process.exit(1);
	}
}

export default prisma;

export const Permissions = Perm;
