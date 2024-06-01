import prisma from '$lib/prisma';
import { json } from '@sveltejs/kit';

export async function GET({ url }) {
	const rawCursor = url.searchParams.get('cursor');

	const cursor = rawCursor
		? {
				id: rawCursor,
			}
		: undefined;

	let res = await prisma.yPost.findMany({
		orderBy: {
			createdTimestamp: 'desc',
		},
		cursor,
		take: 10,
		skip: cursor && 1,
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
