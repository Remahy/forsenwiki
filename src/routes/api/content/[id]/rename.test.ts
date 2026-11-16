import { expect, test, vi } from 'vitest';

import { updateContentName } from '$lib/db/content/updateName';
import { POST } from './+server';

vi.mock('$lib/prisma.server', () => ({
	default: {
		content: {
			findFirst: async ({ where }: { where: { id: string } }) => ({
				id: where.id,
				authorId: 'user',
				type: where.id === 'link' ? 'link' : 'image',
			}),
		},
	},
}));
vi.mock('$lib/db/content/updateName', () => ({
	updateContentName: vi.fn(async (_id: string, name: string) => ({
		content: { name },
		activity: null,
	})),
}));
vi.mock('$lib/s3/index.server.js', () => ({ deleteByKey: vi.fn() }));
vi.mock('$lib/db/activity/emit', () => ({ emitActivity: vi.fn() }));

const rename = (id: string) =>
	POST({
		request: new Request(`http://localhost/api/content/${id}`, {
			method: 'POST',
			body: JSON.stringify({ name: 'renamed' }),
		}),
		params: { id },
		locals: {
			isBlocked: false,
			isModerator: true,
			auth: async () => ({ user: { id: 'moderator', name: 'moderator' } }),
		},
	} as never);

test('links cannot be renamed, uploads can', async () => {
	await expect(rename('link')).rejects.toMatchObject({ status: 400 });
	expect(updateContentName).not.toHaveBeenCalled();

	const response = await rename('upload');
	expect(await response.json()).toEqual({ name: 'renamed' });
});
