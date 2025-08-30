<script>
	import { EditIcon, HistoryIcon } from 'lucide-svelte';
	import { formatRelative } from 'date-fns';
	import { enGB } from 'date-fns/locale';

	import '$lib/components/editor/plugins/Image/Image.css';

	import Container from '$lib/components/Container.svelte';
	import LinkButton from '$lib/components/LinkButton.svelte';
	import SuggestionBox from '$lib/components/SuggestionBox.svelte';
	import Box from '$lib/components/Box.svelte';
	import ToC from '$lib/components/ToC.svelte';
	import RandomButton from '$lib/components/RandomButton.svelte';
	import CacheBustButton from '$lib/components/CacheBustButton.svelte';

	let { data } = $props();

	const {
		post: { rawTitle, title, createdTimestamp, lastUpdated, outRelations, id },
		authors,
		html,
		text,
		image,
	} = data;

	const isSystem =
		outRelations.find(({ isSystem, toPostId }) => isSystem && toPostId === 'system') ||
		id === 'system';

	const authorsScriptContent = JSON.stringify({
		'@context': 'https://schema.org',
		author: authors.map((author) => ({
			'@type': 'Person',
			name: author.name?.replace(/[^\w]/g, ''),
		})),
	});
	const authorsHTML = `<script type="application/ld+json">${authorsScriptContent}<\/script>`;
</script>

<svelte:head>
	<title>{rawTitle || title} - Community Forsen Wiki</title>
	<meta
		name="title"
		content="Read about &quot;{rawTitle ||
			title}&quot; on forsen.wiki - All things forsen, and more."
	/>

	{#if text?.length}
		<meta name="description" content={`${text.substring(0, 64)}${text.length > 64 ? '...' : ''}`} />
	{/if}
	{#if image?.length}
		<meta name="og:image" content={image} />
	{/if}

	{@html authorsHTML}
</svelte:head>

<Container>
	<article class="relative flex grow flex-col gap-4">
		<RandomButton />

		{#if html}
			<SuggestionBox>
				<header>
					<div class="flex w-full gap-2">
						<div class="flex grow items-center overflow-hidden">
							<p class="m-0 text-center leading-10">
								forsen.wiki is currently <strong>work in progress</strong>.
							</p>
						</div>

						<div class="flex shrink-0 items-start gap-2">
							<LinkButton href="/w/{title}/history" class="flex items-center gap-2 text-sm">
								<HistoryIcon size="16" /><span class="hidden md:inline">History</span>
							</LinkButton>

							<LinkButton href="/w/{title}/edit" reload class="flex items-center gap-2 text-sm">
								<EditIcon size="16" /><span class="hidden md:inline">Edit article</span>
							</LinkButton>
						</div>
					</div>
				</header>
			</SuggestionBox>

			<div class="flex grow flex-col gap-4 lg:flex-row">
				<Box class="flex grow flex-col p-4 lg:mb-0">
					<main class="article-root prose dark:prose-invert max-w-[unset] grow">
						<div class="forsen-wiki-theme-border mb-2 border-b-2 pb-2">
							<strong class="text-4xl">{rawTitle}</strong>
						</div>

						{@html html}
					</main>
				</Box>

				<ToC />
			</div>
		{:else if isSystem}
			<Box class="flex grow flex-col items-center justify-center gap-2 overflow-hidden p-12">
				<h2 class="text-2xl">
					This is {id === 'system' ? 'the' : 'a'} <strong>SYSTEM</strong> article with no content.
				</h2>
				<p><small>System articles are used for creating backend relations.</small></p>
			</Box>
		{:else}
			<div class="prose dark:prose-invert max-w-[unset]">
				<p>This article does not have any HTML available.</p>
				<pre>{JSON.stringify(data, null, 2)}</pre>
			</div>
		{/if}

		<footer class="article-footer-color p-4">
			<p>
				<span title={createdTimestamp.toString()}>
					<strong>Created:</strong>
					{createdTimestamp.toDateString()}
				</span>
				{#if lastUpdated.getTime() !== createdTimestamp.getTime()}
					<span title={lastUpdated.toString()}>
						<strong>Updated:</strong>
						{formatRelative(lastUpdated, Date.now(), { locale: enGB })}
					</span>
				{/if}
			</p>

			{#if authors.length}
				<p>
					<span><strong>Authors:</strong></span>
					<span>
						{#each authors as author, index}
							{author.name}{index < authors.length - 1 ? ', ' : ''}
						{/each}
					</span>
				</p>
			{/if}
		</footer>
	</article>

	<details class="-mt-4">
		<summary></summary>

		<CacheBustButton />
	</details>
</Container>
