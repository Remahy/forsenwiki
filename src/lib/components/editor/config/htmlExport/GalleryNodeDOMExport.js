import { isHTMLElement } from 'lexical';
import { GalleryNode } from '$lib/lexical/custom';
import { getYouTubeInfo } from '../../plugins/VideoEmbed/VideoEmbed';

/**
 * @type {[import("lexical").Klass<LexicalNode>, (editor: LexicalEditor, target: LexicalNode) => import("lexical").DOMExportOutput]}
 */
export default [
	GalleryNode,
	(editor, node) => {
		const output = node.exportDOM(editor);

		return {
			...output,
			after: (generatedElement) => {
				if (!isHTMLElement(generatedElement)) {
					return generatedElement;
				}

				const gallery = output.after ? output.after(generatedElement) : generatedElement;

				const topDiv = document.createElement('div');
				topDiv.classList.add('gallery');

				const clonedGallery = /** @type {HTMLElement} */ (gallery?.cloneNode());

				const wrapperDiv = document.createElement('div');
				wrapperDiv.classList.add('embla');

				const emblaContainerDiv = document.createElement('div');
				emblaContainerDiv.classList.add('embla__container');

				const { children } = generatedElement;

				const galleryChildren = [];
				for (let index = 0; index < children.length; index++) {
					const child = children[index];

					const clonedChild = child.cloneNode(true);

					const emblaSlideDiv = document.createElement('div');
					emblaSlideDiv.classList.add('embla__slide');

					emblaSlideDiv.appendChild(clonedChild);

					emblaContainerDiv.appendChild(emblaSlideDiv);

					child.remove();

					galleryChildren.push(clonedChild);
				}

				const fullscreenBtn = document.createElement('button');
				fullscreenBtn.classList.add('embla-fullscreen-button', 'button', 'm-0!', 'p-1!');
				fullscreenBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-maximize"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>`;

				clonedGallery.appendChild(emblaContainerDiv);
				wrapperDiv.appendChild(clonedGallery);
				wrapperDiv.appendChild(fullscreenBtn);
				topDiv.appendChild(wrapperDiv);

				if (galleryChildren.length <= 1) {
					return topDiv;
				}

				const emblaThumbsDiv = document.createElement('div');
				emblaThumbsDiv.classList.add('embla-thumbs');
				const emblaThumbsViewportDiv = document.createElement('div');
				emblaThumbsViewportDiv.classList.add('embla-thumbs__viewport');
				const emblaThumbsContainer = document.createElement('div');
				emblaThumbsContainer.classList.add('embla-thumbs__container');

				for (let index = 0; index < galleryChildren.length; index++) {
					const child = galleryChildren[index];

					/**
					 * @type {HTMLElement}
					 */
					let clonedChild = /** @type {any} */ (child.cloneNode(true));

					const isYouTube = clonedChild.dataset.lexicalYoutube;

					if (isYouTube) {
						const imgThumbnailElement = document.createElement('img');
						// Copy all attributes
						for (const attr of clonedChild.attributes) {
							imgThumbnailElement.setAttribute(attr.name, attr.value);
						}

						imgThumbnailElement.src = getYouTubeInfo(imgThumbnailElement.src).thumbnail || '';

						clonedChild = imgThumbnailElement;
					} else {
						clonedChild.removeAttribute('controls');
					}

					clonedChild.classList.add('pointer-events-none');

					const emblaSlideDiv = document.createElement('div');
					emblaSlideDiv.classList.add('embla-thumbs__slide');

					emblaSlideDiv.appendChild(clonedChild);

					emblaThumbsContainer.appendChild(emblaSlideDiv);
				}

				emblaThumbsViewportDiv.appendChild(emblaThumbsContainer);
				emblaThumbsDiv.appendChild(emblaThumbsViewportDiv);
				topDiv.appendChild(emblaThumbsDiv);

				return topDiv;
			},
		};
	},
];
