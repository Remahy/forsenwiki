import prisma from '#lib/prisma.server.js';
import { error} from '@sveltejs/kit';

export async function GET({ params, locals }) {
	const { hash } = params;

	const res = await prisma.content.findUnique({ where: { hash } });

	if (!res) {
		return error(404);
	}

	const { isModerator } = locals;
	if (!isModerator) {
		res.metadata = {};
	}

	return Response.json(res);
}
