<script>
	import { formatRelative } from 'date-fns';
	import { enGB } from 'date-fns/locale';
	import Masonry from 'svelte-bricks';
	import InfiniteLoading from 'svelte-infinite-loading';
	import { page } from '$app/stores';
	import Box from '$lib/components/Box.svelte';
	import { getImageCacheURL } from '$lib/utils/getImageCacheURL';
	import ContentPreview from '$lib/components/content/ContentPreview.svelte';
	import LinkBox from '$lib/components/LinkBox.svelte';
	import { parseSearchURL } from '$lib/components/Search/parseSearchURL';
	import { searchRequest } from '$lib/api/search';
	import SearchFilters from '$lib/components/Search/SearchFilters.svelte';
	import { listArticles, resetArticle } from '$lib/utils/indexedDb/article';
	import Spinner from '$lib/components/Spinner.svelte';
	import Link from '$lib/components/Link.svelte';
	import Button from '$lib/components/Button.svelte';
	import { resetContent } from '$lib/utils/indexedDb/content';
	import { SYSTEM } from '$lib/constants/constants';

	const id = $page.params.id;

	/** @type {import('../../api/search/+server').QueryResult[]} */
	let results = $state($page.data.results);
	/** @type {{ name: string, createdAt: Date, image: string, permissions: Array<{ type: string }> }} */
	let user = $state($page.data.user);

	const isMe = user.name === $page.data.session?.user?.name;

	let currentQuery = $derived(parseSearchURL($page.url));
	let currentPage = $derived(currentQuery.options.page);

	// @ts-ignore - These detail props are callbacks.
	function infiniteHandler({ detail: { complete, error, loaded } }) {
		const newSearchRequest = structuredClone(currentQuery);
		currentPage++;
		$page.url.searchParams.set('page', String(currentPage));
		newSearchRequest.options.page = currentPage;

		// Classic, good old, then & catch.
		searchRequest(id || '', newSearchRequest.types, newSearchRequest.options)
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

	let localDrafts = $state(listArticles());

	/**
	 * @param {string} name
	 */
	const onClickDeleteWrapper = (name) => {
		setTimeout(async () => {
			const ok = confirm(
				'Are you sure? This will delete your local draft edit and its uploaded content.'
			);

			if (ok) {
				await resetArticle(name);
				await resetContent(name);
				localDrafts = listArticles();
			}
		});
	};
</script>

<svelte:head>
	<title>User: {user.name} - Community Forsen Wiki</title>
	<meta
		name="description"
		content="This Pepega has contributed {results.length > 0 ? 'many' : 'no'} pieces of content."
	/>

	{#if user.image}
		<meta property="og:image" content={user.image} />
	{/if}
</svelte:head>

<section
	class="
		container mx-auto flex grow flex-col gap-4 p-4
		lg:py-12
	"
>
	<Box
		class="
			flex max-w-[unset] flex-col overflow-hidden p-4
			lg:mb-0
		"
	>
		<div class="flex flex-wrap gap-8">
			<div class="forsen-wiki-theme-border overflow-hidden rounded-lg border-2">
				<img src={user.image} alt="" loading="lazy" />
			</div>
			<div class="grow">
				<h1 class="mb-2 text-4xl font-bold">{user.name}</h1>
				<h2 class="mb-4 text-2xl">{results.length ? 'Editor' : 'Lurker'}</h2>

				<div class="flex flex-col gap-2">
					<p title={user.createdAt.toUTCString()}>
						<strong>Registered:</strong>
						<span>{formatRelative(user.createdAt, Date.now(), { locale: enGB })}</span>
					</p>
					{#if user.permissions.length}
						<p>
							<strong>Permissions:</strong>
							<span>{user.permissions.map(({ type }) => type).join(', ')}</span>
						</p>
					{/if}

					{#if isMe}
						<div>
							{#await localDrafts}
								<p class="inline-flex items-baseline gap-2">
									<Spinner />
									<span>Loading your drafts...</span>
								</p>
							{:then drafts}
								{@const draftsWithName = /**@type {Array<{ name: string }>}*/ (
									drafts.filter(({ name }) => typeof name === 'string')
								)}
								<p><strong>Your drafts:</strong></p>
								<ul class="ml-5 list-disc">
									{#each draftsWithName as draft (draft.name)}
										<li>
											<div class="flex items-baseline gap-2">
												{#if draft.name === 'new'}
													<Link href="/create">{draft.name}</Link>
												{:else}
													<Link href="/w/{draft.name}/edit">{draft.name}</Link>
												{/if}
												<Button
													class="bg-transparent! p-0! text-red-500!"
													onclick={() => onClickDeleteWrapper(draft.name)}
												>
													<span>Delete</span>
												</Button>
											</div>
										</li>
									{:else}
										<span class="-ml-5 italic">You don't have any drafts. Create some!</span>
									{/each}
								</ul>
							{/await}
						</div>
					{/if}
				</div>
			</div>
		</div>

		{#if results.length && id !== SYSTEM}
			<details class="mt-4" open={!!$page.url.searchParams.get('order')}>
				<summary class="cursor-pointer"><h2 class="inline text-2xl">User content</h2></summary>

				<div class="my-4">
					<form class="flex flex-col gap-4" data-sveltekit-reload>
						<SearchFilters />
					</form>
				</div>
				<Masonry items={results} animate={false}>
					{#snippet children({ item: result })}
						<LinkBox
							href={!result.type ? `/w/${result.title}` : `/content/${result.id}`}
							class="flex"
							style="content-visibility: auto;"
							id={result.id}
							target="_blank"
						>
							<div class="flex grow flex-col gap-2">
								<span class="line-clamp-1" title={result.rawTitle}>
									{#if !result.type}<span
											class="
												rounded-sm bg-black/10 p-1 text-xs
												dark:bg-black
											">Article</span
										>{:else if result.type === 'content'}
										<span class="rounded-sm bg-violet-500/25 p-1 text-xs">Content</span>
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
									<img src={getImageCacheURL(result.html.image).toString()} alt="" loading="lazy" />
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
						</div>
					</InfiniteLoading>
				{/if}
			</details>
		{/if}
	</Box>
</section>
