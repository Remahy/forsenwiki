import { error, redirect } from '@sveltejs/kit';
import { sanitizeTitle } from '$lib/components/editor/utils/sanitizeTitle';
import { _getYPostUpdate } from '../../../api/post/read/[title]/+server';
import { isSystem } from '$lib/utils/isSystem';
import prisma from '$lib/prisma.server';

export async function load({ params }) {
	const { sanitized: title } = sanitizeTitle(params.title);

	try {
		const res = await _getYPostUpdate(title);

		if (!res) {
			return error(404, 'Not found');
		}

		if (isSystem(res.post)) {
			return error(400, 'This is a system post that cannot be edited.');
		}

		return { ...res };
	} catch (err) {
		if (err === 404) {
			const post = await prisma.yPost.findUnique({ where: { id: title }, select: { title: true } });

			if (post) {
				return redirect(302, `/w/${post.title}/edit`);
			}
		}

		if (typeof err === 'number') {
			return error(err);
		}

		throw err;
	}
}
