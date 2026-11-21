import { error, json } from '@sveltejs/kit';
import { readContentUsage } from '$lib/db/content/usage';

/**
 * `postUpdateId` is the update that added it or null if this is from backfill migration.
 * `since` is when the article started including it.
 */
export async function GET({ params }) {
	const content = await readContentUsage(params.id);

	if (!content) {
		return error(404);
	}

	const { usedIn, ...rest } = content;

	const mappedUsedIn = usedIn.map(({ post, postUpdateId, createdTimestamp }) => ({
		title: post.title,
		rawTitle: post.rawTitle,
		postUpdateId,
		since: createdTimestamp,
	}));

	return json({
		...rest,
		usedIn: mappedUsedIn,
	});
}
