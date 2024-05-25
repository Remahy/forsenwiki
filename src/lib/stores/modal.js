import { writable } from 'svelte/store'

/**
 * @type {Writable<{component: ConstructorOfATypedSvelteComponent, [key: string]: unknown}>}
 */
export const modal = writable()