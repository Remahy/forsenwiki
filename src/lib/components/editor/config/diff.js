import {
	$getState,
	$isElementNode,
	$isLineBreakNode,
	$isTextNode,
	isHTMLElement,
	LineBreakNode,
	ParagraphNode,
	TabNode,
	TextNode,
} from 'lexical';

import { diffState } from '$lib/y/diffState';
import { articleExtension, articleNodes, htmlExport } from './article';

/**
 * @typedef {import('$lib/y/diffState').DiffMark} DiffMark
 * @typedef {(editor: LexicalEditor, node: LexicalNode) => import('lexical').DOMExportOutput} ExportDOM
 */

const VOID_ELEMENTS = new Set(['BR', 'HR', 'IFRAME', 'IMG', 'VIDEO']);

/**
 * @param {LexicalNode} node
 * @returns {DiffMark | null}
 */
export const $getDiffMark = (node) => {
	const own = $getState(node, diffState);

	if (!$isElementNode(node)) {
		return own;
	}

	const children = node.getChildren().map($getDiffMark);

	if (!children.length) {
		return own;
	}

	const [child] = children;

	if (child && child.type !== 'change' && children.every((mark) => mark?.type === child.type)) {
		return { type: child.type, by: child.by, at: child.at };
	}

	if (own) {
		return own;
	}

	const changed = children.find((mark) => mark !== null);

	return changed ? { type: 'change', by: changed.by, at: changed.at } : null;
};

/**
 * @param {HTMLElement} element
 * @param {DiffMark['type']} type
 */
const applyColor = (element, type) => {
	switch (type) {
		case 'change':
			element.style.outline = '1px rgba(255, 127.5, 0, 0.5) dotted';
			element.classList.add('bg-orange-300/10');
			break;
		case 'insert':
			element.style.outline = '1px rgba(0, 255, 0, 0.5) solid';
			element.classList.add('bg-green-500/10');
			break;
		case 'delete':
			element.style.outline = '1px rgba(255, 0, 0, 0.5) solid';
			element.classList.add('bg-red-500/10');
			break;
	}
};

/**
 * @param {string} key
 * @param {{ __old?: unknown, __new?: unknown }} change
 */
const describeField = (key, { __old, __new }) => {
	if (__old === undefined) {
		return `+ "${key}" added with the value ${JSON.stringify(__new)}.`;
	}

	if (__new === undefined) {
		return `- "${key}" removed, and its value ${JSON.stringify(__old)}.`;
	}

	return `~ "${key}" changed from ${JSON.stringify(__old)} to ${JSON.stringify(__new)}.`;
};

/**
 * @param {NonNullable<DiffMark['fields']>} fields
 */
const describeFields = (fields) =>
	Object.entries(fields)
		.map(([key, change]) => describeField(key, change))
		.join('\r\n');

/**
 * @param {HTMLElement} element
 * @param {NonNullable<DiffMark['fields']>} fields
 */
const addInformationHover = (element, fields) => {
	element.classList.add('relative');

	const hover = document.createElement('span');
	hover.classList.add(
		'bg-blue-500/50',
		'rounded-full',
		'absolute',
		'top-0',
		'right-0',
		'px-2',
		'text-base',
		'border'
	);
	hover.dataset.diffInfo = '';
	hover.textContent = '?';
	hover.title = describeFields(fields);

	element.appendChild(hover);
};

/**
 * @param {LexicalNode} node
 */
const $isBlank = (node) =>
	$isElementNode(node) &&
	node.getTextContent().trim() === '' &&
	node.getChildren().every($isTextNode);

/**
 * @param {HTMLElement} element
 * @param {DiffMark} mark
 * @param {LexicalNode} node
 */
const decorate = (element, mark, node) => {
	let target = element;

	if (VOID_ELEMENTS.has(element.tagName)) {
		// A void element can't hold the outline's hover, nor be positioned against.
		target = document.createElement('span');
		target.appendChild(element);
	}

	target.dataset.diff = mark.type;

	if (mark.by) {
		target.dataset.diffBy = mark.by;
	}

	if (mark.at) {
		target.dataset.diffAt = String(mark.at);
	}

	applyColor(target, mark.type);

	if (mark.type !== 'change' && $isLineBreakNode(node)) {
		target.dataset.diffBreak = '';
	} else if (mark.type !== 'change' && $isBlank(node)) {
		target.dataset.diffBlank = '';
	}

	if (mark.fields && Object.keys(mark.fields).length) {
		if ($isElementNode(node)) {
			addInformationHover(target, mark.fields);
		} else {
			target.title = describeFields(mark.fields);
		}
	}

	return target;
};

/**
 * @param {ExportDOM} exportDOM
 * @returns {ExportDOM}
 */
const withDiff = (exportDOM) => (editor, node) => {
	const output = exportDOM(editor, node);
	const mark = $getDiffMark(node);

	if (!isHTMLElement(output.element)) {
		return output;
	}

	output.element.removeAttribute('id');

	if (!mark) {
		return output;
	}

	return { ...output, element: decorate(output.element, mark, node) };
};

const diffNodes = [
	TextNode,
	LineBreakNode,
	TabNode,
	ParagraphNode,
	...articleNodes.map((node) => (typeof node === 'function' ? node : node.withKlass)),
];

/** @type {Map<import('lexical').Klass<LexicalNode>, ExportDOM>} */
export const diffHtmlExport = new Map(
	[...new Set(diffNodes)].map((klass) => [
		klass,
		withDiff(
			/** @type {ExportDOM | undefined} */ (htmlExport.get(/** @type {any} */ (klass))) ??
				((editor, node) => node.exportDOM(editor))
		),
	])
);

/**
 * @param {any} theme
 * @param {boolean} editable
 * @param {any} editorState
 * @param {(error: Error) => void} [onError]
 */
export const diffExtension = (theme, editable, editorState, onError) =>
	articleExtension(theme, editable, editorState, onError, { htmlExport: diffHtmlExport });
