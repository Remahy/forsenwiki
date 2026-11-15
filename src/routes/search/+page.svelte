<script>
	import Masonry from 'svelte-bricks';
	import { formatRelative } from 'date-fns';
	import { enGB } from 'date-fns/locale';
	import InfiniteLoading from 'svelte-infinite-loading';

	import { page } from '$app/stores';
	import { searchRequest } from '$lib/api/search';
	import LinkBox from '$lib/components/LinkBox.svelte';
	import Search from '$lib/components/Search/index.svelte';
	import { getImageCacheURL } from '$lib/utils/getImageCacheURL';
	import Box from '$lib/components/Box.svelte';
	import ContentPreview from '$lib/components/content/ContentPreview.svelte';
	import Badge from '$lib/components/Badge.svelte';
	import { CONTENT_TYPE_BADGES, SEARCH_TYPE_BADGES } from '$lib/components/Search/badges';
	import { parseSearchURL } from '$lib/components/Search/parseSearchURL';

	/** @type {import('../api/search/+server').QueryResult[]} */
	let results = $state($page.data.results);

	let currentQuery = $derived(parseSearchURL($page.url));

	let currentPage = $derived(currentQuery.options.page);

	// @ts-ignore - These detail props are callbacks.
	function infiniteHandler({ detail: { complete, error, loaded } }) {
		const newSearchRequest = structuredClone(currentQuery);
		currentPage++;
		$page.url.searchParams.set('page', String(currentPage));
		newSearchRequest.options.page = currentPage;

		// Classic, good old, then & catch.
		searchRequest(newSearchRequest.query, newSearchRequest.types, newSearchRequest.options)
			.then(async (res) => {
				const newData = await res.json();
				if (newData.length) {
					const scrollTop = window.scrollY;
					results = [...results, ...newData];
					setTimeout(() => {
						window.scrollTo({ top: scrollTop, behavior: 'instant' });
						loaded();
					}, 1000);
				} else {
					complete();
				}
			})
			.catch((err) => {
				console.error(err);
				error();
			});
	}
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
			<Masonry items={results} animate={false} order="row-first">
				{#snippet children({ item: result })}
					<LinkBox
						href={!result.type ? `/w/${result.title}` : `/content/${result.id}`}
						class="flex"
						style="content-visibility: auto;"
						id={result.id}
						target="_blank"
					>
						<div class="flex grow flex-col gap-2">
							<div>
								{#if !result.type}
									<Badge class={SEARCH_TYPE_BADGES.article.color}
										>{SEARCH_TYPE_BADGES.article.label}</Badge
									>
								{:else if result.type === 'content'}
									<Badge class={SEARCH_TYPE_BADGES.content.color}
										>{SEARCH_TYPE_BADGES.content.label}</Badge
									>
									{#if result.fileType}
										{@const { icon, label } = CONTENT_TYPE_BADGES[result.fileType]}
										<Badge {icon}>{label}</Badge>
									{/if}
								{/if}

								<span title={result.rawTitle}>
									<strong>{result.rawTitle}</strong>
								</span>
							</div>

							<small title={new Date(result.createdTimestamp).toUTCString()}
								>{formatRelative(result.createdTimestamp, Date.now(), {
									locale: enGB,
								})}&nbsp;</small
							>

							{#if result.html?.text}
								<p>{result.html.text}</p>
							{/if}

							{#if result.html?.image}
								<img
									src={getImageCacheURL(result.html.image, { quality: 'low' }).toString()}
									alt=""
									loading="lazy"
								/>
							{/if}

							{#if result.type === 'content'}
								<ContentPreview {...result} />
							{/if}
						</div>
					</LinkBox>
				{/snippet}
			</Masonry>

			{#if currentQuery.types.length === 1}
				<InfiniteLoading on:infinite={infiniteHandler}>
					<div slot="noResults"></div>
					<div slot="noMore">
						<span>End of the road.</span>
						<br />
						forsen.wiki v0.0.1 launched {formatRelative('2024-05-25T11:42:29.000Z', Date.now(), {
							locale: enGB,
						})}
						<span title={new Date('2024-05-25T11:42:29.000Z').toUTCString()}
							>({new Date('2024-05-25T11:42:29.000Z').toDateString()})</span
						>
					</div>
				</InfiniteLoading>
			{/if}
		{:else if $page.url.searchParams.get('query')}
			<p><strong>No search results found.</strong></p>
		{/if}
	</main>
</section>
