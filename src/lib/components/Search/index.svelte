<script>
	import { SearchIcon } from '@lucide/svelte';
	import { page } from '$app/stores';

	import Button from '../Button.svelte';
	import Select from '../Select.svelte';
	import { parseSearchURL } from './parseSearchURL';

	let { inline = false } = $props();

	let query = $state($page.url.pathname === '/search' ? $page.url.searchParams.get('query') : '');

	/** @type {string[]} */
	let types = $state([]);

	/** @type {string[]} */
	let contentTypes = $state([]);

	/** @type {string} */
	let order = $state('');

	$effect(() => {
		const { url } = $page;

		if (url.pathname === '/search') {
			const {
				query: q,
				types: t,
				options: { orderBy: o, contentTypes: ct },
			} = parseSearchURL(url);

			query = q;
			types = t;
			order = o;

			if (t.includes('content') || t.includes('') || !t.length) {
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
		<div class="flex flex-col gap-1">
			<strong class="min-w-25">Type</strong>
			<div class="flex items-baseline gap-3">
				<label class="flex flex-wrap items-baseline gap-2">
					<input
						type="checkbox"
						checked={!types.length || types.includes('')}
						disabled
						class="opacity-50"
					/>
					<span>All</span>
				</label>
				<label class="flex items-baseline gap-2">
					<input type="checkbox" name="type" bind:group={types} value="article" />
					<span>Articles</span>
				</label>

				<label class="flex items-baseline gap-2">
					<input type="checkbox" name="type" bind:group={types} value="content" />
					<span>Content</span>
				</label>
			</div>
		</div>

		{#if types.includes('content') || types.includes('') || !types.length}
			<div class="flex flex-col gap-1">
				<strong class="min-w-25">Content type</strong>
				<div class="flex flex-wrap items-baseline gap-3">
					<label class="flex items-baseline gap-2">
						<input
							type="checkbox"
							checked={!contentTypes.length || contentTypes.includes('')}
							disabled
							class="opacity-50"
						/>
						<span>All</span>
					</label>

					<label class="flex items-baseline gap-2">
						<input type="checkbox" name="contenttype" bind:group={contentTypes} value="image" />
						<span>Image</span>
					</label>
					<label class="flex items-baseline gap-2">
						<input type="checkbox" name="contenttype" bind:group={contentTypes} value="video" />
						<span>Video</span>
					</label>
					<label class="flex items-baseline gap-2">
						<input type="checkbox" name="contenttype" bind:group={contentTypes} value="audio" />
						<span>Audio</span>
					</label>
					<label class="flex items-baseline gap-2">
						<input type="checkbox" name="contenttype" bind:group={contentTypes} value="document" />
						<span>Document</span>
					</label>
				</div>
			</div>
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
