import { it, expect, describe } from 'vitest';

import jsonDiffRs from '../index';

const { jsonDiff } = jsonDiffRs;

describe('json-diff-rs', () => {
	describe('Errors', () => {
		it("should throw error when first argument isn't string", () => {
			expect(() => jsonDiff(null, '')).toThrow('expected string');
		});

		it("should throw error when second argument isn't string", () => {
			expect(() => jsonDiff('', null)).toThrow('expected string');
		});

		it("should throw error when both arguments aren't strings", () => {
			expect(() => jsonDiff(null, null)).toThrow('expected string');
		});

		it('should throw error when first argument is an empty string', () => {
			expect(() => jsonDiff('', JSON.stringify({}))).toThrow(
				'Invalid JSON from first argument: EOF while parsing a value at line 1 column 0'
			);
		});

		it('should throw error when second argument is an empty string', () => {
			expect(() => jsonDiff(JSON.stringify({}), '')).toThrow(
				'Invalid JSON from second argument: EOF while parsing a value at line 1 column 0'
			);
		});
	});

	describe('Does it work?', () => {
		it('should return null when both stringified JSON have no changes', () => {
			const result = jsonDiff(JSON.stringify({}), JSON.stringify({}));

			expect(result).toStrictEqual('null');
		});

		it('should show difference between two stringified numbers', () => {
			const result = jsonDiff(JSON.stringify(42), JSON.stringify(43));

			expect(result).toStrictEqual(
				JSON.stringify({ difference_of: 'scalar', source: 42, target: 43 })
			);
		});
	});

	describe('Arrays', () => {
		it('should return array difference', () => {
			const result = jsonDiff(JSON.stringify([1, 2]), JSON.stringify([1]));

			expect(result).toStrictEqual(
				JSON.stringify({
					difference_of: 'array',
					array_difference: 'longer',
					different_pairs: null,
					extra_length: 1,
				})
			);
		});

		it('should return array difference, flipped', () => {
			const result = jsonDiff(JSON.stringify([1]), JSON.stringify([1, 2]));

			expect(result).toStrictEqual(
				JSON.stringify({
					difference_of: 'array',
					array_difference: 'shorter',
					different_pairs: null,
					missing_elements: [2],
				})
			);
		});
	});

	describe('Objects', () => {
		it('should return property addition in object', () => {
			const result = jsonDiff(JSON.stringify({}), JSON.stringify({ root: {} }));

			expect(result).toStrictEqual(
				JSON.stringify({
					difference_of: 'object',
					different_entries: { root: { entry_difference: 'missing', value: {} } },
				})
			);
		});

		it('should return property removal in object', () => {
			const result = jsonDiff(JSON.stringify({ root: {} }), JSON.stringify({}));

			expect(result).toStrictEqual(
				JSON.stringify({
					difference_of: 'object',
					different_entries: { root: { entry_difference: 'extra' } },
				})
			);
		});

		it('should return nested property addition in object', () => {
			const result = jsonDiff(
				JSON.stringify({ root: { children: [] } }),
				JSON.stringify({ root: {} })
			);

			expect(result).toStrictEqual(
				JSON.stringify({
					difference_of: 'object',
					different_entries: {
						root: {
							entry_difference: 'value',
							value_diff: {
								difference_of: 'object',
								different_entries: { children: { entry_difference: 'extra' } },
							},
						},
					},
				})
			);
		});

		it('should return nested property removal in object', () => {
			const result = jsonDiff(
				JSON.stringify({ root: {} }),
				JSON.stringify({ root: { children: [] } })
			);

			expect(result).toStrictEqual(
				JSON.stringify({
					difference_of: 'object',
					different_entries: {
						root: {
							entry_difference: 'value',
							value_diff: {
								difference_of: 'object',
								different_entries: { children: { entry_difference: 'missing', value: [] } },
							},
						},
					},
				})
			);
		});
	});
});
