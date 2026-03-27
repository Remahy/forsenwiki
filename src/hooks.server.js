import { sequence } from '@sveltejs/kit/hooks';
import prisma, { Permissions } from '$lib/prisma.server';
import { CLOUDFLARE_API_TOKEN, CLOUDFLARE_ZONE_ID } from '$env/static/private';
import { validateToken } from '$lib/cloudflare.server';
import '../static';
import { handle as authenticationHandle } from './auth';

import '$lib/goatcounter.server';

if (CLOUDFLARE_API_TOKEN && CLOUDFLARE_ZONE_ID) {
	const result = await validateToken();
	if (!result) {
		console.error(new Error('Could not validate Cloudflare token!'));
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

export const handleError = async ({ error }) => {
	/** @type {Error & { status: number } | null} */
	const e = /** @type {any} */ (error instanceof Error ? error : null);

	if (e?.message.includes('exceeds limit')) {
		return {
			// @ts-ignore
			status: e.status,
			message: e.message.replace('Content-length', 'Body'),
			code: 'PAYLOAD_TOO_LARGE',
		};
	}
};
