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
import { VIDEO_CONSTANTS, VIDEO_MIN_HEIGHT, VIDEO_MIN_WIDTH } from '$lib/constants/video';

import VideoEmbedComponent from './VideoEmbedComponent.svelte';
import {
	DecoratorBlockNode,
	decoratorFormatToMarginStyle,
	type SerializedDecoratorBlockNode,
} from './DecoratorBlockNode';
import { sanitizeUrl } from '../../utils/sanitizeUrl';

export type SupportedPlatforms = 'twitch' | 'youtube';

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

const platforms = Object.keys(VIDEO_CONSTANTS.PLATFORMS);

export const getIframeStyle = (
	width: VideoEmbedPayload['width'],
	height: VideoEmbedPayload['height'],
	formatType?: ElementFormatType
) => {
	const widthStyle = width === 'inherit' ? 'width:100%;' : '';
	const heightStyle = height === 'inherit' ? 'height:auto;' : '';
	// It's an iframe, they have silly values.
	const aspectRatio = width === 'inherit' && height === 'inherit' ? 'aspect-ratio:16/9;' : '';

	return `max-width:100%;${widthStyle}${heightStyle}${aspectRatio}${formatType ? decoratorFormatToMarginStyle(formatType) : ''}`;
};

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

		if (url.pathname.startsWith('/embed/')) {
			const fullVideoSlug = url.pathname.split('/').pop();
			const clipSlug = url.searchParams.get('clip');
			const clipTId = url.searchParams.get('clipt');

			const youtubeEmbedURL = new URL(`/embed/${fullVideoSlug}`, 'https://www.youtube.com/');

			if (clipSlug && clipTId) {
				youtubeEmbedURL.searchParams.set('clip', clipSlug);
				youtubeEmbedURL.searchParams.set('clipt', clipTId);
			}

			return {
				url: youtubeEmbedURL.toString(),
				title: 'YouTube clip',
			};
		}

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

	const { url, title } = getURLAndTitle(node.getPlatform(), node.getSrc(), parentUrl);
	const { width: rawWidth, height: rawHeight } = node.getWidthAndHeight();

	const width =
		typeof rawWidth === 'number'
			? Math.max(VIDEO_MIN_WIDTH, Math.round(rawWidth)).toString()
			: 'inherit';
	const height =
		typeof rawHeight === 'number'
			? Math.max(VIDEO_MIN_HEIGHT, Math.round(rawHeight)).toString()
			: 'inherit';

	element.setAttribute('width', width);
	element.setAttribute('height', height);
	element.setAttribute('src', url);
	element.setAttribute('frameborder', '0');
	element.setAttribute(
		'allow',
		'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
	);
	element.setAttribute('allowfullscreen', 'true');
	element.setAttribute('title', title);
	element.setAttribute('loading', 'lazy');

	element.setAttribute(
		'style',
		getIframeStyle(
			width as VideoEmbedPayload['width'],
			height as VideoEmbedPayload['height'],
			node.getFormatType()
		)
	);

	return element;
}

const setFallbackElement = (element: HTMLIFrameElement, platform: string) => {
	element.setAttribute('class', 'element-placeholder-color');
	element.srcdoc = `<p style="color:#fff;"><strong>No valid URL is provided for this ${platform} embed.</strong></p>`;
};

function generateYouTubeIframe(node: VideoEmbedNode, parentUrl: string) {
	const { url } = getURLAndTitle(node.getPlatform(), node.getSrc(), parentUrl);

	const element = createBoilerplateVideoIframeAttributes(node, parentUrl);
	element.setAttribute('data-lexical-youtube', node.getSrc());

	if (!url) {
		setFallbackElement(element, node.getPlatform());
	}

	return { element };
}

function generateTwitchIframe(node: VideoEmbedNode, parentUrl: string) {
	const { url } = getURLAndTitle(node.getPlatform(), node.getSrc(), parentUrl);

	const element = createBoilerplateVideoIframeAttributes(node, parentUrl);
	element.setAttribute('data-lexical-twitch', node.getSrc());

	if (!url) {
		setFallbackElement(element, node.getPlatform());
	}

	return { element };
}

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
			node.getFormatType(),
			node.__key
		);
	}

	static importJSON(serializedNode: SerializedVideoEmbedNode): VideoEmbedNode {
		const node = new VideoEmbedNode(
			serializedNode.platform,
			serializedNode.src,
			serializedNode.width,
			serializedNode.height,
			serializedNode.format
		);

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
		const self = this.getLatest();
		return { width: self.__width, height: self.__height };
	}

	getSrc(): string {
		const self = this.getLatest();
		return self.__src;
	}

	getPlatform(): SupportedPlatforms {
		const self = this.getLatest();
		return self.__platform;
	}

	getTextContent(
		_includeInert?: boolean | undefined,
		_includeDirectionless?: false | undefined
	): string {
		const self = this.getLatest();
		return self.__src;
	}

	// Setters

	setWidthAndHeight({
		width,
		height,
	}: {
		width: 'inherit' | number;
		height: 'inherit' | number;
	}): void {
		const self = this.getWritable();
		self.__width =
			typeof width === 'number' ? Math.max(VIDEO_MIN_WIDTH, Math.round(width)) : 'inherit';
		self.__height =
			typeof height === 'number' ? Math.max(VIDEO_MIN_HEIGHT, Math.round(height)) : 'inherit';
	}

	setSrc(src: string): void {
		const self = this.getWritable();
		self.__src = src;
	}

	setPlatform(platform: string) {
		const self = this.getWritable();
		self.__platform = (
			platforms.includes(platform) ? platform : platforms[0]
		) as SupportedPlatforms;
	}

	exportJSON(): SerializedVideoEmbedNode {
		return {
			...super.exportJSON(),
			type: VideoEmbedNode.getType(),
			platform: this.getPlatform(),
			src: this.getSrc(),
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

		if (this.__platform === 'twitch') {
			return generateTwitchIframe(this, DOMAIN);
		}

		const element = document.createElement('a');
		element.href = sanitizeUrl(this.__src);
		element.textContent = `${VIDEO_CONSTANTS.PLATFORMS[this.__platform]} link`;

		return { element };
	}

	createDOM(config: EditorConfig): HTMLElement {
		return super.createDOM(config);
	}

	updateDOM(): false {
		return false;
	}

	decorate(editor: LexicalEditor, _config: EditorConfig) {
		// const embedBlockTheme = config.theme.embedBlock || {};
		// const className = {
		// 	base: embedBlockTheme.base || '',
		// 	focus: embedBlockTheme.focus || '',
		// };

		return {
			component: VideoEmbedComponent,
			props: {
				node: this,
				platform: this.getPlatform(),
				src: this.getSrc(),
				format: this.getFormatType(),
				nodeKey: this.__key,
				...this.getWidthAndHeight(),
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
