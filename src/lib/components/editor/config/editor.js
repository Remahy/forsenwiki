import { defineExtension } from '@lexical/extension';

import { ATableExtension } from '../plugins/Overrides/Table/ATableExtension';
import { SelectionOverridesExtension } from '../plugins/SelectionOverridesExtension';
import { FloatBlockExtension } from '../plugins/FloatBlock/FloatBlockExtension';
import { EditorShortcutsExtension } from '../plugins/EditorShortcutsExtension';
import { GalleryEmblaExtension } from '../plugins/Gallery/GalleryEmblaExtension';
import { ImageExtension } from '../plugins/Image/ImageExtension';
import { VideoEmbedExtension } from '../plugins/VideoEmbed/VideoEmbedExtension';

export const editorExtension = defineExtension({
	name: 'article/editor',
	dependencies: [
		ATableExtension,
		SelectionOverridesExtension,
		FloatBlockExtension,
		EditorShortcutsExtension,
		GalleryEmblaExtension,
		ImageExtension,
		VideoEmbedExtension,
	],
});
