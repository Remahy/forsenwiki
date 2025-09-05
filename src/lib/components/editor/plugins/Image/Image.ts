import type {
	DOMConversionMap,
	DOMConversionOutput,
	DOMExportOutput,
	EditorConfig,
	LexicalEditor,
	LexicalNode,
	NodeKey,
	SerializedLexicalNode,
	Spread,
} from 'lexical';

import { $applyNodeReplacement, DecoratorNode } from 'lexical';
import type { ComponentProps } from 'svelte';

import { IMAGE_MIN_HEIGHT, IMAGE_MIN_WIDTH } from '$lib/constants/image';

import ImageComponent from './ImageComponent.svelte';

export interface ImagePayload {
	src?: string;
	altText?: string;
	width?: number | 'inherit';
	height?: number | 'inherit';
	key?: NodeKey;
}

function convertImageElement(domNode: Node): null | DOMConversionOutput {
	const img = domNode as HTMLImageElement;
	if (img.src.startsWith('file:///')) {
		return null;
	}
	const { alt: altText, src, width, height } = img;
	const node = $createImageNode({ altText, height, src, width });
	return { node };
}

export type SerializedImageNode = Spread<
	{
		src?: string;
		altText?: string;
		width?: number | 'inherit';
		height?: number | 'inherit';
	},
	SerializedLexicalNode
>;

type DecoratorImageNodeType = {
	componentClass: typeof ImageComponent;
	updateProps: (props: ComponentProps<typeof ImageComponent>) => void;
};

export class ImageNode extends DecoratorNode<DecoratorImageNodeType> {
	__src: string | undefined;
	__altText: string | undefined;
	__width: 'inherit' | number;
	__height: 'inherit' | number;

	constructor(
		src?: string,
		altText?: string,
		width?: 'inherit' | number,
		height?: 'inherit' | number,
		key?: NodeKey
	) {
		super(key);

		this.__src = src;
		this.__altText = altText;
		this.__width = width || 'inherit';
		this.__height = height || 'inherit';
	}

	static getType(): string {
		return 'image';
	}

	static clone(node: ImageNode): ImageNode {
		return new ImageNode(node.__src, node.__altText, node.__width, node.__height, node.__key);
	}

	static importJSON(serializedNode: SerializedImageNode): ImageNode {
		const { altText, height, width, src } = serializedNode;
		const node = $createImageNode({
			src,
			altText,
			width,
			height,
		});

		return node;
	}

	static importDOM(): DOMConversionMap | null {
		return {
			img: (node: Node) => ({
				conversion: convertImageElement,
				priority: 0,
			}),
		};
	}

	// Getters

	getWidthAndHeight() {
		const self = this.getLatest();
		return { width: self.__width, height: self.__height };
	}

	getSrc(): string | undefined {
		const self = this.getLatest();
		return self.__src;
	}

	getAltText(): string | undefined {
		const self = this.getLatest();
		return self.__altText;
	}

	// Setters

	setWidthAndHeight({
		width,
		height,
	}: {
		width?: 'inherit' | number;
		height?: 'inherit' | number;
	}): void {
		const self = this.getWritable();
		self.__width =
			typeof width === 'number' ? Math.max(IMAGE_MIN_WIDTH, Math.round(width)) : 'inherit';
		self.__height =
			typeof height === 'number' ? Math.max(IMAGE_MIN_HEIGHT, Math.round(height)) : 'inherit';
	}

	setSrc(src?: string): void {
		const self = this.getWritable();
		self.__src = src;
	}

	setAltText(altText?: string): void {
		const self = this.getWritable();
		self.__altText = altText;
	}

	exportJSON(): SerializedImageNode {
		return {
			...super.exportJSON(),
			src: this.getSrc(),
			altText: this.getAltText(),
			...this.getWidthAndHeight(),
			type: ImageNode.getType(),
		};
	}

	// View

	exportDOM(editor: LexicalEditor): DOMExportOutput {
		const element = document.createElement('img');

		const theme = editor._config.theme;
		const className = theme?.image;
		if (className) {
			element.setAttribute('class', className);
		}

		const { width, height } = this.getWidthAndHeight();

		element.setAttribute('width', width.toString());
		element.setAttribute('height', height.toString());

		const src = this.getSrc();
		if (src) {
			element.setAttribute('src', src);
		}

		const altText = this.getAltText();
		if (altText) {
			element.setAttribute('alt', altText);
		}

		return { element };
	}

	createDOM(config: EditorConfig): HTMLElement {
		const span = document.createElement('span');

		const theme = config.theme;
		const className = theme?.image;
		if (className !== undefined) {
			span.setAttribute('class', className);
		}

		return span;
	}

	updateDOM(): boolean {
		return false;
	}

	decorate(editor: LexicalEditor, _config: EditorConfig): DecoratorImageNodeType {
		return {
			componentClass: ImageComponent,
			updateProps: (props: any) => {
				props.node = this;
				props.src = this.__src;
				props.altText = this.__altText;
				props.nodeKey = this.__key;
				props.width = this.__width;
				props.height = this.__height;
				props.resizable = true;
				props.editor = editor;
			},
		};
	}
}

export function $createImageNode(payload?: ImagePayload): ImageNode {
	const { src, altText, width, height, key } = payload || {};

	return $applyNodeReplacement(new ImageNode(src, altText, width, height, key));
}

export function $isImageNode(node: LexicalNode | null | undefined): node is ImageNode {
	return node instanceof ImageNode;
}

export const TRANSPARENT_IMAGE =
	'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

export const IMAGE_OFF =
	'data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8bGluZSB4MT0iMiIgeDI9IjIyIiB5MT0iMiIgeTI9IjIyIiAvPgogIDxwYXRoIGQ9Ik0xMC40MSAxMC40MWEyIDIgMCAxIDEtMi44My0yLjgzIiAvPgogIDxsaW5lIHgxPSIxMy41IiB4Mj0iNiIgeTE9IjEzLjUiIHkyPSIyMSIgLz4KICA8bGluZSB4MT0iMTgiIHgyPSIyMSIgeTE9IjEyIiB5Mj0iMTUiIC8+CiAgPHBhdGggZD0iTTMuNTkgMy41OUExLjk5IDEuOTkgMCAwIDAgMyA1djE0YTIgMiAwIDAgMCAyIDJoMTRjLjU1IDAgMS4wNTItLjIyIDEuNDEtLjU5IiAvPgogIDxwYXRoIGQ9Ik0yMSAxNVY1YTIgMiAwIDAgMC0yLTJIOSIgLz4KPC9zdmc+Cg==';

export const LUCIDE_ICON_LOADER =
	'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgY2xhc3M9Imx1Y2lkZSBsdWNpZGUtbG9hZGVyLWNpcmNsZSI+PHBhdGggZD0iTTIxIDEyYTkgOSAwIDEgMS02LjIxOS04LjU2Ii8+PC9zdmc+';
