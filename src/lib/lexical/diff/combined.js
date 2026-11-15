import { compare, nodesOf, pairEntry, rowsOf, sameEntry, wholeEntry } from './helpers';

/**
 * @typedef {import('./helpers').Step} Step
 * @typedef {import('./helpers').Entry} Entry
 */

/**
 * @param {Step[]} steps
 * @returns {Entry[]}
 */
const entriesOf = (steps) =>
	steps.flatMap((step) => {
		switch (step.kind) {
			case 'same':
				return [sameEntry(step.newer, step.fields)];
			case 'delete':
				return [wholeEntry(step.older, 'delete')];
			case 'insert':
				return [wholeEntry(step.newer, 'insert')];
			case 'pair':
				return step.cut
					? [wholeEntry(step.older, 'delete'), wholeEntry(step.newer, 'insert')]
					: [pairEntry(step.newer, step, step.children && nodesOf(entriesOf(step.children)))];
		}
	});

/**
 * @type {import('./helpers').DiffView}
 */
export const diffCombined = (older, newer, { timeout, attribute } = {}) => {
	const { steps, partial } = compare(older, newer, timeout);

	const rows = rowsOf(steps, attribute, (step) => [
		entriesOf([step]).flatMap(({ node }) => (node ? [node] : [])),
	]);

	return { rows, partial };
};
