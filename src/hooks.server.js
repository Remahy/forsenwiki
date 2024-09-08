import { sequence } from '@sveltejs/kit/hooks';
import prisma, { Permissions } from '$lib/prisma';
import { CLOUDFLARE_API_TOKEN, CLOUDFLARE_ZONE_ID } from '$env/static/private';
import { validateToken } from '$lib/cloudflare.server';
import '../static';
import { handle as authenticationHandle } from './auth';

if (CLOUDFLARE_API_TOKEN && CLOUDFLARE_ZONE_ID) {
	const result = await validateToken();
	if (!result) {
		console.error('Could not validate Cloudflare token!');
		process.exit(1);
	}

	console.log('Cloudflare cache purging enabled.');
}

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
