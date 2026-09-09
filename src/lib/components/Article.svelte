<script>
	/* eslint-disable svelte/no-at-html-tags */
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { runStreamerMode } from '$lib/utils/streamerMode.js';

	let streamerMode = $state($page.data.session?.user?.userSettings?.streamerMode);

	let { html } = $props();

	onMount(() => {
		if (!streamerMode) {
			return;
		}

		const resetStreamerMode = runStreamerMode();

		return () => {
			resetStreamerMode();
		};
	});
</script>

{@html html}
