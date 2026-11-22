import { invalidatePostCache } from '$lib/cloudflare.server';
import { updateHTMLIfUnchanged } from '$lib/db/post/html';
import { readYPostTitlesLinkedFrom, readYPostTitlesLinkingTo } from '$lib/db/post/read';
import { _renderYPostHTML } from '../../routes/api/post/read/[title]/+server';

/**
 * @param {string} postId
 */
export const refreshAfterRename = async (postId) => {
	// Their "Articles linking here" list the old title.
	const linkedFrom = await readYPostTitlesLinkedFrom(postId);

	for (const { title } of linkedFrom) {
		await invalidatePostCache(title);
	}

	const linking = await readYPostTitlesLinkingTo(postId);

	// One at a time, a queue of renders on the shared toHTML worker would time out.
	for (const { title } of linking) {
		try {
			const { post, html, text, image } = await _renderYPostHTML(title);

			if (html !== null) {
				// An article saved during the render has written newer HTML.
				await updateHTMLIfUnchanged(post.id, post.lastUpdated, { content: html, text, image });
			}

			await invalidatePostCache(title);
		} catch (err) {
			console.warn(err);
		}
	}
};
