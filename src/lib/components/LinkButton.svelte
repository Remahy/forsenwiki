<script>
	import { navigating } from '$app/state';
	import Spinner from './Spinner.svelte';

	/**
	 * @typedef {Object} Props
	 * @property {string} href
	 * @property {boolean} [reload]
	 * @property {string} [class]
	 * @property {import('svelte').Snippet} [children]
	 */

	/** @type {Props & { [key: string]: any }} */
	let { href, reload = false, class: className = '', children, ...rest } = $props();

	const navigatingToInternalHref = $derived(navigating.to?.url.pathname.endsWith(href));
</script>

<a
	{href}
	data-sveltekit-reload={reload}
	class="link-button {className}"
	{...rest}
	class:pointer-events-none={navigatingToInternalHref}
>
	{#if navigatingToInternalHref}
		<Spinner size="16" />
	{/if}
	{@render children?.()}
</a>
