import { expect, test } from 'vitest';
import { $createParagraphNode, $createTextNode, $getRoot } from 'lexical';
import { uint8ArrayToBase64 } from 'uint8array-extras';

import { articleExtension } from '$lib/components/editor/config/article';
import { EDITOR_IS_READONLY } from '$lib/constants/constants';
import { $createALinkNode } from '$lib/lexical/custom';
import { seedState } from '$lib/y/headless';
import { toHTMLWorker } from '../../../worker/toHTML/index.js';

const update = uint8ArrayToBase64(
	seedState(articleExtension(null, EDITOR_IS_READONLY, null), () => {
		$getRoot().append(
			$createParagraphNode().append(
				$createALinkNode('/w/old_title#history', {}, true, 'renamed').append(
					$createTextNode('renamed')
				),
				$createTextNode(' and '),
				$createALinkNode('/w/kept', {}, true, 'kept').append($createTextNode('kept')),
				$createTextNode(' and '),
				$createALinkNode('https://example.com').append($createTextNode('example'))
			)
		);
	})
);

const hrefs = (html: string) => [...html.matchAll(/href="([^"]*)"/g)].map(([, href]) => href);

test('internal links render with the current title of their article, keeping the heading', async () => {
	const { html } = await toHTMLWorker({
		config: 'article',
		update,
		titles: { renamed: 'new_title', kept: 'kept' },
	});

	expect(hrefs(html)).toEqual(['/w/new_title#history', '/w/kept', 'https://example.com']);
});

test('without titles, links render as they were saved', async () => {
	const { html } = await toHTMLWorker({ config: 'article', update });

	expect(hrefs(html)).toEqual(['/w/old_title#history', '/w/kept', 'https://example.com']);
});

test('links to articles without a known title are left alone', async () => {
	const { html } = await toHTMLWorker({ config: 'article', update, titles: { kept: 'kept' } });

	expect(hrefs(html)).toEqual(['/w/old_title#history', '/w/kept', 'https://example.com']);
});
