import prisma, { Permissions } from '$lib/prisma.js';

export const load = async (event) => {
	const session = await event.locals.auth();

	event.locals.isModerator = false;

	if (session?.user?.id) {
		const permission = await prisma.permission.findFirst({ where: { userId: session.user.id } });
		event.locals.isModerator = permission?.type === Permissions.MODERATE || false;
	}

	return {
		session,
		isModerator: event.locals.isModerator,
	};
};
