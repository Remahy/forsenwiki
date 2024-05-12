import { writable } from 'svelte/store'

/**
 * @returns {Writable<{component: ConstructorOfATypedSvelteComponent, [key: string]: unknown}>}
 */
export const modal = writable()