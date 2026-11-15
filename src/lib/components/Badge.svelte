<script>
	/**
	 * @typedef {Object} Props
	 * @property {string} [class]
	 * @property {import('svelte').Component<import('@lucide/svelte').IconProps>} [icon]
	 * @property {import('svelte').Snippet} [children]
	 */

	/** @type {Props} */
	let { class: className = 'bg-black/10 dark:bg-white/10', icon: Icon, children } = $props();
</script>

<span
	class="inline-flex items-baseline rounded-sm p-1 text-xs text-slate-900 dark:text-slate-100 {className}"
>
	{#if Icon}
		<!-- An icon has no text baseline, the badge must take it from the label to line up. -->
		<Icon size={12} class="mr-1 self-center" aria-hidden="true" />
	{/if}
	{@render children?.()}
</span>
