<script>
	import { page } from '$app/stores';
	import LinkBox from '$lib/components/LinkBox.svelte';
	import LinkButton from '$lib/components/LinkButton.svelte';
	import Search from '$lib/components/Search.svelte';
	import SuggestionBox from '$lib/components/SuggestionBox.svelte';

	/** @type {import('../api/search/+server').QueryResult[]} */
	let results = $page.data.results;
</script>

<svelte:head>
	<title>Search the Community Forsen Wiki</title>
	<meta
		name="description"
		content="Query for forsen, forsen forsen forsen forsen forsen forsen, and more."
	/>
</svelte:head>

<section class="container mx-auto flex grow flex-col gap-4 p-4 lg:py-12">
	<SuggestionBox>
		<p class="m-0 text-center leading-10">
			<strong>Tip:</strong>
			<span>Searching by an author's username shows all content they've modified or created.</span>
		</p>
	</SuggestionBox>

	<Search />

	<div class="flex flex-col gap-2">
		{#each results as result (result.id)}
			<LinkBox href={!result.type ? `/w/${result.title}` : `/content/${result.id}`} class="flex">
				<div class="flex grow flex-col gap-2">
					<strong class="break-words">{result.rawTitle}</strong>
					<p>
						Last updated: <span title={new Date(result.lastUpdated).toUTCString()}
							>{new Date(result.lastUpdated).toLocaleString()}</span
						>
					</p>
					{#if result.type === 'content'}
						<img src={result.title} alt={result.rawTitle} class="w-fit max-w-full" />
					{/if}
				</div>
				{#if result.type === 'content'}
					<div>
						<LinkButton href={result.title}>Open</LinkButton>
					</div>
				{/if}
			</LinkBox>
		{:else}
			{#if $page.url.searchParams.get('query')}
				<p><strong>No search results found.</strong></p>
			{/if}
		{/each}
	</div>
</section>
