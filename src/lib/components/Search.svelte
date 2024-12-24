<script>
	import { SearchIcon } from 'lucide-svelte';
	import Button from './Button.svelte';
	import { page } from '$app/stores';

	let query = $state($page.url.pathname === '/search' ? $page.url.searchParams.get('query') : '');

	page.subscribe(({ url }) => {
		if (url.pathname === '/search') {
			const q = url.searchParams.get('query') || '';
			query = q;
		}
	});
</script>

<form class="flex items-center" action="/search" data-sveltekit-reload>
	<input
		type="text"
		name="query"
		class="search w-full rounded-l border-0"
		placeholder="Search..."
		bind:value={query}
	/>

	<Button type="submit" class="h-full rounded-l-none rounded-r">
		<SearchIcon />
		<span class="hidden">Search</span>
	</Button>
</form>
