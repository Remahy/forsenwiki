import path from 'path';
import fs from 'fs/promises';
import { error, json } from '@sveltejs/kit';
import prisma from '$lib/prisma.js';
import { ForbiddenError } from '$lib/errors/Forbidden.js';
import { staticDir } from '../../../../../static';

export async function POST({ request, locals, params }) {
	const { isModerator } = locals;
	if (!isModerator) return ForbiddenError();

	const session = await locals.auth();
	if (!session?.user?.id || !session?.user?.name) return ForbiddenError();

	const { id } = params;

	const { name } = await request.json();

	// TODO: Find all articles with this content and update their URL `fileName` field.

	const res = await prisma.content.update({ where: { id }, data: { name }, select: { name: true } });

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
	if (!isModerator || session.user.id !== res?.authorId) return ForbiddenError();

	let deleteRes;
	try {
		const p = path.join(staticDir, res.hash);

		await fs.rm(p);

		deleteRes = await prisma.content.delete({ where: { id } });
	} catch (error) {
		console.warn(error);
	}

	if (!deleteRes) {
		return error(500);
	}

	return json({ hash: deleteRes.hash, id: deleteRes.id });
}
