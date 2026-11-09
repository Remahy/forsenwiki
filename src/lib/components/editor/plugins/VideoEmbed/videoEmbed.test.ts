import { expect, test } from 'vitest';
import { $getRoot, $insertNodes, type ElementFormatType } from 'lexical';
import { buildEditorFromExtensions } from '@lexical/extension';
import { HeadlessExtension } from '@lexical/headless';
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html';

import { articleExtension } from '../../config/article';
import { $createVideoEmbedNode, $isVideoEmbedNode, type VideoEmbedPayload } from './VideoEmbed';
import { STATIC_DOMAIN } from '$lib/environment/environment';

const importHTML = (html: string) => {
	const editor = buildEditorFromExtensions(HeadlessExtension, articleExtension(null, true, null));
	editor.update(
		() => {
			const dom = new DOMParser().parseFromString(html, 'text/html');
			$getRoot().select();
			$insertNodes($generateNodesFromDOM(editor, dom));
		},
		{ discrete: true }
	);

	return editor.read(() =>
		$getRoot()
			.getChildren()
			.filter($isVideoEmbedNode)
			.map((node) => {
				const { platform, src, width, height, format, subtitles } = node.exportJSON();
				return { platform, src, width, height, format, subtitles };
			})
	);
};

const videos: Array<VideoEmbedPayload & { format: ElementFormatType }> = [
	{
		platform: 'youtube',
		src: 'https://www.youtube.com/watch?v=-GEHyAfV4OI',
		width: 640,
		height: 360,
		format: 'center',
		subtitles: undefined,
	},
	{
		platform: 'twitch',
		src: 'https://www.twitch.tv/pobelter/clip/AverageObliviousTortoiseBudBlast-8-xyNLv8aYACcbPb',
		width: 'inherit',
		height: 'inherit',
		format: 'right',
		subtitles: undefined,
	},
	{
		platform: 'usercontent',
		src: 'abc.mp4',
		width: 'inherit',
		height: 'inherit',
		format: 'left',
		subtitles: [
			{ id: 'sub1', src: 'en.vtt', title: 'Commentary (uncut)', language: 'en' },
			{ id: 'sub2', src: 'sv.vtt', title: 'Svenska', language: 'sv' },
		],
	},
];

test.each(videos)('$platform video survives exporting and importing HTML', (video) => {
	const editor = buildEditorFromExtensions(HeadlessExtension, articleExtension(null, true, null));
	editor.update(() => $getRoot().append($createVideoEmbedNode(video)), { discrete: true });
	const html = editor.read(() => $generateHtmlFromNodes(editor, null));

	expect(importHTML(html)).toEqual([video]);
});

test('other iframes are not videos', () => {
	expect(importHTML('<iframe src="https://example.com"></iframe>')).toEqual([]);
});

test('subtitles from HTML exported before the id was added', () => {
	const html = `<video data-lexical-usercontent="abc.mp4">
		<track kind="subtitles" src="${STATIC_DOMAIN}/sv.vtt" srclang="sv" label="Commentary (Swedish - Svenska)">
	</video>`;

	expect(importHTML(html)[0].subtitles).toEqual([
		{ id: '', src: 'sv.vtt', title: 'Commentary', language: 'sv' },
	]);
});
