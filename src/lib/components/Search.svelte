<script>
	import { SearchIcon } from 'lucide-svelte';
	import { page } from '$app/stores';

	import Button from './Button.svelte';
	import Select from './Select.svelte';

	let { inline = false } = $props();

	let query = $state($page.url.pathname === '/search' ? $page.url.searchParams.get('query') : '');

	/** @type {string[]} */
	let types = $state([]);

	/** @type {string} */
	let order = $state('');

	page.subscribe(({ url }) => {
		if (url.pathname === '/search') {
			const q = url.searchParams.get('query') || '';
			query = q;
			const t = url.searchParams.getAll('type') || [];
			types = t;
			const o = url.searchParams.get('order') || 'desc';
			order = o;
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

		<Button type="submit" class="forsen-wiki-theme-border h-full rounded-l-none! border">
			<SearchIcon />
			<span class="hidden">Search</span>
		</Button>
	</div>

	{#if !inline}
		<label class="flex items-baseline gap-2">
			<strong class="min-w-12">Type</strong>

			<Select
				title="Type"
				name="type"
				class="w-full overflow-hidden p-0!"
				bind:value={types}
				multiple
			>
				<option value="">All</option>
				<option value="article">Articles</option>
				<option value="content">Content</option>
			</Select>
		</label>
		<label class="flex items-baseline gap-2">
			<strong class="min-w-12">Order</strong>
			<Select title="Order by" name="order" class="h-full w-full" bind:value={order}>
				<option value="desc">Descending</option>
				<option value="asc">Ascending</option>
			</Select>
		</label>
	{/if}
</form>
