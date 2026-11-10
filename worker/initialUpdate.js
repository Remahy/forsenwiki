import { handleJobs } from './handleJobs.js';

import { $createTextNode, $getRoot, $createParagraphNode } from 'lexical';
import { uint8ArrayToBase64 } from 'uint8array-extras';

import { seedState } from '$lib/y/headless';
import { articleExtension } from '$lib/components/editor/config/article';
import { EDITOR_IS_READONLY } from '$lib/constants/constants';

/**
 * @returns {string}
 */
export const initialUpdateWorker = () => {
	const seed = seedState(articleExtension(null, EDITOR_IS_READONLY, null), () => {
		const text = $createTextNode('forsen');
		const p = $createParagraphNode();

		p.append(text);

		$getRoot().append(p);
	});

	return uint8ArrayToBase64(seed);
};

handleJobs(initialUpdateWorker);
