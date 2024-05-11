import { error } from "@sveltejs/kit"

/** @param {string} message */
export const ForbiddenError = (message = 'Forbidden') => {
	error(401, {
		message,
	})
}
