import prisma from '$lib/prisma.server';
import { error, json } from '@sveltejs/kit';
import { toSafeJSON } from '$lib/utils/json';

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

	return json(toSafeJSON(res));
}
