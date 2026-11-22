import toHTML from '$lib/worker/toHTML';
import { LEXICAL_Y } from '$lib/y/rows';

/**
 * @param {string} update
 * @param {import('$lib/y/rows').YPostUpdateFormat} [format]
 * @param {Record<string, string>} [titles]
 */
export const updateToHTML = async (update, format = LEXICAL_Y, titles) => {
	try {
		const result = await toHTML({ config: 'article', update, format, titles });

		return result;
	} catch (err) {
		console.error(err);
		throw 500;
	}
};
