<script>
	import { onMount } from 'svelte';
	import {
		Dice4Icon,
		HistoryIcon,
		FolderSearchIcon,
		SquarePenIcon,
		ImageIcon,
	} from '@lucide/svelte';
	import { writable } from 'svelte/store';
	import { source } from 'sveltekit-sse';

	import { page } from '$app/stores';
	import Box from '$lib/components/Box.svelte';
	import Link from '$lib/components/Link.svelte';
	import LinkButton from '$lib/components/LinkButton.svelte';
	import SuggestionBox from '$lib/components/SuggestionBox.svelte';
	import Container from '$lib/components/Container.svelte';
	import StreamerModeShow from '$lib/components/StreamerModeShow.svelte';
	import { getImageCacheURL } from '$lib/utils/getImageCacheURL';

	let streamerMode = $state($page.data.session?.user?.userSettings?.streamerMode);

	/**
	 * @typedef {import('./+page.server').LatestArticle} LatestArticle
	 * @typedef {import('./+page.server').GoatCounterHit} GoatCounterHit
	 * @typedef {import('./+page.server').MostLinkedArticle} MostLinkedArticle
	 */

	/** @type {MostLinkedArticle[]} */
	const mostLinkedArticles = $page.data.mostLinkedArticles ?? [];

	/** @type {Writable<LatestArticle[]>} */
	const latestPosts = writable($page.data.latestArticles);
	/** @type {Writable<GoatCounterHit[]>} */
	const popularArticles = writable($page.data.popularArticles);

	const ssePostCreate = source('/api/adonis/frontpage').select('post:create');
	const sseArticlesPopular = source('/api/adonis/frontpage').select('articles:popular');

	onMount(() => {
		ssePostCreate.subscribe((v) => {
			if (v) {
				const values = $latestPosts;

				/** @type {LatestArticle} */
				const input = JSON.parse(v);
				if (
					new Date(values[0].createdTimestamp).getTime() ===
					new Date(input.createdTimestamp).getTime()
				) {
					return;
				}

				const newLength = values.unshift(input);
				if (newLength > 5) {
					values.pop();
				}

				latestPosts.set(values);
			}
		});
		sseArticlesPopular.subscribe((v) => {
			if (v) {
				/** @type {GoatCounterHit[]} */
				const input = JSON.parse(v);

				popularArticles.set(input);
			}
		});
	});
</script>

<svelte:head>
	<title>Community Forsen Wiki</title>
	<meta name="description" content="All things forsen, forsen community and more." />
</svelte:head>

<Container>
	{#if streamerMode}
		<SuggestionBox>
			<p class="m-0 text-center leading-10">
				<strong>Streamer mode is enabled.</strong>
			</p>
		</SuggestionBox>
	{/if}

	<nav aria-label="Navigation" class="mb-4">
		<Box class="grid grid-cols-2 gap-2 p-4 sm:grid-cols-4">
			<LinkButton href="/activity" class="flex gap-2 whitespace-nowrap">
				<HistoryIcon /> <span>Activity</span>
			</LinkButton>
			<LinkButton href="/create" class="flex gap-2 whitespace-nowrap" reload>
				<SquarePenIcon /> <span>New article</span>
			</LinkButton>
			<LinkButton href="/content" class="flex gap-2 whitespace-nowrap">
				<FolderSearchIcon /> <span>Content</span>
			</LinkButton>
			<LinkButton href="/random" class="flex gap-2 whitespace-nowrap">
				<Dice4Icon /> <span>Random</span>
			</LinkButton>
		</Box>
	</nav>

	<div class="block grow gap-4 lg:flex lg:items-start">
		<div class="mb-4 flex grow flex-col lg:mb-0">
			<Box class="p-4">
				<div class="box-heading-wrapper mb-2">
					<h2 class="text-2xl">Latest articles</h2>
				</div>
				{#each $latestPosts as post, index (post.title)}
					<div class="p-2 {index % 2 ? 'bg-black/10 dark:bg-white/5' : ''}">
						<Link href="/w/{post.title}" class="inline-block min-w-32">
							<strong>{post.rawTitle}</strong>
						</Link>
						<span
							title={new Date(post.createdTimestamp).toUTCString()}
							class="inline-block min-w-32"
						>
							{new Date(post.createdTimestamp).toDateString()}&nbsp;
						</span>
						<small class="inline-block">
							<span class="font-bold">By:</span>
							<StreamerModeShow>
								<Link href="/user/{post.authorId}" class="decoration-1!">{post.author}</Link>
							</StreamerModeShow>
						</small>
					</div>
				{/each}
			</Box>
		</div>

		<div class="flex flex-col gap-4 lg:w-96 lg:min-w-96">
			{#if mostLinkedArticles.length}
				<Box class="p-4">
					<ul class="m-0 grid list-none grid-cols-1 gap-2 p-0 sm:grid-cols-2 lg:grid-cols-1">
						{#each mostLinkedArticles as article (article.title)}
							<li class="suggestion-box rounded-sm p-2!">
								<Link
									href="/w/{article.title}"
									class="flex items-center gap-3 no-underline! decoration-0!"
								>
									{#if article.image && !streamerMode}
										<img
											src={getImageCacheURL(article.image, {
												height: 112,
												quality: 'low',
											}).toString()}
											alt=""
											loading="lazy"
											width="56"
											height="56"
											class="h-14 w-14 shrink-0 rounded-sm object-cover"
										/>
									{:else}
										<span
											aria-hidden="true"
											class="flex h-14 w-14 shrink-0 items-center justify-center rounded-sm bg-black/10 opacity-50 dark:bg-white/5"
										>
											<ImageIcon />
										</span>
									{/if}
									<span class="flex min-w-0 flex-col">
										<strong class="wrap-break-words">{article.rawTitle}</strong>
										{#if article.linkCount > 1}
											<small>Linked in {article.linkCount} articles</small>
										{/if}
									</span>
								</Link>
							</li>
						{/each}
					</ul>
					<div
						class="box-heading-wrapper mt-2 flex items-center justify-end border-t-2 border-b-0! pt-2 pb-0!"
					>
						<Link href="/w" target="_blank">All articles</Link>
					</div>
				</Box>
			{/if}

			{#if $popularArticles.length}
				<Box class="p-4">
					<div class="box-heading-wrapper mb-2">
						<h2 class="text-2xl">Popular articles</h2>
					</div>
					{#each $popularArticles as article, index (article.path)}
						<div
							class="flex items-baseline justify-between gap-2 p-2 {index % 2
								? 'bg-black/10 dark:bg-white/5'
								: ''}"
						>
							<Link href={article.path}><strong>{article.title}</strong></Link>
							<span class="shrink-0">{article.count} hits</span>
						</div>
					{/each}
					<div
						class="box-heading-wrapper mt-2 flex items-center justify-end border-t-2 border-b-0! pt-2 pb-0!"
					>
						<Link href="https://stats.forsen.wiki/" target="_blank">STATS.FORSEN.WIKI</Link>
					</div>
				</Box>
			{/if}
		</div>
	</div>
</Container>
