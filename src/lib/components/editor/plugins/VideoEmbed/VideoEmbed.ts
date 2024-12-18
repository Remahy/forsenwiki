/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
	$applyNodeReplacement,
	type DOMConversionMap,
	type DOMConversionOutput,
	type DOMExportOutput,
	type EditorConfig,
	type ElementFormatType,
	type LexicalEditor,
	type LexicalNode,
	type NodeKey,
	type Spread,
} from 'lexical';

import { DOMAIN } from '$lib/environment/environment';
import { VIDEO_CONSTANTS } from '$lib/constants/video';

import VideoEmbedComponent from './VideoEmbedComponent.svelte';
import { DecoratorBlockNode, type SerializedDecoratorBlockNode } from './DecoratorBlockNode';
import { sanitizeUrl } from '../../utils/sanitizeUrl';

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

		const isClipUrl2 =
			(url.hostname === 'www.twitch.tv' || url.hostname === 'twitch.tv') &&
			url.pathname.includes('/clip/');

		if (isClipUrl2) {
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

function createBoilerplateVideoIframeAttributes(node: VideoEmbedNode, parentUrl: string) {
	const element = document.createElement('iframe');

	const { url, title } = getURLAndTitle(node.__platform, node.__src, parentUrl);

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
	element.setAttribute('style', 'max-width:100%;height:auto;aspect-ratio:16/9;');

	return element;
}

const setFallbackElement = (element: HTMLIFrameElement, platform: string) => {
	element.setAttribute('class', 'element-placeholder-color');
	element.srcdoc = `<p style="color:#fff;"><strong>No valid URL is provided for this ${platform} embed.</strong></p>`;
};

function generateYouTubeIframe(node: VideoEmbedNode, parentUrl: string) {
	const { url } = getURLAndTitle(node.__platform, node.__src, parentUrl);

	const element = createBoilerplateVideoIframeAttributes(node, parentUrl);
	element.setAttribute('data-lexical-youtube', node.__src);

	if (!url) {
		setFallbackElement(element, node.__platform);
	}

	return { element };
}

function generateTwitchIframe(node: VideoEmbedNode, parentUrl: string) {
	const { url } = getURLAndTitle(node.__platform, node.__src, parentUrl);

	const element = createBoilerplateVideoIframeAttributes(node, parentUrl);
	element.setAttribute('data-lexical-twitch', node.__src);

	if (!url) {
		setFallbackElement(element, node.__platform);
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
	const width = domNode.getAttribute('width') ? Number(domNode.getAttribute('width')) : 'inherit';
	const height = domNode.getAttribute('height')
		? Number(domNode.getAttribute('height'))
		: 'inherit';

	const youtubeVideoSrc = domNode.getAttribute('data-lexical-youtube');
	if (youtubeVideoSrc) {
		const node = $createVideoEmbedNode({
			platform: 'youtube',
			src: youtubeVideoSrc,
			width,
			height,
		});
		return { node };
	}

	const twitchClipSrc = domNode.getAttribute('data-lexical-twitch');
	if (twitchClipSrc) {
		const node = $createVideoEmbedNode({
			platform: 'twitch',
			src: twitchClipSrc,
			width,
			height,
		});
		return { node };
	}

	return null;
}

export class VideoEmbedNode extends DecoratorBlockNode {
	__platform: SupportedPlatforms;
	__src: string;
	__width: 'inherit' | number;
	__height: 'inherit' | number;

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

	static getType(): string {
		return 'videoembed';
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

	static importDOM(): DOMConversionMap | null {
		return {
			iframe: (domNode: HTMLElement) => {
				if (
					!domNode.hasAttribute('data-lexical-youtube') ||
					!domNode.hasAttribute('data-lexical-twitch')
				) {
					return null;
				}

				return {
					conversion: $convertVideoElement,
					priority: 1,
				};
			},
		};
	}

	// Getters

	getWidthAndHeight() {
		return { width: this.__width, height: this.__height };
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

	// Setters

	setWidthAndHeight({
		width,
		height,
	}: {
		width: 'inherit' | number;
		height: 'inherit' | number;
	}): void {
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

	exportJSON(): SerializedVideoEmbedNode {
		return {
			...super.exportJSON(),
			type: VideoEmbedNode.getType(),
			platform: this.__platform,
			src: this.__src,
			width: this.__width,
			height: this.__height,
			version: 1,
		};
	}

	// View

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

	decorate(editor: LexicalEditor, config: EditorConfig) {
		// const embedBlockTheme = config.theme.embedBlock || {};
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
	format,
	key,
}: VideoEmbedPayload & { format?: ElementFormatType; key?: NodeKey }): VideoEmbedNode {
	return $applyNodeReplacement(new VideoEmbedNode(platform, src, width, height, format, key));
}

export function $isVideoEmbedNode(
	node: VideoEmbedNode | LexicalNode | null | undefined
): node is VideoEmbedNode {
	return node instanceof VideoEmbedNode;
}
