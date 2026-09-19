import { error, json } from '@sveltejs/kit';
import { sanitizeTitle } from '$lib/components/editor/utils/sanitizeTitle';
import { readRangeByYPostAndRangeId } from '$lib/db/range/read';
import { isSystem } from '$lib/utils/isSystem';
import { ForbiddenError } from '$lib/errors/Forbidden';
import { deleteYPostRangeById } from '$lib/db/range/delete';
import { _getYPostByTitle } from '../../../read/[title]/+server';

export const DELETE = async ({ locals, params }) => {
	const { auth } = locals;

	const session = await auth();
	if (!session?.user?.id || !session?.user?.name) {
		return ForbiddenError();
	}

	const { sanitized: title } = sanitizeTitle(params.title);
	const { reactionId } = params;

	let post;
	try {
		post = await _getYPostByTitle(title);
	} catch (err) {
		if (typeof err === 'number') {
			return error(err);
		}

		throw err;
	}

	if (isSystem(post)) {
		return error(400, 'This is a system post that cannot receive a reaction.');
	}

	const range = await readRangeByYPostAndRangeId(post, reactionId);

	if (!range) {
		throw 404;
	}

	if (range.user.id !== session.user.id) {
		return ForbiddenError();
	}

	const res = await deleteYPostRangeById(reactionId);

	return json(res.id);
};
