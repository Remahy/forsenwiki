import { CONTENT_PROTECTED } from '$lib/constants/content';
import { ErrorWithCode } from './ErrorWithCode';

export const ContentProtectedError = () => {
	const err = new ErrorWithCode('The link to the wiki itself cannot be deleted.');
	err.code = CONTENT_PROTECTED;

	return err;
};
