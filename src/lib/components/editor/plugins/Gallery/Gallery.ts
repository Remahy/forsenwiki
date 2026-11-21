import {
	$applyNodeReplacement,
	ElementNode,
	type DOMExportOutput,
	type ElementDOMSlot,
	type NodeKey,
	type SerializedElementNode,
} from 'lexical';

const createViewport = () => {
	const div = document.createElement('div');
	div.classList.add('embla__viewport');

	return div;
};

export type GalleryNodePayload = any;

export type SerializedGalleryNode = GalleryNodePayload & SerializedElementNode;

export class GalleryNode extends ElementNode {
	$config() {
		return this.config('gallery', { extends: ElementNode, children: 'block' });
	}

	createDOM() {
		const wrapper = document.createElement('div');
		wrapper.classList.add('editor-gallery');

		const handle = document.createElement('div');
		handle.classList.add('editor-gallery__handle');
		handle.contentEditable = 'false';
		handle.title = 'Select gallery';
		handle.textContent = 'Gallery';

		wrapper.append(handle, createViewport());

		return wrapper;
	}

	getDOMSlot(element: HTMLElement): ElementDOMSlot<HTMLElement> {
		const viewport = element.querySelector<HTMLElement>(':scope > .embla__viewport');

		return viewport ? super.getDOMSlot(element).withElement(viewport) : super.getDOMSlot(element);
	}

	// The handle is editor-only, so exports keep the bare viewport.
	exportDOM(): DOMExportOutput {
		return { element: createViewport() };
	}

	updateDOM() {
		return false;
	}

	isShadowRoot() {
		return true;
	}

	canBeEmpty() {
		return true;
	}
}

export function $createGalleryNode(payload?: GalleryNodePayload & { key?: NodeKey }) {
	const { key } = payload || {};
	return $applyNodeReplacement(new GalleryNode(key));
}

export function $isGalleryNode(node: any): node is GalleryNode {
	return node instanceof GalleryNode;
}
