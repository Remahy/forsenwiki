import prisma, { PostRangeType } from "$lib/prisma.server";

/**
 * @param {{ anchor: string, focus: string, type?: any, content: any }} argument
 * @param {{ user: { id: string }, post: { id: string } }} metadata
 */
export const createRange = ({ anchor, focus, content, type: _type }, metadata) => {
	const type = _type || PostRangeType.REACTION;

	return prisma.yPostRelativeRange.create({
		data: {
			postId: metadata.post.id,
			userId: metadata.user.id,
			type,
			content,
			anchor,
			focus,
		}
	});
};
