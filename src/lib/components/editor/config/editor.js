import { defineExtension } from '@lexical/extension';

import { ATableExtension } from '../plugins/Overrides/Table/ATableExtension';
import { SelectionOverridesExtension } from '../plugins/SelectionOverridesExtension';
import { FloatBlockExtension } from '../plugins/FloatBlock/FloatBlockExtension';
import { EditorShortcutsExtension } from '../plugins/EditorShortcutsExtension';
import { GalleryExtension } from '../plugins/Gallery/GalleryExtension';
import { GalleryEmblaExtension } from '../plugins/Gallery/GalleryEmblaExtension';
import { VideoEmbedExtension } from '../plugins/VideoEmbed/VideoEmbedExtension';

export const editorExtension = defineExtension({
	name: 'article/editor',
	dependencies: [
		ATableExtension,
		SelectionOverridesExtension,
		FloatBlockExtension,
		EditorShortcutsExtension,
		GalleryExtension,
		GalleryEmblaExtension,
		VideoEmbedExtension,
	],
});
