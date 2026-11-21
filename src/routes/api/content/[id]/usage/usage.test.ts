import { expect, test, vi } from 'vitest';

import { GET } from './+server';

vi.mock('$lib/prisma.server', () => ({
	default: {
		content: {
			findUnique: async ({ where }: { where: { id: string } }) =>
				where.id === 'image'
					? {
							id: 'image',
							hash: 'hash',
							name: 'forsen.png',
							type: 'image',
							usedIn: [
								{
									post: { title: 'forsen', rawTitle: 'Forsen' },
									postUpdateId: 'update',
									createdTimestamp: new Date(1000),
								},
								{
									post: { title: 'xqc', rawTitle: 'xQc' },
									postUpdateId: null,
									createdTimestamp: new Date(0),
								},
							],
						}
					: null,
		},
	},
}));

const usage = (id: string) => GET({ params: { id } } as never);

test('lists the articles that use content, with when and the update that added it', async () => {
	const response = await usage('image');

	expect(await response.json()).toEqual({
		id: 'image',
		hash: 'hash',
		name: 'forsen.png',
		type: 'image',
		usedIn: [
			{
				title: 'forsen',
				rawTitle: 'Forsen',
				postUpdateId: 'update',
				since: '1970-01-01T00:00:01.000Z',
			},
			{ title: 'xqc', rawTitle: 'xQc', postUpdateId: null, since: '1970-01-01T00:00:00.000Z' },
		],
	});
});

test('unknown content is not found', async () => {
	await expect(usage('missing')).rejects.toMatchObject({ status: 404 });
});
