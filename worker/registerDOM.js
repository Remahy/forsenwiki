import { JSDOM } from 'jsdom';

// Lexical's HTML export and DOMParser need browser globals in Node.
const { window } = new JSDOM('');

// DOM classes (HTMLElement, DOMParser, ...) and the few instances Lexical looks for.
const keys = Object.getOwnPropertyNames(window).filter((key) => /^[A-Z]/.test(key));

for (const key of [...keys, 'window', 'document', 'navigator', 'customElements']) {
	// Keep Node's own globals, e.g. fetch, URL and AbortController.
	if (!(key in globalThis)) {
		/** @type {any} */ (globalThis)[key] = /** @type {any} */ (window)[key];
	}
}
