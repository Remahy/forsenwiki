<script>
	import { SearchIcon } from 'lucide-svelte';
	import Button from './Button.svelte';
	import { page } from '$app/stores';

	let query = $page.url.pathname === '/search' ? $page.url.searchParams.get('query') : '';
</script>

<form class="flex items-center" action="/search" data-sveltekit-reload>
	<input
		type="text"
		name="query"
		class="w-full rounded-l border-0 bg-violet-200 placeholder:text-inherit hover:bg-violet-300 dark:bg-violet-950 dark:bg-opacity-30 dark:hover:bg-violet-950 dark:hover:bg-opacity-50 dark:placeholder:text-neutral-500"
		placeholder="Search..."
		bind:value={query}
	/>

	<Button type="submit" class="h-full rounded-l-none rounded-r"><SearchIcon /></Button>
</form>
