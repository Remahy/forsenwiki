import { json } from '@sveltejs/kit';
import prisma from '$lib/prisma.js';
import { ForbiddenError } from '$lib/errors/Forbidden.js';
import { InvalidQueryStrings } from '$lib/errors/InvalidQueryStrings.js';

export async function POST({ request, locals, url }) {
	const { isModerator } = locals;
	if (!isModerator) return ForbiddenError();

	const session = await locals.auth();
	if (!session?.user?.id || !session?.user?.name) return ForbiddenError();

	const id = url.searchParams.get('id');

	if (!id) return InvalidQueryStrings('No id provided');

	const { name } = await request.json();

	// TODO: Find all articles with this content and update their URL `fileName` field.

	const res = await prisma.content.update({ where: { id }, data: { name }, select: { name: true } });

	return json(res);
}
