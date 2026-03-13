import { writable } from 'svelte/store';

/**
 * @type {Writable<{component: import('svelte').Component<any>, isOpen?: boolean, disableClose?: boolean, [key: string]: unknown}>}
 */
export const modal = writable();
