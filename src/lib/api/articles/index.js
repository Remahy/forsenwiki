import { encodeYDocToUpdateV2 } from "$lib/yjs/utils"

const jsonHeaders = new Headers({ 'content-type': 'application/json' })

/**
 * @param {string} title
 * @param {YDoc} yDoc
 */
export const createArticle = async (title, yDoc) => {
	const encodedContent = encodeYDocToUpdateV2(yDoc)

	const body = JSON.stringify({ title, content: encodedContent });

	return fetch('/api/article/create', { method: 'POST', body, headers: jsonHeaders })
}
