/**
 * @param {any} _
 * @param {{ toString: () => any }} value
 */
export const replacer = (_, value) =>
	typeof value === 'bigint' ? { $bigint: value.toString() } : value;

/**
 * A copy of `value` that `json()` can serialize, with BigInts written as `{ $bigint: string }`.
 * @param {unknown} value
 */
export const toSafeJSON = (value) => JSON.parse(JSON.stringify(value, replacer));

/**
 * This should also be implemented by any API consumers.
 * @param {any} _
 * @param {{ $bigint: string | number | bigint | boolean; } | null} value
 */
export const reviver = (_, value) =>
	value !== null &&
	typeof value === 'object' &&
	'$bigint' in value &&
	typeof value.$bigint === 'string'
		? BigInt(value.$bigint)
		: value;
