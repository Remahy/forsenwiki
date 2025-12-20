<script>
	import { formatRelative } from 'date-fns';
	import { enGB } from 'date-fns/locale';
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';
	import { source } from 'sveltekit-sse';
	import { page } from '$app/stores';
	import Box from '$lib/components/Box.svelte';
	import Link from '$lib/components/Link.svelte';
	import {
		getRecentChangesFilters,
		MINIMUM_LIMIT,
		MAXIMUM_LIMIT,
		createRecentChangesParams,
		handleAuthorsString,
	} from '$lib/utils/recentChanges';
	import Button from '$lib/components/Button.svelte';
	import { getMoreRecentChanges } from '$lib/api/recentchanges';

	const filters = $derived(getRecentChangesFilters($page.url.searchParams));

	let authorsInput = $derived(filters.authors.join(', '));
	const authors = $derived(handleAuthorsString(authorsInput));

	let limitInput = $derived(filters.limit);
	const limit = $derived(Number(limitInput));

	const handleFilterSearch = () => {
		const searchParams = createRecentChangesParams({ authors, limit });
		const url = new URL($page.url);
		url.search = `?${searchParams.toString()}`;
		window.location.href = url.toString();
	};

	/**
	 * @typedef {{ id: string, rawTitle: string, title: string, lastUpdated: string, author: string | null, byteLength: number }} Update
	 */

	/** @type {Writable<Update[]>} */
	const latestUpdates = writable($page.data.latestUpdates);

	let loading = $state(false);
	let done = $state(false);

	const handleLoadMore = async () => {
		loading = true;

		if (!$latestUpdates.length) {
			done = true;
			return;
		}

		try {
			const cursor = $latestUpdates[$latestUpdates.length - 1].id;

			const rawResponse = await getMoreRecentChanges({ authors, cursor, limit });
			const response = await rawResponse.json();
			$latestUpdates.push(...response);
			$latestUpdates = $latestUpdates;
			loading = false;

			if (response.length === 0) {
				done = true;
			}
		} catch (error) {
			loading = false;
		}
	};

	const sseArticleUpdate = source('/api/adonis/frontpage').select('article:update');

	onMount(() => {
		sseArticleUpdate.subscribe((v) => {
			if (v) {
				const values = $latestUpdates;

				/** @type {Update} */
				const input = JSON.parse(v);

				const exists = values.some(({ id }) => id === input.id);
				const filterValid = input.author ? authors.includes(input.author) : false;

				if (!exists && filterValid) {
					$latestUpdates.unshift(input);
					$latestUpdates = $latestUpdates;
				}
			}
		});
	});
</script>

<noscript>This page requires JavaScript to function.</noscript>

<section class="container mx-auto flex grow flex-col gap-4 p-4 lg:py-12">
	<Box class="flex flex-col overflow-hidden p-4 lg:mb-0">
		<div class="box-heading-wrapper mb-2">
			<h2 class="text-2xl">Recent Changes</h2>
		</div>
		<div class="flex flex-col gap-2">
			<label title="Authors">
				<span>Filter by authors:</span> <small>(Comma delimited)</small>
				<div><input bind:value={authorsInput} class="input-color w-full rounded-sm" /></div>
			</label>
			<label title="Limit">
				<span>Limit:</span>
				<div>
					<input
						bind:value={limitInput}
						type="number"
						min={MINIMUM_LIMIT}
						max={MAXIMUM_LIMIT}
						class="input-color rounded-sm"
					/>
				</div>
			</label>
			<Button on:click={handleFilterSearch}>Apply filter</Button>
		</div>
	</Box>
	<Box class="flex grow flex-col overflow-hidden p-4 lg:mb-0">
		{#each $latestUpdates as update}
			<div class="p-2 pl-0">
				<span>
					<Link href="/w/{update.title}/history/{update.id}.." target="_blank">
						<strong>{update.rawTitle}</strong> - {formatRelative(update.lastUpdated, Date.now(), {
							locale: enGB,
						})}</Link
					> - By {update.author} - Size: {update.byteLength}
				</span>
			</div>
		{:else}
			<span>Nothing found.</span>
		{/each}

		{#if !done && $latestUpdates.length}
			<div>
				<Button on:click={handleLoadMore} disabled={loading} class="mt-2"
					>Load {limit} more...</Button
				>
			</div>
		{/if}
	</Box>
</section>
