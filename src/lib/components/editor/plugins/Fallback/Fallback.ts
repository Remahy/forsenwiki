import type { ComponentProps } from 'svelte';
import {
	$applyNodeReplacement,
	type DOMExportOutput,
	type ElementFormatType,
	type LexicalEditor,
	type LexicalNode,
	type NodeKey,
} from 'lexical';
import { DecoratorBlockNode } from '../VideoEmbed/DecoratorBlockNode';
import FallbackComponent from './FallbackComponent.svelte';

type FallbackNodeType = {
	componentClass: typeof FallbackComponent;
  updateProps: (props: ComponentProps<typeof FallbackComponent>) => void;
};

export class FallbackNode extends DecoratorBlockNode {
	__data: string;

	constructor({ data, format, key }: { format?: ElementFormatType; key?: NodeKey; data: string }) {
		super(format, key);
		this.__data = data;
	}

	static getType(): string {
		return 'fallback';
	}

	static clone(node: any): FallbackNode {
		return new FallbackNode({ data: node.__data, format: node.__format, key: node.__key });
	}

	exportDOM(): DOMExportOutput {
		const element = document.createElement('div');
		const p = document.createElement('p');
		const strong = document.createElement('strong');
		const italic = document.createElement('i');

		element.style.opacity = '0.8';

		p.style.backgroundColor = 'rgba(239, 68, 68, 1)';
		p.style.padding = '1rem';
		p.style.borderRadius = '8px';

		const data = JSON.parse(this.__data);

		italic.style.color = '#000';
		italic.textContent = `Invalid node of type: "${data?.type}"`;

		strong.appendChild(italic);
		p.appendChild(strong);
		element.appendChild(p);

		return { element };
	}

	static importJSON(serializedNode: any): FallbackNode {
		const node = new FallbackNode(serializedNode);

		node.setFormat(serializedNode.format);

		return node;
	}

	exportJSON() {
		return {
			...super.exportJSON(),
			type: FallbackNode.getType(),
			data: this.__data,
		};
	}

	// createDOM(_config: EditorConfig): HTMLElement {
	// 	return this.exportDOM().element as HTMLAnchorElement;
	// }

	updateDOM(): false {
		return false;
	}

	getTextContent(
		_includeInert?: boolean | undefined,
		_includeDirectionless?: false | undefined
	): string {
		return this.__data;
	}

	decorate(editor: LexicalEditor): FallbackNodeType {
		return {
			componentClass: FallbackComponent,
			updateProps: (props) => {
				props.node = this;
				props.nodeKey = this.__key;
				props.data = this.__data;
				props.editor = editor;
			},
		};
	}
}

export function $createFallbackNode(node?: {
	data: string;
	format?: ElementFormatType;
	key?: NodeKey;
}): FallbackNode {
	const { data = '', key, format } = node || {};

	return $applyNodeReplacement(new FallbackNode({ data, format, key }));
}

export function $isFallbackNode(
	node: FallbackNode | LexicalNode | null | undefined
): node is FallbackNode {
	return node instanceof FallbackNode;
}
