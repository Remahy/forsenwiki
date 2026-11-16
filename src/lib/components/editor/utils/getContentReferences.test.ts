import { expect, test } from 'vitest';
import { $createParagraphNode, $createTextNode, $getRoot } from 'lexical';
import { buildEditorFromExtensions } from '@lexical/extension';
import { HeadlessExtension } from '@lexical/headless';

import { articleExtension } from '../config/article';
import { $createImageNode } from '../plugins/Image/Image';
import { $createVideoEmbedNode } from '../plugins/VideoEmbed/VideoEmbed';
import { $createALinkNode } from '$lib/lexical/custom';
import { DOMAIN, STATIC_DOMAIN } from '$lib/environment/environment';
import { getContentReferences } from './getContentReferences';

const build = (fill: () => void) => {
	const editor = buildEditorFromExtensions(HeadlessExtension, articleExtension(null, true, null));

	editor.update(fill, { discrete: true });

	return getContentReferences(editor);
};

const hex = (char: string) => char.repeat(64);
const [image, video, subtitle, upload] = ['a', 'b', 'c', 'd'].map(hex);

const link = (url: string, internal = false) =>
	$createALinkNode(url, {}, internal, internal ? 'post' : undefined).append($createTextNode('x'));

test('images, uploaded videos and subtitles, each hash once', () => {
	const { hashes, links } = build(() => {
		const paragraph = $createParagraphNode().append(
			$createImageNode({ src: image, altText: '' }),
			$createImageNode({ src: `${STATIC_DOMAIN}/${image}`, altText: '' })
		);

		$getRoot().append(
			paragraph,
			$createVideoEmbedNode({
				platform: 'usercontent',
				src: `${STATIC_DOMAIN}/${video}`,
				subtitles: [{ id: 'sub', src: subtitle, title: 'English', language: 'en' }],
			}),
			$createVideoEmbedNode({
				platform: 'youtube',
				src: 'https://www.youtube.com/watch?v=-GEHyAfV4OI',
			})
		);
	});

	expect(hashes.sort()).toEqual([image, video, subtitle]);
	expect(links).toEqual([]);
});

test('external links once each, links to uploads by hash, internal and own links skipped', () => {
	const { hashes, links } = build(() => {
		$getRoot().append(
			$createParagraphNode().append(
				link('https://x.com/forsen'),
				link('https://X.com/forsen'),
				link('http://example.com'),
				link(`${STATIC_DOMAIN}/${upload}`),
				link(`${DOMAIN}/w/forsen`),
				link('/w/forsen', true),
				link('mailto:forsen@example.com')
			)
		);
	});

	expect(links).toEqual(['https://x.com/forsen', 'http://example.com/']);
	expect(hashes).toEqual([upload]);
});

test('sources that are not upload hashes are not uploads', () => {
	const { hashes } = build(() => {
		$getRoot().append(
			$createParagraphNode().append(
				$createImageNode({ src: `link:${image}`, altText: '' }),
				$createImageNode({ src: 'image', altText: '' }),
				$createImageNode({ src: image.toUpperCase(), altText: '' })
			)
		);
	});

	expect(hashes).toEqual([]);
});
