import { PrismaClient } from '@prisma/client'
import { _emit } from '../routes/adonis/frontpage/+server';

const p = new PrismaClient();

/**
 * @type {PrismaClient}
 */
const prisma = /** @type {any} */ (p.$extends({
	query: {
		user: {
			async create({ query, args }) {
				_emit('user:create', { name: args.data.name });
				return query(args);
			}
		},
		yPost: {
			async create({ query, args }) {
				// @ts-ignore
				const { user } = args._metadata;

				_emit('article:create', {
					title: args.data.title,
					rawTitle: args.data.rawTitle,
					createdTimestamp: args.data.createdTimestamp?.toString() || new Date().toString(),
					author: user.name
				});

				// @ts-ignore
				delete args._metadata;
				return query(args);
			},
			async update({ query, args }) {
				// @ts-ignore
				const { post, user } = args._metadata;
				
				_emit('article:update', {
					title: post.title,
					rawTitle: post.rawTitle,
					lastUpdated: args.data.lastUpdated?.toString(),
					author: user.name
				});

				// @ts-ignore
				delete args._metadata;
				return query(args);
			}
		},
	}
}));

export default prisma
