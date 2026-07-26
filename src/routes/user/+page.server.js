import { redirect } from '@sveltejs/kit';

export async function load({ locals }) {
	const session = await locals.auth();

	if (!session?.user?.id) {
		return redirect(302, '/');
	}

	redirect(302, `/user/${session.user.id}`);
}
