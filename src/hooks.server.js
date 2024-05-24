import { sequence } from '@sveltejs/kit/hooks';
import { checkStaticDir } from '../static.js';
import { handle as authenticationHandle } from './auth';
import { building } from '$app/environment';

if (!building) {
	// Make sure static directory can be written to.
	await checkStaticDir();
}

/** @type {import('@sveltejs/kit').Handle} */
async function authorizationHandle({ event, resolve }) {
	// Protect paths here.
	// https://authjs.dev/reference/sveltekit#per-path

	return resolve(event);
}

export const handle = sequence(authenticationHandle, authorizationHandle);
