import type { ElementFormatType, LexicalEditor, NodeKey } from 'lexical';
import { FallbackNode } from '../Fallback/Fallback';
import type { SupportedPlatforms } from '../VideoEmbed/VideoEmbed';

// Example of how to still support deprecated nodes.

export class DeprecatedVideoEmbedNode extends FallbackNode {
	constructor(
		platform: SupportedPlatforms,
		src: string,
		width: number | 'inherit',
		height: number | 'inherit',
		format?: ElementFormatType,
		key?: NodeKey
	) {
		super({
			format,
			key,
			data: JSON.stringify({
				type: DeprecatedVideoEmbedNode.getType(),
				platform,
				src,
				width,
				height,
			}),
		});
	}

	static getType(): string {
		return 'youtube';
	}

	static clone(node: any) {
		return new DeprecatedVideoEmbedNode(
			node.__platform,
			node.__src,
			node.__width,
			node.__height,
			node.__format,
			node.__key
		);
	}

	static importJSON(serializedNode: any) {
		const superJSON = FallbackNode.importJSON(serializedNode);
		superJSON.__type = DeprecatedVideoEmbedNode.getType();
		return superJSON;
	}

	decorate(editor: LexicalEditor) {
		return super.decorate(editor);
	}

	exportJSON() {
		return { ...super.exportJSON(), type: 'youtube' };
	}

	// TODO: Implement migration of deprecated node to new node.
}
