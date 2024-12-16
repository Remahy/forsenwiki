<script>
	import { SearchIcon } from 'lucide-svelte';
	import Button from './Button.svelte';
	import { page } from '$app/stores';

	let query = $page.url.pathname === '/search' ? $page.url.searchParams.get('query') : '';

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
		class="w-full rounded-l border-0 bg-slate-200 placeholder:text-slate-500 hover:bg-violet-200 dark:bg-slate-900 outline outline-1 outline-slate-300 dark:outline-slate-800 dark:bg-opacity-30 dark:placeholder:text-slate-700 dark:hover:bg-slate-800 dark:hover:bg-opacity-50"
		placeholder="Search..."
		bind:value={query}
	/>

	<Button type="submit" class="h-full rounded-l-none rounded-r">
		<SearchIcon />
		<span class="hidden">Search</span>
	</Button>
</form>
