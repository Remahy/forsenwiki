export const load = async (event) => {
	const session = await event.locals.auth();

	const sanitizedSessionData = session
		? { expires: session.expires, user: { name: session.user?.name, image: session.user?.image } }
		: null;

	return {
		session: sanitizedSessionData,
		isModerator: event.locals.isModerator,
	};
};
