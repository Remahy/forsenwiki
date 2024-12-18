<script>
	import { Dice4Icon, NewspaperIcon, SearchIcon, SquarePenIcon } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';
	import { source } from 'sveltekit-sse';
	import { formatRelative } from 'date-fns';
	import { enGB } from 'date-fns/locale';

	import { page } from '$app/stores';
	import Box from '$lib/components/Box.svelte';
	import Link from '$lib/components/Link.svelte';
	import LinkButton from '$lib/components/LinkButton.svelte';
	import SuggestionBox from '$lib/components/SuggestionBox.svelte';

	/**
	 * @typedef {import('./+page.server').LatestArticle} LatestArticle
	 * @typedef {import('./+page.server').LatestUpdate} LatestUpdate
	 * @typedef {import('./+page.server').LatestUser} LatestUser
	 */

	/** @type {Writable<LatestArticle[]>} */
	const latestArticles = writable($page.data.latestArticles);
	/** @type {Writable<LatestUpdate[]>} */
	const latestUpdates = writable($page.data.latestUpdates);
	/** @type {Writable<LatestUser[]>} */
	const latestUsers = writable($page.data.latestUsers);

	const value = source('/adonis/frontpage').select('article:create');
	const value2 = source('/adonis/frontpage').select('article:update');
	const value3 = source('/adonis/frontpage').select('user:create');

	onMount(() => {
		value.subscribe((v) => {
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
		value2.subscribe((v) => {
			if (v) {
				const values = $latestUpdates;

				/** @type {LatestUpdate} */
				const input = JSON.parse(v);

				if (new Date(values[0].lastUpdated).getTime() === new Date(input.lastUpdated).getTime()) {
					return;
				}

				const newLength = values.unshift(input);

				if (newLength > 5) {
					values.pop();
				}

				latestUpdates.set(values);
			}
		});
		value3.subscribe((v) => {
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
	});
</script>

<svelte:head>
	<title>Community Forsen Wiki</title>
	<meta
		name="description"
		content="All things forsen, forsen forsen forsen forsen forsen forsen, and more."
	/>
</svelte:head>

<section class="container mx-auto flex grow flex-col p-4 lg:py-12">
	<SuggestionBox>
		<p class="m-0 text-center leading-10">
			<strong>ForsenWiki</strong>
			<span> - </span>
			<span>
				Forsen mixes, news, big plays, tilts. Everything that is somewhat related to forsen.
			</span>
		</p>
	</SuggestionBox>

	<div class="block grow gap-4 lg:flex">
		<div class="mb-4 flex grow flex-col lg:mb-0">
			<Box class="mb-4 grow p-4">
				<div class="box-heading-wrapper mb-2">
					<h2 class="text-2xl">Recent updates</h2>
				</div>
				{#each $latestUpdates as update}
					<div class="p-2 pl-0">
						<Link href="/w/{update.title}">
							<span>
								<strong>{update.rawTitle}</strong> - {formatRelative(
									update.lastUpdated,
									Date.now(),
									{ locale: enGB }
								)} - By {update.author}
							</span>
						</Link>
					</div>
				{/each}
			</Box>

			<Box class="grow p-4">
				<div class="box-heading-wrapper mb-2">
					<h2 class="text-2xl">New articles</h2>
				</div>
				{#each $latestArticles as article}
					<div class="p-2 pl-0">
						<Link href="/w/{article.title}">
							<span>
								<strong>{article.rawTitle}</strong> - {new Date(
									article.createdTimestamp
								).toDateString()} - By {article.author}
							</span>
						</Link>
					</div>
				{/each}
			</Box>
		</div>

		<div class="block flex-col gap-4 lg:flex lg:min-w-96">
			<Box class="mb-4 flex flex-col gap-2 p-4 lg:mb-0">
				<div class="box-heading-wrapper mb-2">
					<h2 class="text-2xl">Navigation</h2>
				</div>

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

			<Box class="p-4">
				<div class="box-heading-wrapper mb-2">
					<h2 class="text-2xl">New users</h2>
				</div>

				{#each $latestUsers as user}
					<div class="p-2 pl-0">
						<span>
							<strong>{user.name}</strong>
						</span>
					</div>
				{/each}
			</Box>
		</div>
	</div>
</section>
