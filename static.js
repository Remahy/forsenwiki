import fs, { constants } from 'fs/promises';
import path from 'path';

export async function checkStaticDir() {
	if (!process.env.STATIC_DIR) {
		throw new Error('Environment value STATIC_DIR has not been set.');
	}

	const base = import.meta.dirname;
	const p = path.resolve(base, process.env.STATIC_DIR);
	const normalized = path.normalize(p);

	try {
		await fs.access(normalized, constants.R_OK);
	} catch (error) {
		console.error(error);
		process.exit(1);
	}
}

