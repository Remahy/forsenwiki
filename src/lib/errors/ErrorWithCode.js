
export class ErrorWithCode extends Error {
	/**
	 * @type {string}
	 */
	code = '';

	/**
	 * @param {string} [message]
	 * @param {ErrorOptions} [options]
	 */
	constructor(message, options) {
		super(message, options);
	}
}
