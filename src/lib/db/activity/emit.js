import { replacer } from '$lib/utils/json';
import { _emit } from '../../../routes/api/adonis/frontpage/+server';
import { readActivity } from './read';

/**
 * Call it once everything the activity points to is committed.
 * @param {Prisma.Prisma.ActivityWhereInput} where
 */
export const emitActivity = async (where) => {
	try {
		const activity = await readActivity(where);

		if (activity) {
			_emit('activity:create', JSON.stringify(activity, replacer));
		}
	} catch (err) {
		console.error(err);
	}
};
