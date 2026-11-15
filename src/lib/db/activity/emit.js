import { replacer } from '$lib/utils/json';
import { _emit } from '../../../routes/api/adonis/frontpage/+server';
import { sendActivityWebhooks } from '$lib/webhooks/activity.server';
import { readActivitiesWhere } from './read';

/**
 * Call it once everything the activities point to is committed. Oldest is emitted first.
 * @param {Prisma.Prisma.ActivityWhereInput} where
 */
export const emitActivity = async (where) => {
	try {
		// It must be read as a non-moderator.
		const activities = await readActivitiesWhere(where, { isModerator: false });

		for (let index = 0; index < activities.length; index++) {
			const activity = activities[index];
			_emit('activity:create', JSON.stringify(activity, replacer));
		}

		// Not awaited because a slow or failing webhook must not hold up the request.
		sendActivityWebhooks(activities).catch(console.error);
	} catch (err) {
		console.error(err);
	}
};
