export const load = async (event) => {
	const session = await event.locals.auth();

	const sanitizedSessionData = session
		? {
				expires: session.expires,
				user: {
					name: session.user?.name,
					image: session.user?.image,
					userSettings: session.user?.userSettings,
				},
			}
		: null;

	return {
		session: sanitizedSessionData,
		isModerator: event.locals.isModerator,
	};
};
