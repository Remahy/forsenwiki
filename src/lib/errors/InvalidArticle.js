import { error } from "@sveltejs/kit"

/** @param {string} message */
export const InvalidArticle = (message = 'InvalidArticle') => {
	error(400, {
		message,
	})
}
