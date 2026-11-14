import { isYWarning } from '@lexical/y';

/** Version of the article's node classes and their stored fields. Bump when they change. */
export const SCHEMA_VERSION = 1;

/**
 * @param {Error} warning
 */
export const logYWarning = (warning) => {
	if (isYWarning(warning)) {
		console.warn(`[@lexical/y] ${warning.code}`, warning.data, warning.message);
		return;
	}

	console.warn(warning);
};

/**
 * @param {import('lexical').AnyLexicalExtensionArgument} extension
 * @returns {import('@lexical/y/headless').HeadlessYConfig}
 */
export const yHeadlessConfig = (extension) => ({
	extensions: [extension],
	schemaVersion: SCHEMA_VERSION,
	onWarn: logYWarning,
});

/**
 * @param {YDoc} doc
 * @param {Partial<import('@lexical/y').YCollabInput>} [options]
 * @returns {import('@lexical/y').YCollabInput}
 */
export const yCollabInput = (doc, options = {}) => ({
	doc,
	schemaVersion: SCHEMA_VERSION,
	layoutUpgrade: null,
	...options,
});
