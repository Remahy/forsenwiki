// Realistically only used by backend.
import { buildEditorFromExtensions, getExtensionDependencyFromEditor } from '@lexical/extension';
import { HeadlessExtension } from '@lexical/headless';
import { createYCollabConfig, createYDoc, YCollabExtension } from '@lexical/y';
import { readYState, seedYState } from '@lexical/y/headless';
import { $getRoot, $parseSerializedNode } from 'lexical';

import { yCollabInput, yHeadlessConfig } from './config';
import {
	convertUpdateFormatV1ToV2,
	convertUpdateFormatV2ToV1,
	encodeYDocToUpdateV2,
	hasLegacyData,
} from './utils';

const settle = () => new Promise((resolve) => setTimeout(resolve));

/**
 * Whether an update comes from the Yjs 13 editor, e.g. a tab opened before the migration.
 * @param {Uint8Array} updateV2
 */
export function isLegacyUpdate(updateV2) {
	const doc = createYDoc(convertUpdateFormatV2ToV1(updateV2));

	try {
		return hasLegacyData(doc);
	} finally {
		doc.destroy();
	}
}

/**
 * A headless editor bound to a Yjs 14 document, so the backend can validate and adjust an
 * article between awaits and store what it wrote.
 * @param {import('lexical').AnyLexicalExtensionArgument} extension
 * @param {Uint8Array | null} [updateV2]
 */
export function getYAndEditor(extension, updateV2 = null) {
	const doc = createYDoc(updateV2 ? convertUpdateFormatV2ToV1(updateV2) : null);
	const editor = buildEditorFromExtensions(
		HeadlessExtension,
		extension,
		createYCollabConfig(yCollabInput(doc, { synced: true, captureTimeout: null }))
	);
	const { binding } = getExtensionDependencyFromEditor(editor, YCollabExtension).output;

	const flush = () => editor.update(() => {}, { discrete: true });

	flush();

	return {
		editor,
		doc,
		binding,
		/** Everything the editor holds, with the follow-ups of its last update included. */
		encodeV2: async () => {
			flush();
			await settle();
			flush();

			return encodeYDocToUpdateV2(doc);
		},
		dispose: () => {
			editor.dispose();
			doc.destroy();
		},
	};
}

/**
 * @template T
 * @param {import('lexical').AnyLexicalExtensionArgument} extension
 * @param {Uint8Array} updateV2
 * @param {() => T} $read
 */
export function readState(extension, updateV2, $read) {
	return readYState(convertUpdateFormatV2ToV1(updateV2), yHeadlessConfig(extension), $read);
}

/**
 * @param {import('lexical').AnyLexicalExtensionArgument} extension
 * @param {() => void} $build
 */
export function seedState(extension, $build) {
	return convertUpdateFormatV1ToV2(seedYState(yHeadlessConfig(extension), $build));
}

/**
 * @param {import('lexical').AnyLexicalExtensionArgument} extension
 * @param {import('lexical').SerializedEditorState} json
 */
export function seedFromJSON(extension, json) {
	return seedState(extension, () => {
		const root = $getRoot();

		root.clear();

		for (const child of json.root.children) {
			root.append($parseSerializedNode(child));
		}
	});
}
