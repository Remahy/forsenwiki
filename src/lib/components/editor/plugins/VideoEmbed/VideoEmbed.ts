/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {
	DOMConversionMap,
	DOMConversionOutput,
	DOMExportOutput,
	EditorConfig,
	ElementFormatType,
	LexicalEditor,
	LexicalNode,
	NodeKey,
	Spread,
} from 'lexical';
import { sanitizeUrl } from 'svelte-lexical';

import { DOMAIN } from '$lib/environment/environment';

import VideoEmbedComponent from './VideoEmbedComponent.svelte';
import { DecoratorBlockNode, type SerializedDecoratorBlockNode } from './DecoratorBlockNode';
import { VIDEO_CONSTANTS } from '$lib/constants/video';

export type SupportedPlatforms = 'twitch' | 'youtube';

export const getURLAndTitle = (
	platform: SupportedPlatforms,
	src: string,
	parentUrl: string
): { url: string; title: string } => {
	try {
		new URL('', src);
	} catch {
		return {
			url: '',
			title: 'Unknown source',
		};
	}

	if (platform === 'youtube') {
		const url = new URL('', src);
		const v = url.searchParams.get('v');
		const youtuBE = url.hostname === 'youtu.be' ? url.pathname : null;
		const vPathname = url.pathname.startsWith('/v/')
			? url.pathname.split('/').pop()?.split('?').shift()
			: null;

		if ((v || youtuBE || vPathname) === null) {
			return {
				url: '',
				title: 'Unknown source',
			};
		}

		return {
			url: `https://www.youtube-nocookie.com/embed/${v || youtuBE || vPathname}`,
			title: 'YouTube video',
		};
	}

	const parent = new URL('', parentUrl).hostname;

	if (platform === 'twitch') {
		const url = new URL('', src);

		// Figure out if clip url
		const isClipUrl = url.hostname === 'clips.twitch.tv';

		if (isClipUrl) {
			const clipSlug = url.pathname.split('/').pop();

			if (clipSlug) {
				const clipsTwitchURL = new URL('embed', 'https://clips.twitch.tv/');
				clipsTwitchURL.searchParams.set('clip', clipSlug);
				clipsTwitchURL.searchParams.set('parent', parent);

				return {
					url: clipsTwitchURL.toString(),
					title: 'Twitch clip',
				};
			}
		}

		const isTwitchUrl = url.hostname === 'www.twitch.tv' || url.hostname === 'twitch.tv';
		const videoID = url.pathname.startsWith('/videos/')
			? url.pathname.split('/').pop()?.split('?').shift()
			: null;
		if (isTwitchUrl && videoID) {
			const playerTwitchURL = new URL('', 'https://player.twitch.tv/');
			playerTwitchURL.searchParams.set('video', videoID);

			const t = url.searchParams.get('t');
			if (t) {
				playerTwitchURL.searchParams.set('t', t);
			}

			playerTwitchURL.searchParams.set('parent', parent);

			return {
				url: playerTwitchURL.toString(),
				title: 'Twitch video',
			};
		}
	}

	return {
		url: '',
		title: 'Unknown source',
	};
};

function generateYouTubeIframe(node: VideoEmbedNode, parentUrl: string) {
	const { url, title } = getURLAndTitle(node.__platform, node.__src, parentUrl);

	const element = document.createElement('iframe');
	element.setAttribute('data-lexical-youtube', node.__src);
	element.setAttribute('width', node.__width.toString() || 'inherit');
	element.setAttribute('height', node.__height.toString() || 'inherit');
	element.setAttribute('src', url);
	element.setAttribute('frameborder', '0');
	element.setAttribute(
		'allow',
		'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
	);
	element.setAttribute('allowfullscreen', 'true');
	element.setAttribute('title', title);
	element.setAttribute('loading', 'lazy');

	if (!url) {
		element.setAttribute('class', 'bg-violet-500 bg-opacity-50');
		element.srcdoc = `<p style="color:#fff;"><strong>No valid URL is provided for this YouTube embed.</strong></p>`;
	}

	return { element };
}

function generateTwitchIframe(node: VideoEmbedNode, parentUrl: string) {
	const { url, title } = getURLAndTitle(node.__platform, node.__src, parentUrl);

	const element = document.createElement('iframe');
	element.setAttribute('data-lexical-twitch', node.__src);

	element.setAttribute('width', node.__width.toString() || 'inherit');
	element.setAttribute('height', node.__height.toString() || 'inherit');
	element.setAttribute('src', url);
	element.setAttribute('frameborder', '0');
	element.setAttribute(
		'allow',
		'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
	);
	element.setAttribute('allowfullscreen', 'true');
	element.setAttribute('title', title);
	element.setAttribute('loading', 'lazy');

	if (!url) {
		element.setAttribute('class', 'bg-violet-500 bg-opacity-50');
		element.srcdoc = `<p style="color:#fff;"><strong>No valid URL is provided for this Twitch embed.</strong></p>`;
	}

	return { element };
}

export type VideoEmbedComponentProps = Readonly<{
	// className: Readonly<{
	// 	base: string;
	// 	focus: string;
	// }>;
	format: ElementFormatType | null;
	nodeKey: NodeKey;
	platform: SupportedPlatforms;
	src: string;
}>;

export type VideoEmbedPayload = {
	platform: SupportedPlatforms;
	src: string;
	width: number | 'inherit';
	height: number | 'inherit';
};

export type SerializedVideoEmbedNode = Spread<VideoEmbedPayload, SerializedDecoratorBlockNode>;

function $convertVideoElement(domNode: HTMLElement): null | DOMConversionOutput {
	const youtubeVideoSrc = domNode.getAttribute('data-lexical-youtube');
	const width = domNode.getAttribute('width') ? Number(domNode.getAttribute('width')) : 'inherit';
	const height = domNode.getAttribute('height')
		? Number(domNode.getAttribute('height'))
		: 'inherit';

	if (youtubeVideoSrc) {
		const node = $createVideoEmbedNode({
			platform: 'youtube',
			src: youtubeVideoSrc,
			width,
			height,
		});
		return { node };
	}

	const twitchClipSrc = domNode.getAttribute('data-lexical-twitch-clip');

	if (twitchClipSrc) {
		const node = $createVideoEmbedNode({ platform: 'youtube', src: twitchClipSrc, width, height });
		return { node };
	}

	return null;
}

export class VideoEmbedNode extends DecoratorBlockNode {
	__platform: SupportedPlatforms;
	__src: string;
	__width: 'inherit' | number;
	__height: 'inherit' | number;

	static getType(): string {
		return 'youtube';
	}

	static clone(node: VideoEmbedNode): VideoEmbedNode {
		return new VideoEmbedNode(
			node.__platform,
			node.__src,
			node.__width,
			node.__height,
			node.__format,
			node.__key
		);
	}

	static importJSON(serializedNode: SerializedVideoEmbedNode): VideoEmbedNode {
		const node = $createVideoEmbedNode(serializedNode);
		node.setFormat(serializedNode.format);
		return node;
	}

	exportJSON(): SerializedVideoEmbedNode {
		return {
			...super.exportJSON(),
			type: 'videoembed',
			platform: this.__platform,
			src: this.__src,
			width: this.__width,
			height: this.__height,
			version: 1,
		};
	}

	constructor(
		platform: SupportedPlatforms,
		src: string,
		width: number | 'inherit',
		height: number | 'inherit',
		format?: ElementFormatType,
		key?: NodeKey
	) {
		super(format, key);
		this.__platform = platform;
		this.__src = src;
		this.__width = width;
		this.__height = height;
	}

	exportDOM(): DOMExportOutput {
		if (this.__platform === 'youtube') {
			return generateYouTubeIframe(this, DOMAIN);
		}

		if (this.__platform) {
			return generateTwitchIframe(this, DOMAIN);
		}

		const element = document.createElement('a');
		element.href = sanitizeUrl(this.__src);
		element.textContent = `${VIDEO_CONSTANTS.PLATFORMS[this.__platform]} link`;

		return { element };
	}

	static importDOM(): DOMConversionMap | null {
		return {
			iframe: (domNode: HTMLElement) => {
				if (!domNode.hasAttribute('data-lexical-youtube')) {
					return null;
				}
				return {
					conversion: $convertVideoElement,
					priority: 1,
				};
			},
		};
	}

	createDOM(config: EditorConfig): HTMLElement {
		const div = super.createDOM(config);

		const { theme } = config;
		const className = theme.image;
		if (className !== undefined) {
			div.className = className;
		}

		return div;
	}

	updateDOM(): false {
		return false;
	}

	getSrc(): string {
		return this.__src;
	}

	getPlatform(): string {
		return this.__platform;
	}

	getTextContent(
		_includeInert?: boolean | undefined,
		_includeDirectionless?: false | undefined
	): string {
		return this.__src;
	}

	setWidthAndHeight(width: 'inherit' | number, height: 'inherit' | number): void {
		const writable = this.getWritable();
		writable.__width = width;
		writable.__height = height;
	}

	setSrc(src: string): void {
		const writable = this.getWritable();
		writable.__src = src;
	}

	setPlatform(platform: string) {
		const writable = this.getWritable();
		if (['twitch', 'youtube'].includes(platform)) {
			writable.__platform = platform as SupportedPlatforms;
		}
	}

	decorate(editor: LexicalEditor, config: EditorConfig) {
		const embedBlockTheme = config.theme.embedBlock || {};
		// const className = {
		// 	base: embedBlockTheme.base || '',
		// 	focus: embedBlockTheme.focus || '',
		// };

		return {
			componentClass: VideoEmbedComponent,
			props: {
				node: this,
				platform: this.__platform,
				src: this.__src,
				format: this.__format,
				nodeKey: this.__key,
				width: this.__width,
				height: this.__height,
				resizable: true,
				editor: editor,
			},
		};
	}
}

export function $createVideoEmbedNode({
	platform,
	src,
	width,
	height,
}: VideoEmbedPayload): VideoEmbedNode {
	return new VideoEmbedNode(platform, src, width, height);
}

export function $isVideoEmbedNode(
	node: VideoEmbedNode | LexicalNode | null | undefined
): node is VideoEmbedNode {
	return node instanceof VideoEmbedNode;
}
