/**
 * @param {boolean} atBefore
 * @param {number} o
 * @param {number} textLength
 */
export const offsetIsAtEdges = (atBefore, o, textLength) => (atBefore ? o === 0 : o === textLength);

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
