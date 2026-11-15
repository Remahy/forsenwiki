import { beforeEach, expect, test, vi } from 'vitest';

import { emitActivity } from '$lib/db/activity/emit';
import { POST } from './+server';

const stored = vi.hoisted(() => [
	{ id: 'uploaded', hash: 'uploaded-hash', authorId: 'user', recorded: false },
	{ id: 'never-put', hash: 'never-put-hash', authorId: 'user', recorded: false },
	{ id: 'recorded', hash: 'recorded-hash', authorId: 'user', recorded: true },
	{ id: 'someone-elses', hash: 'someone-elses-hash', authorId: 'other', recorded: false },
]);
type Activity = { contentId: string; userId: string; type: string };

const activities = vi.hoisted(() => [] as Activity[]);

vi.mock('$lib/prisma.server', () => {
	const client = {
		content: {
			findMany: async ({ where }: { where: { id: { in: string[] }; authorId: string } }) =>
				stored.filter(
					(c) => where.id.in.includes(c.id) && c.authorId === where.authorId && !c.recorded
				),
		},
		activity: {
			createManyAndReturn: ({ data }: { data: Activity[] }) => {
				activities.push(...data);

				return data.map(({ contentId }) => ({ id: `activity-${contentId}` }));
			},
		},
	};

	return { default: client };
});
vi.mock('$lib/s3/validateUploads.server', () => ({
	validateUploads: vi.fn(async (hashes: { hash: string }[]) =>
		hashes.filter(({ hash }) => hash === 'never-put-hash')
	),
}));
vi.mock('$lib/db/activity/emit', () => ({ emitActivity: vi.fn() }));

const confirm = (ids: unknown) =>
	POST({
		request: new Request('http://localhost/api/content/uploaded', {
			method: 'POST',
			body: JSON.stringify(ids),
		}),
		locals: { isBlocked: false, auth: async () => ({ user: { id: 'user', name: 'user' } }) },
	} as never);

beforeEach(() => {
	activities.length = 0;
	vi.mocked(emitActivity).mockClear();
});

test('only own content that reached storage and has no activity yet is recorded', async () => {
	const response = await confirm(['uploaded', 'never-put', 'recorded', 'someone-elses']);

	expect(await response.json()).toEqual([{ id: 'activity-uploaded' }]);
	expect(activities).toEqual([
		expect.objectContaining({ type: 'CONTENT_UPLOAD', userId: 'user', contentId: 'uploaded' }),
	]);
	expect(emitActivity).toHaveBeenCalledExactlyOnceWith({ id: { in: ['activity-uploaded'] } });
});

test('a body that is not a list of ids is refused', async () => {
	await expect(confirm({ id: 'uploaded' })).rejects.toMatchObject({ status: 400 });
});
