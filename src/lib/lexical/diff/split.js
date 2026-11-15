import { compare, nodesOf, pairEntry, rowsOf, sameEntry, wholeEntry } from './helpers';

/**
 * @typedef {import('./helpers').Step} Step
 * @typedef {import('./helpers').Entry} Entry
 * @typedef {'older' | 'newer'} Side
 */

/**
 * @param {Step[]} steps
 * @param {Side} side
 * @returns {Entry[]}
 */
const entriesOf = (steps, side) =>
	steps.flatMap((step) => {
		switch (step.kind) {
			case 'same':
				return [sameEntry(step[side], step.fields)];
			case 'delete':
				return side === 'older' ? [wholeEntry(step.older, 'delete')] : [];
			case 'insert':
				return side === 'newer' ? [wholeEntry(step.newer, 'insert')] : [];
			case 'pair':
				return [
					step.cut
						? wholeEntry(step[side], side === 'older' ? 'delete' : 'insert')
						: pairEntry(step[side], step, step.children && nodesOf(entriesOf(step.children, side))),
				];
		}
	});

/**
 * @type {import('./helpers').DiffView}
 */
export const diffSplit = (older, newer, { timeout, attribute } = {}) => {
	const { steps, partial } = compare(older, newer, timeout);

	const rows = rowsOf(steps, attribute, (step) =>
		/** @type {Side[]} */ (['older', 'newer']).map((side) =>
			entriesOf([step], side).flatMap(({ node }) => (node ? [node] : []))
		)
	);

	return { rows, partial };
};
