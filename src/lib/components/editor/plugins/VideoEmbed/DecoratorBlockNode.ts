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
	NodeKey,
	SerializedLexicalNode,
	Spread,
} from 'lexical';

import { DecoratorNode } from 'lexical';
import { SvelteComponent, type ComponentProps } from 'svelte';
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

export const decoratorFormatToFlexStyle = (type: ElementFormatType) => {
	switch (type) {
		case 'left':
			return 'display:flex;justify-content:left;';
		case 'center':
			return 'display:flex;justify-content:center;';
		case 'right':
			return 'display:flex;justify-content:right;';
		case 'justify':
			return '';
		case 'start':
			return 'display:flex;justify-content:start;';
		case 'end':
			return 'display:flex;justify-content:end;';
		default:
			return '';
	}
};

export type SerializedDecoratorBlockNode = Spread<
	{
		format: ElementFormatType;
		direction: null | 'ltr' | 'rtl';
	},
	SerializedLexicalNode
>;

type DecoratorType = {
	componentClass: typeof SvelteComponent<any>;
	props: ComponentProps<any>;
};

export class DecoratorBlockNode extends DecoratorNode<DecoratorType> {
	__format: keyof typeof ELEMENT_FORMAT_TO_TYPE = 0;
	__dir: null | 'ltr' | 'rtl' = null;

	constructor(format?: ElementFormatType, key?: NodeKey) {
		super(key);

		if (format) {
			this.__format = getFormat(format);
		}
	}

	setFormat(type: ElementFormatType): void {
		const self = this.getWritable();
		self.__format = getFormat(type);
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
		return {
			...super.exportJSON(),
			direction: this.getDirection(),
			format: this.getFormatType(),
			type: 'decorator-block',
			version: 1,
		};
	}

	canIndent(): false {
		return false;
	}

	updateDOM(): false {
		return false;
	}

	isInline(): false {
		return false;
	}

	// This DOM is for the editor.
	createDOM(_: EditorConfig): HTMLElement {
		const div = document.createElement('div');
		return div;
	}
}

export function $isDecoratorBlockNode(
	node: LexicalNode | null | undefined
): node is DecoratorBlockNode {
	return node instanceof DecoratorBlockNode;
}
