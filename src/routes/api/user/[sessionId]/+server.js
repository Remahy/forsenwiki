import prisma from '$lib/prisma.server';
import { ForbiddenError } from '$lib/errors/Forbidden';

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
	await prisma.session.deleteMany({ where: { userId: { equals: userId }, sessionToken: { not: sessionId } } });
}
