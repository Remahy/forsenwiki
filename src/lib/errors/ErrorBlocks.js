/**
 * @param {Iterable<string>} ids
 * @param {string} label What the blocks hold, e.g. "image".
 * @returns {ErrorBlock[]}
 */
export const labelBlocks = (ids, label) => [...ids].map((id) => ({ id, label }));
