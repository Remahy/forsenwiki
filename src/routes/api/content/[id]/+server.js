import { error, json } from '@sveltejs/kit';
import prisma from '$lib/prisma.server';
import { ForbiddenError } from '$lib/errors/Forbidden';
import { CONTENT_IN_USE, CONTENT_PROTECTED, deleteContent } from '$lib/db/content/delete';
import { ErrorWithCode } from '$lib/errors/ErrorWithCode';
import { LINK_CONTENT_TYPE } from '$lib/utils/externalLink';
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

	if (res.type === LINK_CONTENT_TYPE) {
		return error(400, 'Links cannot be renamed.');
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
	} catch (err) {
		if (err instanceof ErrorWithCode && err.code === CONTENT_IN_USE) {
			return error(409, err.message);
		}

		if (err instanceof ErrorWithCode && err.code === CONTENT_PROTECTED) {
			return error(403, err.message);
		}

		console.warn(err);
		return error(500);
	}

	try {
		if (res.type !== LINK_CONTENT_TYPE) {
			await deleteByKey(res.hash);
		}
	} catch (err) {
		console.warn(err);
	}

	if (deleteRes.activity) {
		await emitActivity({ id: deleteRes.activity.id });
	}

	return json({ hash: deleteRes.content.hash, id: deleteRes.content.id });
}
