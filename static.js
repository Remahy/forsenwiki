import fs, { constants } from 'fs/promises';
import { STATIC_DIR, DEV_STATIC_DIR } from '$env/static/private';
import { STATIC_DOMAIN } from '$lib/environment/environment';
import { building, dev } from '$app/environment';

if (!STATIC_DIR) {
	throw new Error('Environment value STATIC_DIR has not been set.');
}

if (!STATIC_DOMAIN) {
	throw new Error('Environment value VITE_STATIC_DOMAIN has not been set.');
}

if (dev && !DEV_STATIC_DIR) {
	throw new Error('Development environment value DEV_STATIC_DIR has not been set.');
}

const dir = dev ? DEV_STATIC_DIR : STATIC_DIR;

if (!building) {
	try {
		await fs.access(dir, constants.R_OK);
	} catch (err) {
		console.error(err);
		process.exit(1);
	}
}

export const staticDir = dir;
