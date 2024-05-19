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

import {$applyNodeReplacement, DecoratorNode} from 'lexical';
import {SvelteComponent, type ComponentProps} from 'svelte';
import ImageComponent from './ImageComponent.svelte';

export interface ImagePayload {
  altText: string;
  height?: number;
  key?: NodeKey;
  maxWidth?: number;
  src: string;
  width?: number;
}

function convertImageElement(domNode: Node): null | DOMConversionOutput {
  const img = domNode as HTMLImageElement;
  if (img.src.startsWith('file:///')) {
    return null;
  }
  const {alt: altText, src, width, height} = img;
  const node = $createImageNode({altText, height, src, width});
  return {node};
}

export type SerializedImageNode = Spread<
  {
    altText: string;
    height?: number;
    maxWidth: number;
    src: string;
    width?: number;
  },
  SerializedLexicalNode
>;

type DecoratorImageType = {
  componentClass: typeof SvelteComponent<any>;
  props: ComponentProps<ImageComponent>;
};

export class ImageNode extends DecoratorNode<DecoratorImageType> {
  __src: string;
  __altText: string;
  __width: 'inherit' | number;
  __height: 'inherit' | number;
  __maxWidth: number;

  static getType(): string {
    return 'image';
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(
      node.__src,
      node.__altText,
      node.__maxWidth,
      node.__width,
      node.__height,
      node.__key,
    );
  }

  static importJSON(serializedNode: SerializedImageNode): ImageNode {
    const {altText, height, width, maxWidth, src} =
      serializedNode;
    const node = $createImageNode({
      altText,
      height,
      maxWidth,
      src,
      width,
    });

    return node;
  }

  exportDOM(editor: LexicalEditor): DOMExportOutput {
    const theme = editor._config.theme
    const element = document.createElement('img');
    element.setAttribute('src', this.__src);
    element.setAttribute('alt', this.__altText);
    element.setAttribute('width', this.__width.toString());
    element.setAttribute('height', this.__height.toString());
 
    element.style.width = this.__width.toString()+'px';
    element.style.height = this.__height.toString()+'px';
    element.style.maxWidth = this.__maxWidth.toString()+'px';

    if (theme.image) {
      element.setAttribute('class', theme.image);
    }

    return {element};
  }

  static importDOM(): DOMConversionMap | null {
    return {
      img: (node: Node) => ({
        conversion: convertImageElement,
        priority: 0,
      }),
    };
  }

  constructor(
    src: string,
    altText: string,
    maxWidth: number,
    width?: 'inherit' | number,
    height?: 'inherit' | number,
    key?: NodeKey,
  ) {
    super(key);
    this.__src = src;
    this.__altText = altText;
    this.__maxWidth = maxWidth;
    this.__width = width || 'inherit';
    this.__height = height || 'inherit';
  }

  exportJSON(): SerializedImageNode {
    return {
      altText: this.getAltText(),
      height: this.__height === 'inherit' ? 0 : this.__height,
      maxWidth: this.__maxWidth,
      src: this.getSrc(),
      type: 'image',
      version: 1,
      width: this.__width === 'inherit' ? 0 : this.__width,
    };
  }

  setWidthAndHeight(
    width: 'inherit' | number,
    height: 'inherit' | number,
  ): void {
    const writable = this.getWritable();
    writable.__width = width;
    writable.__height = height;
  }

  setSrc(src: string): void {
    const writable = this.getWritable();
    writable.__src = src;
  }

  setAltText(altText: string): void {
    const writable = this.getWritable();
    writable.__altText = altText;
  }

  // View

  createDOM(config: EditorConfig): HTMLElement {
    const span = document.createElement('span');
    const theme = config.theme;
    const className = theme.image;
    if (className !== undefined) {
      span.className = className;
    }
    return span;
  }

  updateDOM(): false {
    return false;
  }

  getSrc(): string {
    return this.__src;
  }

  getAltText(): string {
    return this.__altText;
  }

  decorate(editor: LexicalEditor, config: EditorConfig): DecoratorImageType {
    return {
      componentClass: ImageComponent,
      props: {
        src: this.__src,
        altText: this.__altText,
        width: this.__width,
        height: this.__height,
        maxWidth: this.__maxWidth,
        nodeKey: this.__key,
        resizable: true,
        editor: editor,
      },
    };
  }
}

export function $createImageNode({
  altText,
  height,
  maxWidth = 500,
  src,
  width,
  key,
}: ImagePayload): ImageNode {
  return $applyNodeReplacement(
    new ImageNode(
      src,
      altText,
      maxWidth,
      width,
      height,
      key,
    ),
  );
}

export function $isImageNode(
  node: LexicalNode | null | undefined,
): node is ImageNode {
  return node instanceof ImageNode;
}

export const TRANSPARENT_IMAGE = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

export const IMAGE_OFF = 'data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8bGluZSB4MT0iMiIgeDI9IjIyIiB5MT0iMiIgeTI9IjIyIiAvPgogIDxwYXRoIGQ9Ik0xMC40MSAxMC40MWEyIDIgMCAxIDEtMi44My0yLjgzIiAvPgogIDxsaW5lIHgxPSIxMy41IiB4Mj0iNiIgeTE9IjEzLjUiIHkyPSIyMSIgLz4KICA8bGluZSB4MT0iMTgiIHgyPSIyMSIgeTE9IjEyIiB5Mj0iMTUiIC8+CiAgPHBhdGggZD0iTTMuNTkgMy41OUExLjk5IDEuOTkgMCAwIDAgMyA1djE0YTIgMiAwIDAgMCAyIDJoMTRjLjU1IDAgMS4wNTItLjIyIDEuNDEtLjU5IiAvPgogIDxwYXRoIGQ9Ik0yMSAxNVY1YTIgMiAwIDAgMC0yLTJIOSIgLz4KPC9zdmc+Cg=='
