import { defineExtension } from '@lexical/extension';

import { registerCollaboration } from './registerCollaboration';

/**
 * @typedef {Parameters<typeof registerCollaboration>[1]} CollaborationConfig
 */

export const CollaborationExtension = defineExtension({
	name: 'article/collaboration',
	config: /** @type {CollaborationConfig} */ ({
		id: '',
		provider: /** @type {any} */ (null),
		docMap: new Map(),
	}),
	register: (editor, config) => {
		if (!config.provider) {
			throw new Error('CollaborationExtension: configure it with a provider, id and docMap');
		}

		return registerCollaboration(editor, config);
	},
});
