import prisma from '$lib/prisma.server';
import { json } from '@sveltejs/kit';

export async function POST({ request, locals }) {
	const session = await locals.auth();

	if(!session?.user?.id) {
		return json({ error: "Unauthorized" }, { status: 401 });
	}

	const { streamerMode } = await request.json();

	const updatedSettings = await prisma.userSettings.update({
		where: { userId: session.user.id },
		data: { streamerMode }
	});

	return json({ success: true, settings: updatedSettings });
}