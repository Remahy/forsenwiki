<script>
	import Masonry from 'svelte-bricks';

	import { page } from '$app/stores';
	import LinkBox from '$lib/components/LinkBox.svelte';
	import Search from '$lib/components/Search.svelte';
	import SuggestionBox from '$lib/components/SuggestionBox.svelte';
	import { getCacheURL } from '$lib/utils/getCacheURL';

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
			<span class="font-bold">Tip:</span>
			<span>Searching by an author's username shows all content they've modified or created.</span>
		</p>
	</SuggestionBox>

	<Search />
	<div class="flex flex-col gap-2">
		{#if results?.length}
			<Masonry items={results}>
				{#snippet children({ item: result })}
					<LinkBox
						href={!result.type ? `/w/${result.title}` : `/content/${result.id}`}
						class="flex"
					>
						<div class="flex grow flex-col gap-2">
							<span class="line-clamp-1" title={result.rawTitle}>
								{#if !result.type}<span class="rounded bg-black/10 p-1 text-xs dark:bg-black"
										>Article</span
									>{:else if result.type === 'content'}
									<span class="rounded bg-violet-500/25 p-1 text-xs">Content</span>
								{/if}
								<strong>{result.rawTitle}</strong>
							</span>

							{#if result.html?.text}
								<p>{result.html.text}</p>
							{/if}

							{#if result.html?.image}
								<img src={getCacheURL(result.html.image).toString()} alt="" />
							{/if}

							{#if result.type === 'content'}
								<img src={result.title} alt={result.rawTitle} class="min-h-32 w-fit max-w-full" />
							{/if}
						</div>
					</LinkBox>
				{/snippet}
			</Masonry>
		{:else if $page.url.searchParams.get('query')}
			<p><strong>No search results found.</strong></p>
		{/if}
	</div>
</section>
