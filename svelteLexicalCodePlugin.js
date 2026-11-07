// Lexical 0.51 dropped the Prism re-exports from @lexical/code, but svelte-lexical still
// imports them. Its barrel re-exports those components, so the build fails even though
// we never use code blocks. Point svelte-lexical's @lexical/code at a shim that restores them.

const shimId = '\0svelte-lexical-code-shim';

/**
 * @returns {import('vite').Plugin}
 */
export default function svelteLexicalCodePlugin() {
	return {
		name: 'svelte-lexical-code-shim',
		enforce: 'pre',
		/**
		 * @returns {string | void}
		 */
		resolveId(id, importer) {
			if (id === '@lexical/code' && importer?.includes('/node_modules/svelte-lexical/')) {
				return shimId;
			}
		},
		/**
		 * @returns {string | void}
		 */
		load(id) {
			if (id === shimId) {
				return `
				export * from '@lexical/code';
				export {
					CODE_LANGUAGE_FRIENDLY_NAME_MAP,
					CODE_LANGUAGE_MAP,
					getLanguageFriendlyName,
					normalizeCodeLanguage as normalizeCodeLang,
					registerCodeHighlighting,
				} from '@lexical/code-prism';`;
			}
		},
	};
}
