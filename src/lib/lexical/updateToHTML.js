import { base64ToUint8Array } from 'uint8array-extras';

import { getYjsAndEditor } from '$lib/yjs/getYjsAndEditor';
import { articleConfig } from '$lib/components/editor/config/article';
import { toHTML } from './toHTML.server';

/**
 * @param {string} update
 */
export const updateToHTML = async (update) => {
	try {
		const { editor } = getYjsAndEditor(
			articleConfig(null, false, null),
			base64ToUint8Array(update)
		);

		const html = await toHTML(editor);

		return html;
	} catch (err) {
		console.error(err);
		throw 500;
	}
};
