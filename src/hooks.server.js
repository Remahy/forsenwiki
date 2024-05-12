import { sequence } from "@sveltejs/kit/hooks"

import { handle as authenticationHandle } from "./auth"

/** @type {import('@sveltejs/kit').Handle} */
async function authorizationHandle ({ event, resolve }) {
	// Protect paths here.
	// https://authjs.dev/reference/sveltekit#per-path

	return resolve(event)
}

export const handle = sequence(authenticationHandle, authorizationHandle);
