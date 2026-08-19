import type { LexicalEditor } from 'lexical';
import type { Doc } from 'yjs';
import type { ExcludedProperties, Provider } from '@lexical/yjs';

import { useYjsCollaborationV2__EXPERIMENTAL, useYjsHistoryV2 } from './LexicalCollaborationPlugin';

export const registerCollaborationPlugin = ({
	editor,
	id,
	doc,
	provider,
	docMap,

	username = '',
	cursorColor = '',

	__shouldBootstrapUnsafe = false,

	excludedProperties,
	rootName,
}: {
	editor: LexicalEditor;
	id: string;
	doc: Doc;
	provider: Provider;
	docMap: Map<string, Doc>;

	username?: string;
	cursorColor?: string;

	__shouldBootstrapUnsafe?: boolean;

	excludedProperties?: ExcludedProperties;

	rootName?: string;
}) => {
	const { binding, destroy: destroyCollaboration } = useYjsCollaborationV2__EXPERIMENTAL(
		editor,
		id,
		doc,
		provider,
		docMap,
		username,
		cursorColor,
		{
			__shouldBootstrapUnsafe,
			excludedProperties,
			rootName,
		}
	);

	const destroyHistory = useYjsHistoryV2(editor, binding);

	return () => {
		destroyHistory();
		destroyCollaboration();
	};
};
