/**
 * @param {import("./$types").LayoutServerLoad} event
 * @returns 
 */
export const load = async (event) => {
	const session = await event.locals.auth()

	return {
		session,
	}
}