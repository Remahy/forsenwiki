import fs, { constants } from 'fs/promises';
import { STATIC_DIR } from '$env/static/private';
import { STATIC_DOMAIN } from '$lib/environment/environment';
import { building } from '$app/environment';

if (!STATIC_DIR) {
	throw new Error('Environment value STATIC_DIR has not been set.');
}

if (!STATIC_DOMAIN) {
	throw new Error('Environment value VITE_STATIC_DOMAIN has not been set.');
}

if (!building) {
	try {
		await fs.access(STATIC_DIR, constants.R_OK);
	} catch (error) {
		console.error(error);
		process.exit(1);
	}
}

export const staticDir = STATIC_DIR;
