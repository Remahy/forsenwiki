import { error, json } from '@sveltejs/kit';
import prisma from '$lib/prisma.server';
import { ForbiddenError } from '$lib/errors/Forbidden';
import { contentUploadActivities } from '$lib/db/activity/create';
import { emitActivity } from '$lib/db/activity/emit';
import { validateUploads } from '$lib/s3/validateUploads.server';

/**
 * Used to let the server know files has been successfully uploaded by the user.
 */
export async function POST({ request, locals }) {
	const { isBlocked, auth } = locals;

	if (isBlocked) {
		return ForbiddenError();
	}

	const session = await auth();
	if (!session?.user?.id || !session?.user?.name) {
		return ForbiddenError();
	}

	const authorId = session.user.id;

	/** @type {unknown} */
	const ids = await request.json();

	if (!Array.isArray(ids) || !ids.every((id) => typeof id === 'string')) {
		return error(400, 'Body must be an array of content ids.');
	}

	const pending = await prisma.content.findMany({
		where: { id: { in: ids }, authorId, activities: { none: {} } },
		select: { id: true, hash: true },
	});

	const failedUploads = await validateUploads(pending.map(({ hash }, index) => ({ index, hash })));
	const uploadedIds = pending
		.filter(({ hash }) => !failedUploads.some((failed) => failed.hash === hash))
		.map(({ id }) => id);

	if (!uploadedIds.length) {
		return json([]);
	}

	const created = await prisma.activity.createManyAndReturn({
		data: await contentUploadActivities(prisma, { authorId, ids: uploadedIds }),
		select: { id: true },
	});

	await emitActivity({ id: { in: created.map(({ id }) => id) } });

	return json(created);
}
