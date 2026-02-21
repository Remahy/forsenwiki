/**
 * @param {any} _
 * @param {{ toString: () => any }} value
 */
export const replacer = (_, value) =>
	typeof value === 'bigint' ? { $bigint: value.toString() } : value;

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
