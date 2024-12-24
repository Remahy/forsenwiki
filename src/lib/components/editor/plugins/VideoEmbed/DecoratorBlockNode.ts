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
import type { Component, ComponentProps } from 'svelte';

export type SerializedDecoratorBlockNode = Spread<
	{
		format: ElementFormatType;
	},
	SerializedLexicalNode
>;

type DecoratorType = {
	component: Component<any>;
	props: ComponentProps<any>;
};

export class DecoratorBlockNode extends DecoratorNode<DecoratorType> {
	__format: ElementFormatType;

	constructor(format?: ElementFormatType, key?: NodeKey) {
		super(key);
		this.__format = format || '';
	}

	setFormat(format: ElementFormatType): void {
		const self = this.getWritable();
		self.__format = format;
	}

	exportJSON(): SerializedDecoratorBlockNode {
		return {
			format: this.__format || '',
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

	createDOM(_: EditorConfig): HTMLElement {
		return document.createElement('div');
	}
}

export function $isDecoratorBlockNode(
	node: LexicalNode | null | undefined
): node is DecoratorBlockNode {
	return node instanceof DecoratorBlockNode;
}
