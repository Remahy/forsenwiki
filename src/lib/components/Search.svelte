<script>
	import { SearchIcon } from 'lucide-svelte';
	import { page } from '$app/stores';

	import Button from './Button.svelte';
	import Select from './Select.svelte';

	let { inline = false } = $props();

	let query = $state($page.url.pathname === '/search' ? $page.url.searchParams.get('query') : '');

	/** @type {string[]} */
	let types = $state([]);

	/** @type {string[]} */
	let contentTypes = $state([]);

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

			if (t.includes('content') || t.includes('')) {
				const ct = url.searchParams.getAll('contenttype') || [];
				contentTypes = ct;
			}
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
			<Button type="submit" class="forsen-wiki-theme-border h-full rounded-l-none! border">
				<SearchIcon />
				<span class="hidden">Search</span>
			</Button>
		{/if}
	</div>

	{#if !inline}
		<label class="flex items-baseline gap-2">
			<strong class="min-w-12">Type</strong>

			<Select
				title="Type (Multi-select)"
				name="type"
				class="h-15! w-full overflow-hidden p-0!"
				bind:value={types}
				multiple
			>
				<option value="">All</option>
				<option value="article">Articles</option>
				<option value="content">Content</option>
			</Select>
		</label>

		{#if types.includes('content') || types.includes('') || !types.length}
			<label class="flex flex-col items-baseline gap-2">
				<strong>Content type</strong>

				<Select
					title="Content type (Multi-select)"
					name="contenttype"
					class="h-25! w-full overflow-hidden p-0!"
					bind:value={contentTypes}
					multiple
				>
					<option value="">All</option>
					<option value="image">Image</option>
					<option value="video">Video</option>
					<option value="audio">Audio</option>
					<option value="document">Document</option>
				</Select>
			</label>
		{/if}

		<label class="flex items-baseline gap-2">
			<strong class="min-w-12">Order</strong>
			<Select title="Order by" name="order" class="h-full w-full" bind:value={order}>
				<option value="desc">Descending</option>
				<option value="asc">Ascending</option>
			</Select>
		</label>

		<Button type="submit" class="self-start">
			<span>Apply filter</span>
		</Button>
	{/if}
</form>
