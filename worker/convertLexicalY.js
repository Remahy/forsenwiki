import { handleJobs } from './handleJobs.js';

import { $getRoot } from 'lexical';
import { buildEditorFromExtensions } from '@lexical/extension';
import { HeadlessExtension } from '@lexical/headless';
import { base64ToUint8Array, uint8ArrayToBase64 } from 'uint8array-extras';

import { readState, seedFromJSON } from '$lib/y/headless';
import { legacyUpdateToJSON } from '$lib/yjs/legacyUpdateToJSON';
import { articleExtension } from '$lib/components/editor/config/article';
import { EDITOR_IS_READONLY } from '$lib/constants/constants';

const $text = () => $getRoot().getTextContent();

/**
 * Seeds a `@lexical/y` document from an article stored by the Yjs 13 editor.
 * @param {{ update: string }} data The post's merged Yjs 13 updates, base64 V2.
 * @returns {{ content: string, byteLength: number, text: string, legacyText: string }}
 */
export const convertLegacyUpdate = ({ update }) => {
	const config = articleExtension(null, EDITOR_IS_READONLY, null);
	const json = legacyUpdateToJSON(base64ToUint8Array(update));

	const legacy = buildEditorFromExtensions(HeadlessExtension, config);
	legacy.setEditorState(legacy.parseEditorState(json));
	const legacyText = legacy.read($text);
	legacy.dispose();

	const seed = seedFromJSON(config, json);
	const text = readState(config, seed, $text);

	return { content: uint8ArrayToBase64(seed), byteLength: seed.byteLength, text, legacyText };
};

handleJobs(convertLegacyUpdate);
