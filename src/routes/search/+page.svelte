<script>
	import Masonry from 'svelte-bricks';
	import { formatRelative } from 'date-fns';
	import { enGB } from 'date-fns/locale';

	import { page } from '$app/stores';
	import LinkBox from '$lib/components/LinkBox.svelte';
	import Search from '$lib/components/Search/index.svelte';
	import { getImageCacheURL } from '$lib/utils/getImageCacheURL';
	import Box from '$lib/components/Box.svelte';
	import ContentPreview from '$lib/components/content/ContentPreview.svelte';

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
	<Box class="flex flex-col overflow-hidden p-4 lg:mb-0">
		<div class="box-heading-wrapper mb-2">
			<h2 class="text-2xl">Search</h2>
		</div>
		<div class="flex flex-col gap-2">
			<p class="m-0 text-xs">
				<span class="font-bold">Tip:</span>
				<span
					>Searching using an author's username shows everything they've created and modified.</span
				>
			</p>
			<Search />
		</div>
	</Box>

	<main class="flex flex-col gap-2">
		{#if results?.length}
			{#if $page.url.searchParams.get('query') === '' && (!$page.url.searchParams.get('order') || $page.url.searchParams.get('order') === 'desc')}
				<p><strong>Recently created articles & content.</strong></p>
			{/if}
			<Masonry items={results}>
				{#snippet children({ item: result })}
					<LinkBox
						href={!result.type ? `/w/${result.title}` : `/content/${result.id}`}
						class="flex"
						style="content-visibility: auto;"
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
							<small title={new Date(result.lastUpdated).toUTCString()}
								>{formatRelative(result.lastUpdated, Date.now(), {
									locale: enGB,
								})}&nbsp;</small
							>

							{#if result.html?.text}
								<p>{result.html.text}</p>
							{/if}

							{#if result.html?.image}
								<img src={getImageCacheURL(result.html.image).toString()} alt="" />
							{/if}

							{#if result.type === 'content'}
								<ContentPreview {...result} />
							{/if}
						</div>
					</LinkBox>
				{/snippet}
			</Masonry>
		{:else if $page.url.searchParams.get('query')}
			<p><strong>No search results found.</strong></p>
		{/if}
	</main>
</section>
