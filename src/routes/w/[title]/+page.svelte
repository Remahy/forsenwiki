<script lang="ts">
	import { SquarePenIcon, HistoryIcon } from 'lucide-svelte';
	import { formatRelative } from 'date-fns';
	import { enGB } from 'date-fns/locale';
	import { page } from '$app/stores';

	import '$lib/components/editor/plugins/Image/Image.css';

	import Container from '$lib/components/Container.svelte';
	import LinkButton from '$lib/components/LinkButton.svelte';
	import SuggestionBox from '$lib/components/SuggestionBox.svelte';
	import Box from '$lib/components/Box.svelte';
	import ToC from '$lib/components/ToC.svelte';
	import RandomButton from '$lib/components/RandomButton.svelte';
	import CacheBustButton from '$lib/components/CacheBustButton.svelte';
	import Link from '$lib/components/Link.svelte';
	import { isSystem } from '$lib/utils/isSystem.js';

	const submitErrors = $derived.by(() => {
		try {
			const rawErrors: Array<{ code: string; field: string; value?: string }> | null = JSON.parse(
				$page.url.searchParams.get('partialErrors') || ''
			);
			if (!rawErrors || !(rawErrors instanceof Array)) {
				return [];
			}

			// We don't want to display messages verbatim from the URL to make sure users don't modify it.
			const ERROR_CONSTANT: { [key: string]: string } = {
				'EMPTY-newTitle': 'New title submission is empty. Given value: %',
				'ILLEGAL-newTitle': 'New title submission failed sanitization. Given value: %',
				'EXISTS-newTitle':
					'New title submission failed because an article with this title already exists. Given value: %',
				default: 'Something went wrong updating the article.',
			};

			return rawErrors.map(
				({ code, field, value }) =>
					ERROR_CONSTANT[`${code}-${field}`].replace('%', value || '') || ERROR_CONSTANT.default
			);
		} catch {
			// noop
			return [];
		}
	});

	let { data } = $props();

	const {
		post: { rawTitle, title, createdTimestamp, lastUpdated, outRelations, id },
		authors,
		relatedPosts,
		html,
		text,
		image,
	} = $derived(data);

	const isArticleSystem = $derived(isSystem({ id, outRelations }));

	const authorsScriptContent = $derived(
		JSON.stringify({
			'@context': 'https://schema.org',
			author: authors
				.filter((author) => author.name !== null)
				.map((author) => ({
					'@type': 'Person',
					name: author.name!.replace(/[^\w]/g, ''),
				})),
		})
	);
	const authorsHTML = $derived(
		`<script type="application/ld+json">${authorsScriptContent}<\/script>`
	);

	// @ts-ignore
	BigInt.prototype.toJSON = function () {
		return { $bigint: this.toString() };
	};
</script>

<svelte:head>
	<title>{rawTitle || title} - Community Forsen Wiki</title>

	<meta property="og:site_name" content="Forsen Wiki" />

	{#if !isArticleSystem}
		<link rel="canonical" href="{$page.url.origin}/w/{title}" />
		<meta property="og:url" content="{$page.url.origin}/w/{title}" />

		<meta property="og:type" content="article" />

		{#if text?.length}
			<meta
				name="description"
				content={`${text.substring(0, 150)}${text.length > 150 ? '...' : ''}`}
			/>
			<meta
				property="og:description"
				content={`${text.substring(0, 150)}${text.length > 150 ? '...' : ''}`}
			/>
		{/if}

		{#if image?.length}
			<meta property="og:image" content={image} />
		{/if}

		<meta property="article:published_time" content={createdTimestamp.toISOString()} />
		<meta property="article:modified_time" content={lastUpdated.toISOString()} />

		{#each authors as author}
			{#if author.name}
				<meta property="article:author" content={author.name} />
			{/if}
		{/each}

		{@html authorsHTML}
	{/if}
</svelte:head>

<Container>
	<article class="relative flex grow flex-col gap-4">
		<RandomButton />

		{#if submitErrors.length}
			<Box class="!bg-yellow-300/75 p-4 text-black">
				<strong>Partial submit error(s)</strong>
				{#each submitErrors as error}
					<p>{error}</p>
				{/each}
			</Box>
		{/if}

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
								<SquarePenIcon size="16" /><span class="hidden md:inline">Edit article</span>
							</LinkButton>
						</div>
					</div>
				</header>
			</SuggestionBox>

			<div class="flex grow flex-col gap-4 lg:flex-row">
				<Box class="flex grow flex-col overflow-hidden p-4 lg:mb-0">
					<main class="article-root prose dark:prose-invert max-w-[unset] grow break-words">
						<div class="forsen-wiki-theme-border mb-2 border-b-2 pb-2">
							<strong class="text-4xl">{rawTitle}</strong>
						</div>

						{@html html}
					</main>
				</Box>

				<ToC />
			</div>
		{:else if isArticleSystem}
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
				<span title={createdTimestamp.toUTCString()}>
					<strong>Created:</strong>
					{createdTimestamp.toDateString()}
				</span>
				{#if lastUpdated.getTime() !== createdTimestamp.getTime()}
					<span title={lastUpdated.toUTCString()}>
						<strong>Updated:</strong>
						{formatRelative(lastUpdated, Date.now(), { locale: enGB })}
					</span>
				{/if}
			</p>

			{#if authors.length}
				<p>
					<span><strong>Author{authors.length > 1 ? 's' : ''}:</strong></span>
					<span>
						{#each authors as author, index}
							{author.name}{index < authors.length - 1 ? ', ' : ''}
						{/each}
					</span>
				</p>
			{/if}
		</footer>

		{#if relatedPosts.length}
			<div class="article-footer-color p-4">
				<p>
					<span><strong>Article{relatedPosts.length > 1 ? 's' : ''} linking here:</strong></span>
					<span>
						{#each relatedPosts as post, index}
							<Link href={post.title} reload>{post.rawTitle}</Link>{index < relatedPosts.length - 1
								? ', '
								: ''}
						{/each}
					</span>
				</p>
			</div>
		{/if}
	</article>

	<footer class="article-footer-color p-4">
		<details>
			<summary class="cursor-pointer"><strong>Tools</strong></summary>

			<div class="flex gap-4">
				<CacheBustButton />
				<LinkButton
					class="mt-2 min-h-[unset] min-w-[unset] !p-1 text-xs"
					href="/api/article/read/{title}">API request</LinkButton
				>
			</div>
		</details>
	</footer>
</Container>
