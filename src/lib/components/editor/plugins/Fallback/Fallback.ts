import type { ComponentProps } from 'svelte';
import {
	$applyNodeReplacement,
	type DOMExportOutput,
	type ElementFormatType,
	type LexicalEditor,
	type LexicalNode,
	type LexicalUpdateJSON,
	type NodeKey,
	type Spread,
} from 'lexical';
import {
	DecoratorBlockNode,
	type SerializedDecoratorBlockNode,
} from '../VideoEmbed/DecoratorBlockNode';
import FallbackComponent from './FallbackComponent.svelte';

type FallbackNodeType = {
	componentClass: typeof FallbackComponent;
	updateProps: (props: ComponentProps<typeof FallbackComponent>) => void;
};

export type SerializedFallbackNode = Spread<{ data?: string }, SerializedDecoratorBlockNode>;

export function parseFallbackData(
	data: string | undefined
): ({ type?: string } & Record<string, unknown>) | null {
	try {
		const parsed = JSON.parse(data || '');
		return parsed && typeof parsed === 'object' ? parsed : null;
	} catch {
		return null;
	}
}

export class FallbackNode extends DecoratorBlockNode {
	__data: string | undefined;

	constructor(data?: string, format?: ElementFormatType, key?: NodeKey) {
		super(format, key);
		this.__data = data;
	}

	static getType(): string {
		return 'fallback';
	}

	static clone(node: FallbackNode): FallbackNode {
		return new FallbackNode(node.__data, node.getFormatType(), node.__key);
	}

	getDataType(): string {
		return parseFallbackData(this.getLatest().__data)?.type || this.getType();
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

		italic.style.color = '#000';
		italic.textContent = `Invalid node of type: "${this.getDataType()}"`;

		strong.appendChild(italic);
		p.appendChild(strong);
		element.appendChild(p);

		return { element };
	}

	static importDOM() {
		return DecoratorBlockNode.importDOM ? DecoratorBlockNode.importDOM() : null;
	}

	static importJSON(serializedNode: SerializedFallbackNode): FallbackNode {
		return $createFallbackNode().updateFromJSON(serializedNode);
	}

	updateFromJSON(serializedNode: LexicalUpdateJSON<SerializedFallbackNode>): this {
		// A node exported by us carries `data`, anything else is the original node itself.
		const data =
			typeof serializedNode.data === 'string'
				? serializedNode.data
				: JSON.stringify(serializedNode);

		const self = super.updateFromJSON(serializedNode).getWritable();
		self.__data = data;

		return self;
	}

	exportJSON(): SerializedFallbackNode {
		return {
			...super.exportJSON(),
			type: this.getType(),
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
		// The raw JSON would end up in the article text, so only use the original node's link.
		const data = parseFallbackData(this.getLatest().__data);
		const link = ['src', 'url', 'href'].map((key) => data?.[key]).find((value) => value);

		return typeof link === 'string' ? link : '';
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

	return $applyNodeReplacement(new FallbackNode(data, format, key));
}

export function $isFallbackNode(
	node: FallbackNode | LexicalNode | null | undefined
): node is FallbackNode {
	return node instanceof FallbackNode;
}
