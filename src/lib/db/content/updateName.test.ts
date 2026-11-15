import { beforeEach, expect, test, vi } from 'vitest';

import { updateContentName } from './updateName';

const state = vi.hoisted(() => ({
	name: 'forsen.png',
	recorded: 1,
	activities: [] as Record<string, unknown>[],
}));

vi.mock('$lib/prisma.server', () => {
	const tx = {
		content: {
			findUniqueOrThrow: async () => ({ name: state.name }),
			update: async ({ data }: { data: { name: string } }) => {
				state.name = data.name;

				return { name: data.name };
			},
		},
		activity: {
			count: async () => state.recorded,
			create: async ({ data }: { data: Record<string, unknown> }) => {
				state.activities.push(data);

				return { id: 'rename-activity' };
			},
		},
	};

	return { default: { $transaction: (run: (client: typeof tx) => unknown) => run(tx) } };
});

beforeEach(() => {
	state.name = 'forsen.png';
	state.recorded = 1;
	state.activities.length = 0;
});

test('renaming recorded content keeps the old and the new name on an activity', async () => {
	const result = await updateContentName('content', 'nymn.png', 'moderator');

	expect(result).toEqual({ content: { name: 'nymn.png' }, activity: { id: 'rename-activity' } });
	expect(state.activities).toEqual([
		{
			type: 'CONTENT_RENAME',
			userId: 'moderator',
			contentId: 'content',
			oldName: 'forsen.png',
			newName: 'nymn.png',
			children: { create: [] },
		},
	]);
});

test('keeping the same name is not an activity', async () => {
	const { activity } = await updateContentName('content', 'forsen.png', 'uploader');

	expect(activity).toBeNull();
	expect(state.activities).toEqual([]);
});

test('content no activity points to is renamed without one', async () => {
	state.recorded = 0;

	const { content, activity } = await updateContentName('content', 'nymn.png', 'uploader');

	expect(content).toEqual({ name: 'nymn.png' });
	expect(activity).toBeNull();
});
