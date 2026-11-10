import {
	$applyNodeReplacement,
	ElementNode,
	type NodeKey,
	type SerializedElementNode,
} from 'lexical';

export type GalleryNodePayload = any;

export type SerializedGalleryNode = GalleryNodePayload & SerializedElementNode;

export class GalleryNode extends ElementNode {
	$config() {
		return this.config('gallery', { extends: ElementNode });
	}

	createDOM() {
		const div = document.createElement('div');
		div.classList.add('embla__viewport');

		return div;
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
