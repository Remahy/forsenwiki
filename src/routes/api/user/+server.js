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

export async function DELETE({ locals }) {
	const { auth } = locals;

	const session = await auth();
	if (!session?.user?.id || !session?.user?.name) {
		return ForbiddenError();
	}

	const userId = session.user.id;

	const sessionEntry = await prisma.session.findFirst({
		where: { userId },
		orderBy: { createdAt: 'desc' },
	});

	if (!sessionEntry || sessionEntry.userId !== userId) {
		return ForbiddenError();
	}

	if (!_isWithinLast24Hours(sessionEntry.createdAt)) {
		return ForbiddenError();
	}

	const { sessionToken } = sessionEntry;

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
		where: { userId: { equals: userId }, sessionToken: { not: sessionToken } },
	});
}

export async function GET({ locals }) {
	const { auth } = locals;

	const session = await auth();
	if (!session?.user?.id || !session?.user?.name) {
		return ForbiddenError();
	}

	const { id: userId, image, name } = session.user;

	const sessionEntry = await prisma.session.findFirst({
		where: { userId },
		orderBy: { createdAt: 'desc' },
	});

	if (!sessionEntry) {
		return ForbiddenError();
	}

	if (!_isWithinLast24Hours(sessionEntry.createdAt)) {
		return ForbiddenError();
	}

	const accounts = await prisma.account.findMany({
		where: { userId },
		select: { scope: true, provider: true, providerAccountId: true, type: true, createdAt: true },
	});

	const uploads = await getUploads(userId);

	const data = {
		id: userId,
		name,
		image,
		accounts,
		uploads,
	};

	return json(data);
}
