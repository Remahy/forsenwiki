import {
	buildEditorFromExtensions,
	configExtension,
	SelectBlockExtension,
	SelectionAlwaysOnDisplayExtension,
} from '@lexical/extension';
import { RichTextExtension } from '@lexical/rich-text';
import { EditorStateExtension } from '@lexical/extension';
import { ListExtension } from '@lexical/list';
import { TableExtension } from '@lexical/table';
import { LinkExtension } from '@lexical/link';
import isUrl from 'is-url';
import { EDITOR_IS_EDITABLE } from '$lib/constants/constants';
import { articleConfig, editableTheme } from './config/article';

export const buildEditor = () => {
		const initialConfig = articleConfig(editableTheme, EDITOR_IS_EDITABLE, null);

	return buildEditorFromExtensions({
		name: '[root]',
		...initialConfig,
		dependencies: [
			RichTextExtension,
			configExtension(TableExtension, { hasCellBackgroundColor: false }),
			ListExtension,
			configExtension(LinkExtension, { validateUrl: isUrl }),
			EditorStateExtension,
			SelectBlockExtension,
			SelectionAlwaysOnDisplayExtension,
		],
	});
};
