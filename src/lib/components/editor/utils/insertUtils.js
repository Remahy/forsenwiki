/**
 * @param {boolean} atBefore
 * @param {number} offset
 * @param {number} textLength
 */
export const offsetIsAtEdges = (atBefore, offset, textLength) =>
	atBefore ? offset === 0 : offset === textLength;

/**
 * @param {boolean} atBefore
 * @param {ElementNode} node
 */
export const hasAdjacentNode = (atBefore, node) =>
	atBefore ? node.getPreviousSibling() : node.getNextSibling();

/**
 * @param {boolean} atBefore
 * @param {ElementNode} node
 * @param {LexicalNode} nodeToInsert
 */
export const insertFnc = (atBefore, node, nodeToInsert) =>
	atBefore ? node.insertBefore(nodeToInsert) : node.insertAfter(nodeToInsert);
