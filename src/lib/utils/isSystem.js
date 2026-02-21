/**
 * @param {{ id: string, outRelations: Array<{ isSystem: boolean, toPostId: string }> }} post
 */
export const isSystem = (post) => {
	const isSystem =
		post.outRelations.find(({ isSystem, toPostId }) => isSystem && toPostId === 'system') ||
		post.id === 'system';

	if (isSystem) {
		return true;
	}

	return false;
};
