import toHTML from "$lib/worker/toHTML";

/**
 * @param {string} update
 */
export const updateToHTML = async (update) => {
	try {
		const result = await toHTML({ config: 'article', update });

		return result;
	} catch (err) {
		console.error(err);
		throw 500;
	}
};
