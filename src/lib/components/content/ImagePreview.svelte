<script>
	import ImageFocus from '#lib/components/content/ImageFocus.svelte';

	const { src, name, className = '' } = $props();

	let isFullscreen = $state(false);
</script>

<button
	type="button"
	class="block w-full cursor-zoom-in"
	aria-label="Open image fullscreen"
	onclick={() => (isFullscreen = true)}
>
	<img {src} alt={name} class="mx-auto w-full max-w-full {className}" />
</button>

{#if isFullscreen}
	<ImageFocus {src} {name} onclose={() => (isFullscreen = false)} />
{/if}
