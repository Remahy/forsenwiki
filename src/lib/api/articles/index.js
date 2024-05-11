import { encodeYDocToUpdateV2 } from "$lib/yjs/utils"

const jsonHeaders = new Headers({ 'content-type': 'application/json' })

/**
 * @param {YDoc} yDoc
 */
export const createArticle = async (yDoc) => {
	const encodedContent = encodeYDocToUpdateV2(yDoc)

	const body = encodedContent;

	return fetch('/api/article/create', { method: 'POST', body, headers: jsonHeaders })
}
