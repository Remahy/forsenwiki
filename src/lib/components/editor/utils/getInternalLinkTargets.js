import { $nodesOfType } from 'lexical';
import { ALinkNode } from '$lib/lexical/custom';
import { getOnlyInternalLinks } from './getInternalIds';
import { $closestBlockId } from './closestBlockId';

/**
 * @param {LexicalEditor} editor
 */
export const getInternalLinkTargets = (editor) =>
	editor.read(() => {
		/** @type {Map<string, { links: number, blockIds: Set<string> }>} */
		const targets = new Map();

		for (const link of getOnlyInternalLinks($nodesOfType(ALinkNode))) {
			const id = link.getInternalId();

			if (!id) {
				continue;
			}

			const target = targets.get(id) ?? { links: 0, blockIds: new Set() };
			target.links++;

			const blockId = $closestBlockId(link);
			if (blockId) {
				target.blockIds.add(blockId);
			}

			targets.set(id, target);
		}

		return targets;
	});
