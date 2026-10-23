import { json } from '@sveltejs/kit';
import prisma from '$lib/prisma.server';
import { ForbiddenError } from '$lib/errors/Forbidden.js';

export async function POST({ request, locals }) {
	const { auth } = locals;

	const session = await auth();
	if (!session?.user?.id || !session?.user?.name) {
		return ForbiddenError();
	}

	const { streamerMode } = await request.json();

	const updatedSettings = await prisma.userSettings.upsert({
		where: { userId: session.user.id },
		update: { streamerMode },
		create: { userId: session.user.id, streamerMode },
		select: { streamerMode: true },
	});

	return json(updatedSettings);
}
