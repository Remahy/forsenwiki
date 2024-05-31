import { sequence } from '@sveltejs/kit/hooks';
import prisma, { Permissions } from '$lib/prisma.js';
import '../static.js';
import { handle as authenticationHandle } from './auth';

/** @type {import('@sveltejs/kit').Handle} */
async function authorizationHandle({ event, resolve }) {
	// Protect paths here.
	// https://authjs.dev/reference/sveltekit#per-path

	const session = await event.locals.auth();

	event.locals.isModerator = false;

	if (session?.user?.id) {
		const permission = await prisma.permission.findFirst({ where: { userId: session.user.id } });
		event.locals.isModerator = permission?.type === Permissions.MODERATE || false;
		event.locals.isBlocked = permission?.type === Permissions.BLOCKED || false;
	}

	return resolve(event);
}

export const handle = sequence(authenticationHandle, authorizationHandle);
