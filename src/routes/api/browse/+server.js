import prisma from '$lib/prisma';
import { json } from '@sveltejs/kit';

export async function GET({ url }) {
	const rawCursor = url.searchParams.get('cursor');

	const cursor = rawCursor
		? {
				id: rawCursor,
			}
		: undefined;

	const res = await prisma.yPost.findMany({
		orderBy: [{ createdTimestamp: 'desc' }, { id: 'desc' }],
		...(cursor ? { cursor, skip: 1 } : {}),
		take: 10,
		select: {
			id: true,
			title: true,
			rawTitle: true,
			createdTimestamp: true,
			lastUpdated: true,
		},
	});

	return json(res);
}
