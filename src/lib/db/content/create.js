import prisma from '$lib/prisma';

/**
 * @typedef {Omit<prisma<never, undefined, import('@prisma/client/runtime/client').DefaultArgs>, "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends">} PrismaTransaction
 */

/**
 * @param {{ name: string, hash: string, authorId: string, type: string, contentType: string, metadata: any }} CreateContentArg
 * @param {PrismaTransaction} tx
 */
export const createContent = async ({ name, hash, authorId, type, contentType, metadata }, tx = prisma) => {
	return tx.content.create({
		data: {
			name,
			hash,
			authorId,
			type,
			contentType,
			metadata,
		},
	});
};
