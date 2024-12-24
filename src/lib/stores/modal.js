import { writable } from 'svelte/store';

/**
 * @type {Writable<{component: import('svelte').Component<any>, [key: string]: unknown}>}
 */
export const modal = writable();
