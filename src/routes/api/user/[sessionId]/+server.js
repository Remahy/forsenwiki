import { json } from '@sveltejs/kit';
import prisma from '$lib/prisma.server';
import { ForbiddenError } from '$lib/errors/Forbidden';

/**
 * @param {string} id
 */
const getUploads = (id) => {
	return prisma.content.findMany({
		where: { authorId: id },
		select: {
			id: true,
			createdTimestamp: true,
			name: true,
			hash: true,
			type: true,
			contentLength: true,
		},
		orderBy: { createdTimestamp: 'desc' },
	});
};

/**
 * @typedef {Awaited<ReturnType<getUploads>>} Uploads
 */

/**
 * @param {Date} date
 */
const _isWithinLast24Hours = (date) => {
	const now = new Date().getTime();
	const inputDate = date.getTime();

	const diffMs = now - inputDate;
	const oneDayMs = 24 * 60 * 60 * 1000;

	return diffMs >= 0 && diffMs <= oneDayMs;
};

export async function DELETE({ params, locals }) {
	const { auth } = locals;

	const session = await auth();
	if (!session?.user?.id || !session?.user?.name) {
		return ForbiddenError();
	}

	const userId = session.user.id;

	const { sessionId } = params;

	const sessionEntry = await prisma.session.findUnique({ where: { sessionToken: sessionId } });

	if (!sessionEntry || sessionEntry.userId !== userId) {
		return ForbiddenError();
	}

	if (!_isWithinLast24Hours(sessionEntry.createdAt)) {
		return ForbiddenError();
	}

	// Anonymize name.
	await prisma.user.update({
		where: { id: userId },
		data: {
			name: 'Deleted account',
			email: null,
			emailVerified: null,
			image: null,
			createdAt: new Date(0),
		},
	});

	// Remove Account
	await prisma.account.deleteMany({ where: { userId: { equals: userId } } });

	// Delete all sessions.
	await prisma.session.deleteMany({
		where: { userId: { equals: userId }, sessionToken: { not: sessionId } },
	});
}

export async function GET({ params, locals }) {
	const { auth } = locals;

	const session = await auth();
	if (!session?.user?.id || !session?.user?.name) {
		return ForbiddenError();
	}

	const { id, image, name } = session.user;

	const { sessionId } = params;

	const sessionEntry = await prisma.session.findUnique({ where: { sessionToken: sessionId } });

	if (!sessionEntry || sessionEntry.userId !== id) {
		return ForbiddenError();
	}

	if (!_isWithinLast24Hours(sessionEntry.createdAt)) {
		return ForbiddenError();
	}

	const accounts = await prisma.account.findMany({
		where: { userId: id },
		select: { scope: true, provider: true, providerAccountId: true, type: true, createdAt: true },
	});

	const uploads = await getUploads(id);

	const data = {
		id,
		name,
		image,
		accounts,
		uploads,
	};

	return json(data);
}
