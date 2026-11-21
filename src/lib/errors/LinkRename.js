import { error } from '@sveltejs/kit';

export const LinkRenameError = () => {
	error(400, {
		message: 'Links cannot be renamed.',
	});
};
