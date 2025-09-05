/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {
	EditorConfig,
	ElementFormatType,
	LexicalNode,
	LexicalUpdateJSON,
	NodeKey,
	SerializedLexicalNode,
	Spread,
	LexicalEditor,
} from 'lexical';

import { DecoratorNode } from 'lexical';
import { getFormat, getFormatType, ELEMENT_FORMAT_TO_TYPE } from '../../utils/elementUtils';

export const decoratorFormatToMarginStyle = (type: ElementFormatType) => {
	switch (type) {
		case 'left':
			return 'margin-right:auto;';
		case 'center':
			return 'margin-right:auto;margin-left:auto;';
		case 'right':
			return 'margin-left:auto;';
		case 'justify':
			return '';
		case 'start':
			return 'margin-inline-start:auto;';
		case 'end':
			return 'margin-inline-end:auto;';
		default:
			return '';
	}
};

export type SerializedDecoratorBlockNode = Spread<
	{ format: ElementFormatType; direction: null | 'ltr' | 'rtl' },
	SerializedLexicalNode
>;

export class DecoratorBlockNode extends DecoratorNode<unknown> {
	__format: keyof typeof ELEMENT_FORMAT_TO_TYPE = 0;
	__dir: null | 'ltr' | 'rtl' = null;

	constructor(format?: ElementFormatType, key?: NodeKey) {
		super(key);
		if (format) {
			this.__format = getFormat(format);
		}
	}

	setFormat(type: ElementFormatType) {
		const self = this.getWritable();
		self.__format = getFormat(type);
		return self;
	}

	setDirection(direction: null | 'ltr' | 'rtl') {
		const self = this.getWritable();
		self.__dir = direction;
		return self;
	}

	getFormat() {
		const self = this.getLatest();
		return self.__format;
	}

	getFormatType() {
		const format = this.getFormat();
		return getFormatType(format);
	}

	getDirection() {
		const self = this.getLatest();
		return self.__dir;
	}

	exportJSON(): SerializedDecoratorBlockNode {
		return { ...super.exportJSON(), direction: this.getDirection(), format: this.getFormatType() };
	}

	updateFromJSON(serializedNode: LexicalUpdateJSON<SerializedDecoratorBlockNode>) {
		return super
			.updateFromJSON(serializedNode)
			.setFormat(serializedNode.format || '')
			.setDirection(serializedNode.direction);
	}

	canIndent(): false {
		return false;
	}

	// This DOM is for the editor.
	createDOM(_: EditorConfig, __: LexicalEditor): HTMLElement {
		const element = document.createElement('div');

		element.style.width = 'fit-content';
		// element.style.lineHeight = '1'; In editor we like to add a little bit of "space" to decorator blocks.

		return element;
	}

	updateDOM(): false {
		return false;
	}

	isInline(): false {
		return false;
	}
}

export function $isDecoratorBlockNode(
	node: LexicalNode | null | undefined
): node is DecoratorBlockNode {
	return node instanceof DecoratorBlockNode;
}
