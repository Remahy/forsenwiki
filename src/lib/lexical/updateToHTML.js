import toHTML from '../../worker/toHTML/index.server';

/**
 * @param {string} update
 */
export const updateToHTML = async (update) => {
	try {
		const html = await toHTML({ config: 'article', update });

		return html;
	} catch (err) {
		console.error(err);
		throw 500;
	}
};
