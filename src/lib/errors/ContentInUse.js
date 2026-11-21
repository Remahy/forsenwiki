import { CONTENT_IN_USE } from '$lib/constants/content';
import { ErrorWithCode } from './ErrorWithCode';

/** @param {number} [usages] Unknown when an article started using it during the delete. */
export const ContentInUseError = (usages) => {
	const articles = usages ? `${usages} article${usages === 1 ? '' : 's'}` : 'an article';
	const err = new ErrorWithCode(
		`This content is used in ${articles} and cannot be deleted. Remove it from them first.`
	);
	err.code = CONTENT_IN_USE;

	return err;
};
