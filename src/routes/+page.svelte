<script>
	import { onMount } from 'svelte';
	import { Dice4Icon, HistoryIcon, NewspaperIcon, SearchIcon, SquarePenIcon } from 'lucide-svelte';
	import { writable } from 'svelte/store';
	import { source } from 'sveltekit-sse';

	import { page } from '$app/stores';
	import Box from '$lib/components/Box.svelte';
	import Link from '$lib/components/Link.svelte';
	import LinkButton from '$lib/components/LinkButton.svelte';
	import SuggestionBox from '$lib/components/SuggestionBox.svelte';
	import Container from '$lib/components/Container.svelte';

	/**
	 * @typedef {import('./+page.server').LatestArticle} LatestArticle
	 * @typedef {import('./+page.server').LatestUser} LatestUser
	 * @typedef {import('./+page.server').GoatCounterHit} GoatCounterHit
	 */

	/** @type {Writable<LatestArticle[]>} */
	const latestArticles = writable($page.data.latestArticles);
	/** @type {Writable<LatestUser[]>} */
	const latestUsers = writable($page.data.latestUsers);
	/** @type {Writable<GoatCounterHit[]>} */
	const popularArticles = writable($page.data.popularArticles);

	const sseArticleCreate = source('/api/adonis/frontpage').select('article:create');
	const sseUserCreate = source('/api/adonis/frontpage').select('user:create');
	const sseArticlesPopular = source('/api/adonis/frontpage').select('articles:popular');

	onMount(() => {
		sseArticleCreate.subscribe((v) => {
			if (v) {
				const values = $latestArticles;

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

				latestArticles.set(values);
			}
		});
		sseUserCreate.subscribe((v) => {
			if (v) {
				const values = $latestUsers;

				/** @type {LatestUser} */
				const input = JSON.parse(v);
				if (values[0].name === input.name) {
					return;
				}

				const newLength = values.unshift(input);

				if (newLength > 5) {
					values.pop();
				}

				latestUsers.set(values);
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
	<meta
		name="description"
		content="All things forsen, forsen forsen forsen forsen forsen forsen, and more."
	/>
</svelte:head>

<Container>
	<SuggestionBox>
		<p class="m-0 text-center leading-10">
			<strong>ForsenWiki</strong>
			<span> - </span>
			<span>Forsen lore, news, big plays, tilts. Forsen's past and the bajs' future. </span>
		</p>
	</SuggestionBox>

	<div class="block grow gap-4 lg:flex">
		<div class="mb-4 flex grow flex-col lg:mb-0">
			<Box class="grow p-4">
				<div class="box-heading-wrapper mb-2">
					<h2 class="text-2xl">New articles</h2>
				</div>
				{#each $latestArticles as article}
					<div class="p-2 pl-0">
						<Link href="/w/{article.title}">
							<strong>{article.rawTitle}</strong>
						</Link>
						<span>
							- <span title={new Date(article.createdTimestamp).toUTCString()}
								>{new Date(article.createdTimestamp).toDateString()}</span
							>
							- By {article.author}
						</span>
					</div>
				{/each}
			</Box>

			{#if $popularArticles.length}
				<Box class="mt-4 grow p-4">
					<div class="box-heading-wrapper mb-2 flex items-center justify-between">
						<h2 class="text-2xl">Popular articles</h2>
						<Link href="https://stats.forsen.wiki/" target="_blank">STATS.FORSEN.WIKI</Link>
					</div>
					{#each $popularArticles as article}
						<div class="p-2 pl-0">
							<Link href={article.path}>
								<span>
									<strong>{article.title}</strong> - {article.count} hits
								</span>
							</Link>
						</div>
					{/each}
				</Box>
			{/if}
		</div>

		<div class="block flex-col gap-4 lg:flex lg:w-96 lg:min-w-96">
			<Box class="mb-4 flex flex-col gap-2 p-4 lg:mb-0">
				<div class="box-heading-wrapper mb-2">
					<h2 class="text-2xl">Navigation</h2>
				</div>
				<LinkButton href="/recentchanges" class="flex gap-2 whitespace-nowrap">
					<HistoryIcon /> <span>Recent changes</span>
				</LinkButton>
				<LinkButton href="/browse" class="flex gap-2 whitespace-nowrap">
					<NewspaperIcon /> <span>All articles</span>
				</LinkButton>
				<LinkButton href="/create" class="flex gap-2 whitespace-nowrap" reload>
					<SquarePenIcon /> <span>Create new article</span>
				</LinkButton>
				<LinkButton href="/search" class="flex gap-2 whitespace-nowrap">
					<SearchIcon /> <span>Search</span>
				</LinkButton>
				<LinkButton href="/random" class="flex gap-2 whitespace-nowrap">
					<Dice4Icon /> <span>Random</span>
				</LinkButton>
			</Box>

			<Box class="overflow-hidden p-4">
				<div class="box-heading-wrapper mb-2">
					<h2 class="text-2xl">New users</h2>
				</div>

				{#each $latestUsers as user}
					<div class="p-2 pl-0">
						<span title={user.name}>
							<strong>{user.name}</strong>
						</span>
					</div>
				{/each}
			</Box>
		</div>
	</div>
</Container>
