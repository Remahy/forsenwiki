import './EditorGallery.css';

import { mount, unmount } from 'svelte';
import { mergeRegister, setDOMUnmanaged } from 'lexical';
import { defineExtension } from '@lexical/extension';
import { ImagesIcon } from '@lucide/svelte';

import { GalleryNode } from './Gallery';
import { initializeEmblaForEditorElement } from './embla';
import { isNodeSelected } from '../../utils/getSelection';

/** @param {Element} handle */
const mountHandleIcon = (handle) => {
	// Lexical evicts DOM added to its elements after reconciliation unless it's marked unmanaged.
	const target = document.createElement('span');
	target.classList.add('contents');
	setDOMUnmanaged(target);

	const icon = mount(ImagesIcon, { target, props: { size: 16 } });
	handle.prepend(target);

	return () => unmount(icon);
};

export const GalleryEmblaExtension = defineExtension({
	name: 'article/gallery-embla',
	register: (editor) => {
		/** @type {Map<string, { embla: ReturnType<import('./embla').Embla>, unmountIcon?: () => void }>} */
		const instances = new Map();

		/** @param {string} nodeKey */
		const destroy = (nodeKey) => {
			const instance = instances.get(nodeKey);

			if (!instance) {
				return;
			}

			instance.embla.destroy();

			instance.unmountIcon?.();

			instances.delete(nodeKey);
		};

		const unregister = mergeRegister(
			editor.registerMutationListener(GalleryNode, (mutations) => {
				for (const [nodeKey, mutation] of mutations) {
					if (mutation === 'destroyed') {
						destroy(nodeKey);
						continue;
					}

					if (mutation === 'created') {
						const element = editor.getElementByKey(nodeKey);
						const viewport = element?.querySelector(':scope > .embla__viewport');
						const handle = element?.querySelector(':scope > .editor-gallery__handle');

						if (!(viewport instanceof HTMLElement)) {
							continue;
						}

						instances.set(nodeKey, {
							embla: initializeEmblaForEditorElement(viewport),
							unmountIcon: handle ? mountHandleIcon(handle) : undefined,
						});
					}
				}
			}),
			editor.registerUpdateListener(() => {
				for (const [nodeKey, { embla }] of instances) {
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

			for (const nodeKey of [...instances.keys()]) {
				destroy(nodeKey);
			}
		};
	},
});
