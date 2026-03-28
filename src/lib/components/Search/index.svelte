<script>
	import { SearchIcon } from '@lucide/svelte';
	import { page } from '$app/stores';

	import Button from '../Button.svelte';
	import { parseSearchURL } from './parseSearchURL';
	import SearchFilters from './SearchFilters.svelte';

	let { inline = false } = $props();

	let query = $state($page.url.pathname === '/search' ? $page.url.searchParams.get('query') : '');

	$effect(() => {
		const { url } = $page;

		if (url.pathname === '/search') {
			const { query: q } = parseSearchURL(url);

			query = q;
		}
	});
</script>

<form class="flex flex-col gap-4" action="/search" data-sveltekit-reload>
	<div class="flex items-center">
		<input
			type="text"
			name="query"
			class="search w-full rounded-l-sm border-0"
			placeholder="Search..."
			bind:value={query}
		/>

		{#if inline}
			<Button type="submit" class="h-full rounded-l-none! border forsen-wiki-theme-border">
				<SearchIcon />
				<span class="hidden">Search</span>
			</Button>
		{/if}
	</div>

	{#if !inline}
		<SearchFilters />
	{/if}
</form>
