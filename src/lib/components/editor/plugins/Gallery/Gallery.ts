import {
	$applyNodeReplacement,
	ElementNode,
	type EditorConfig,
	type NodeKey,
	type SerializedElementNode,
} from 'lexical';

type SupportedGalleryEntryType = 'image' | 'audio' | 'video';

type GalleryEntry = {
	id: string;
	type: SupportedGalleryEntryType;
};

export type GalleryNodePayload = any;

export type SerializedGalleryNode = GalleryNodePayload & SerializedElementNode;

export class GalleryNode extends ElementNode {
	constructor(key?: NodeKey) {
		super(key);
	}

	static getType() {
		return 'gallery';
	}

	static clone(node: GalleryNode) {
		return new GalleryNode(node.__key);
	}

	static importJSON(serializedNode: SerializedGalleryNode) {
		const node = $createGalleryNode(serializedNode).updateFromJSON(serializedNode);

		return node;
	}

	$config() {
		return this.config(GalleryNode.getType(), { extends: ElementNode });
	}

	createDOM() {
		const div = document.createElement('div');

		div.classList.add('gallery');

		return div;
	}

	updateDOM() {
		return true;
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
