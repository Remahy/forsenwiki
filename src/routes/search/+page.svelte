<script>
	import { page } from '$app/stores';
	import LinkBox from '$lib/components/LinkBox.svelte';
	import LinkButton from '$lib/components/LinkButton.svelte';
	import Search from '$lib/components/Search.svelte';

	/** @type {import('./+page.server').QueryResult[]} */
	let results = $page.data.results;
</script>

<svelte:head>
	<title>Search the Community Forsen Wiki</title>
	<meta
		name="description"
		content="Query for forsen, forsen forsen forsen forsen forsen forsen, and more."
	/>
</svelte:head>

<section class="container mx-auto flex grow flex-col gap-4 p-8 lg:py-12">
	<div
		class="w-full rounded bg-gradient-to-br from-violet-200 to-violet-300 p-4 dark:from-violet-800/30 dark:to-violet-950/30"
	>
		<p class="m-0 text-center leading-10">
			<strong>Tip:</strong>
			<span>Searching by an author's username shows all content they've modified or created.</span>
		</p>
	</div>

	<Search />

	<div class="flex flex-col gap-2">
		{#each results as result}
			<LinkBox href={!result.type ? `/w/${result.title}` : `/content/${result.id}`} class="flex">
				<div class="flex grow flex-col gap-2">
					<strong class="break-words">{result.rawTitle}</strong>
					<p>Last updated: {new Date(result.lastUpdated).toLocaleString()}</p>
					{#if result.type === 'content'}
						<img src={result.title} alt={result.rawTitle} class="w-fit max-w-full" />
					{/if}
				</div>
				{#if result.type === 'content'}
					<div>
						<LinkButton href="{result.title}">Open</LinkButton>
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
