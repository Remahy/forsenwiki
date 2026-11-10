import '../registerDOM.js';

import { handleJobs } from '../handleJobs.js';

import { $getEditor, $getRoot, $nodesOfType } from 'lexical';
import { $generateHtmlFromNodes } from '@lexical/html';
import { buildEditorFromExtensions } from '@lexical/extension';
import { HeadlessExtension } from '@lexical/headless';
import { base64ToUint8Array } from 'uint8array-extras';

import { readState } from '$lib/y/headless';
import { YJS13 } from '$lib/y/rows';
import { legacyUpdateToJSON } from '$lib/yjs/legacyUpdateToJSON';
import { articleExtension } from '$lib/components/editor/config/article';
import { diffExtension } from '$lib/components/editor/config/diff';
import { EDITOR_IS_READONLY } from '$lib/constants/constants';
import { ImageNode } from '$lib/lexical/custom';
import { migrations } from '$lib/components/editor/migrations';
import { twitchThumbnailURL } from './twitchThumbnailURL';

const $$getTextInEditor = () => {
	return $getRoot().getTextContent().trim().replace(/\n+/gm, '\n');
};

const $$getFirstImage = () => {
	const images = $nodesOfType(ImageNode);
	const firstImage = /** @type {ImageNode | null} */ (images?.[0]);

	return firstImage?.getSrc() || '';
};

/**
 * @param {string} html
 */
const addTwitchThumbnails = async (html) => {
	const replacedHTML = new DOMParser().parseFromString(
		`<html><body>${html}</body></html>`,
		'text/html'
	);
	/** @type {NodeListOf<HTMLImageElement>} */
	const twitchImages = replacedHTML.querySelectorAll('img[data-lexical-twitch][data-replace-me]');

	for (let index = 0; index < twitchImages.length; index++) {
		const image = twitchImages[index];
		const thumbnailURL = await twitchThumbnailURL({ url: image.src });

		// A missing thumbnail becomes `src="null"`, same as before.
		image.src = /** @type {string} */ (thumbnailURL);
	}

	return replacedHTML.body.innerHTML;
};

/**
 * @param {{ config: string, update?: string, content?: string, format?: import('$lib/y/rows').YPostUpdateFormat }} data
 */
export const toHTMLWorker = async ({ config, content, update, format }) => {
	if (!config) {
		throw new Error('No config string provided.');
	}

	if (!content && !update) {
		throw new Error('No content and/or update provided.');
	}

	let cfg;
	switch (config) {
		case 'diff':
			cfg = diffExtension;
			break;
		default:
			cfg = articleExtension;
			break;
	}

	const $render = () => {
		const editor = $getEditor();
		const text = $$getTextInEditor().replace(/\n/g, ' ');
		const image = $$getFirstImage();
		const htmlString = $generateHtmlFromNodes(editor, null);

		/**
		 * @type {{ html: string, text: string, image?: string }}
		 */
		const response = { html: htmlString, text, image };

		return response;
	};

	/** @type {ReturnType<typeof $render>} */
	let rendered;
	if (update && format !== YJS13) {
		rendered = readState(cfg(null, EDITOR_IS_READONLY, null), base64ToUint8Array(update), $render);
	} else {
		const editor = buildEditorFromExtensions(
			HeadlessExtension,
			cfg(null, EDITOR_IS_READONLY, null)
		);

		const json = update
			? legacyUpdateToJSON(base64ToUint8Array(update))
			: JSON.parse(/** @type {string} */ (content));

		editor.setEditorState(editor.parseEditorState(json));

		migrations(editor);

		rendered = editor.read($render);
		editor.dispose();
	}

	const { html, text, image } = rendered;

	let replacedHTMLString = await addTwitchThumbnails(html);

	return { html: replacedHTMLString, text, image };
};

handleJobs(toHTMLWorker);
