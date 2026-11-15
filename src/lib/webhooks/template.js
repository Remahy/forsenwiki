const PLACEHOLDER = /\{\{\{([\w.]+)\}\}\}|\{\{([\w.]+)\}\}/g;
const WHOLE = /^(?:\{\{\{([\w.]+)\}\}\}|\{\{([\w.]+)\}\})$/;
const OMIT = Symbol('omit');

/**
 * @param {Record<string, any>} view
 * @param {string} path
 */
const lookup = (view, path) => path.split('.').reduce((value, key) => value?.[key], view);

/** @param {unknown} value */
const isEmpty = (value) => value === null || value === undefined || value === '';

/**
 * @param {string} line
 * @param {Record<string, any>} view
 * @param {(text: string) => string} escape
 */
const renderLine = (line, view, escape) => {
	let empty = false;

	const rendered = line.replace(PLACEHOLDER, (_, raw, escaped) => {
		const value = lookup(view, raw ?? escaped);

		if (isEmpty(value)) {
			empty = true;
			return '';
		}

		return raw ? String(value) : escape(String(value));
	});

	return empty ? null : rendered;
};

/**
 * @param {string} text
 * @param {Record<string, any>} view
 * @param {(text: string) => string} escape
 */
const renderString = (text, view, escape) => {
	const whole = text.match(WHOLE);

	if (whole) {
		const [, raw, escaped] = whole;
		const value = lookup(view, raw ?? escaped);

		if (isEmpty(value)) {
			return OMIT;
		}

		if (typeof value !== 'string') {
			return value;
		}

		return raw ? value : escape(value);
	}

	const lines = text
		.split('\n')
		.map((line) => renderLine(line, view, escape))
		.filter((line) => line !== null);

	return lines.length ? lines.join('\n') : OMIT;
};

/**
 * @param {unknown} node
 * @param {Record<string, any>} view
 * @param {(text: string) => string} escape
 * @returns {unknown}
 */
const renderNode = (node, view, escape) => {
	if (typeof node === 'string') {
		return renderString(node, view, escape);
	}

	if (Array.isArray(node)) {
		if (!node.length) {
			return node;
		}

		const items = node
			.map((item) => renderNode(item, view, escape))
			.filter((item) => item !== OMIT);

		return items.length ? items : OMIT;
	}

	if (node && typeof node === 'object') {
		if (!Object.keys(node).length) {
			return node;
		}

		const entries = Object.entries(node)
			.map(([key, value]) => [key, renderNode(value, view, escape)])
			.filter(([, value]) => value !== OMIT);

		return entries.length ? Object.fromEntries(entries) : OMIT;
	}

	return node;
};

/**
 * See templates/README.md for the syntax.
 * @param {unknown} template
 * @param {Record<string, any>} view
 * @param {{ escape?: (text: string) => string }} [options]
 */
export const render = (template, view, { escape = (text) => text } = {}) => {
	const rendered = renderNode(template, view, escape);

	return rendered === OMIT ? undefined : rendered;
};
