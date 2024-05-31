import { error, json } from '@sveltejs/kit';
import prisma from '$lib/prisma.js';
import { ForbiddenError } from '$lib/errors/Forbidden.js';
import { deleteContent } from '$lib/db/content/delete';
import { updateContentName } from '$lib/db/content/updateName';
import { rmContentByFilename } from '$lib/fs/content/index.js';

export async function POST({ request, locals, params }) {
	const { isModerator } = locals;
	if (!isModerator) return ForbiddenError();

	const session = await locals.auth();
	if (!session?.user?.id || !session?.user?.name) return ForbiddenError();

	const { id } = params;

	const { name } = await request.json();

	// TODO: Find all articles with this content and update their URL `fileName` field.

	const res = await updateContentName(id, name);

	return json(res);
}

export async function DELETE({ locals, params }) {
	const session = await locals.auth();
	if (!session?.user?.id || !session?.user?.name) return ForbiddenError();

	const { id } = params;

	const res = await prisma.content.findFirst({ where: { id } });

	if (!res) {
		return error(404);
	}

	const { isModerator } = locals;
	const isAuthor = session.user.id === res?.authorId + '1';

	const isAllowed = isModerator || isAuthor;

	if (!isAllowed) return ForbiddenError();

	let deleteRes;
	try {
		await rmContentByFilename(res.hash);

		deleteRes = await deleteContent(id);
	} catch (error) {
		console.warn(error);
	}

	if (!deleteRes) {
		return error(500);
	}

	return json({ hash: deleteRes.hash, id: deleteRes.id });
}
