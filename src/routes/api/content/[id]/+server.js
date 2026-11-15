import { error, json } from '@sveltejs/kit';
import prisma from '$lib/prisma.server';
import { ForbiddenError } from '$lib/errors/Forbidden';
import { deleteContent } from '$lib/db/content/delete';
import { updateContentName } from '$lib/db/content/updateName';
import { deleteByKey } from '$lib/s3/index.server.js';
import { emitActivity } from '$lib/db/activity/emit';

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

	const { content, activity } = await updateContentName(id, name, session.user.id);

	if (activity) {
		await emitActivity({ id: activity.id });
	}

	return json(content);
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
		deleteRes = await deleteContent(id, session.user.id);

		await deleteByKey(res.hash);
	} catch (err) {
		console.warn(err);
	}

	if (!deleteRes) {
		return error(500);
	}

	if (deleteRes.activity) {
		await emitActivity({ id: deleteRes.activity.id });
	}

	return json({ hash: deleteRes.content.hash, id: deleteRes.content.id });
}
