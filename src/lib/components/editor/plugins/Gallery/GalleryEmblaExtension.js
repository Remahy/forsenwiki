import './EditorGallery.css';

import { mergeRegister } from 'lexical';
import { defineExtension } from '@lexical/extension';

import { GalleryNode } from './Gallery';
import { initializeEmblaForEditorElement } from './embla';
import { isNodeSelected } from '../../utils/getSelection';

export const GalleryEmblaExtension = defineExtension({
	name: 'article/gallery-embla',
	register: (editor) => {
		/** @type {Map<string, ReturnType<import('./embla').Embla>>} */
		const instances = new Map();

		const unregister = mergeRegister(
			editor.registerMutationListener(GalleryNode, (mutations) => {
				for (const [nodeKey, mutation] of mutations) {
					if (mutation === 'destroyed') {
						instances.get(nodeKey)?.destroy();
						instances.delete(nodeKey);
						continue;
					}

					if (mutation === 'created') {
						const element = editor.getElementByKey(nodeKey);

						if (!element) {
							continue;
						}

						instances.set(nodeKey, initializeEmblaForEditorElement(element));
					}
				}
			}),
			editor.registerUpdateListener(() => {
				for (const [nodeKey, embla] of instances) {
					const element = editor.getElementByKey(nodeKey);

					if (element) {
						element.classList.toggle('focused', isNodeSelected(editor, nodeKey));
						embla.reInit();
					}
				}
			})
		);

		return () => {
			unregister();

			for (const embla of instances.values()) {
				embla.destroy();
			}

			instances.clear();
		};
	},
});
