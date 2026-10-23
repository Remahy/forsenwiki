import { error } from '@sveltejs/kit';
import prisma from '#lib/prisma.server.js';
import { ForbiddenError } from '#lib/errors/Forbidden.js';
import { deleteContent } from '#lib/db/content/delete.js';
import { updateContentName } from '#lib/db/content/updateName.js';
import { deleteByKey } from '#lib/s3/index.server.js';

export async function POST({ request, locals, params }) {
	const { isBlocked, isModerator, auth } = locals;

	if (isBlocked) {
		return ForbiddenError();
	}

	const session = await auth();
	if (!session?.user?.id || !session?.user?.name) {
		return ForbiddenError();
	}

	const { id } = params;

	const res = await prisma.content.findFirst({ where: { id } });

	if (!res) {
		return error(404);
	}

	const isAuthor = session.user.id === res.authorId;

	const isAllowed = isModerator || isAuthor;

	if (!isAllowed) {
		return ForbiddenError();
	}

	const { name } = await request.json();

	const updateRes = await updateContentName(id, name);

	return Response.json(updateRes);
}

export async function DELETE({ locals, params }) {
	const session = await locals.auth();

	if (!session?.user?.id || !session?.user?.name) {
		return ForbiddenError();
	}

	const { id } = params;

	const res = await prisma.content.findFirst({ where: { id } });

	if (!res) {
		return error(404);
	}

	const { isModerator } = locals;
	const isAuthor = session.user.id === res.authorId;

	const isAllowed = isModerator || isAuthor;

	if (!isAllowed) {
		return ForbiddenError();
	}

	let deleteRes;
	try {
		deleteRes = await deleteContent(id);

		await deleteByKey(res.hash);
	} catch (err) {
		console.warn(err);
	}

	if (!deleteRes) {
		return error(500);
	}

	return Response.json({ hash: deleteRes.hash, id: deleteRes.id });
}
