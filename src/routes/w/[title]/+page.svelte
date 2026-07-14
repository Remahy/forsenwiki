<script>
	/* eslint-disable svelte/no-at-html-tags */
	import { onMount } from 'svelte';
	import { SquarePenIcon, HistoryIcon } from '@lucide/svelte';
	import { formatRelative } from 'date-fns';
	import { enGB } from 'date-fns/locale';
	import { page } from '$app/state';

	import '$lib/components/editor/Article.css';

	import Container from '$lib/components/Container.svelte';
	import LinkButton from '$lib/components/LinkButton.svelte';
	import SuggestionBox from '$lib/components/SuggestionBox.svelte';
	import Box from '$lib/components/Box.svelte';
	import ToC from '$lib/components/ToC.svelte';
	import RandomButton from '$lib/components/RandomButton.svelte';
	import CacheBustButton from '$lib/components/CacheBustButton.svelte';
	import Button from '$lib/components/Button.svelte';
	import Link from '$lib/components/Link.svelte';
	import { isSystem } from '$lib/utils/isSystem.js';
	import { getImageCacheURL } from '$lib/utils/getImageCacheURL.js';

	let streamerMode = $state(page.data.session?.user?.userSettings?.streamerMode);
	let showAuthors = $state(false);

	const submitErrors = $derived.by(() => {
		try {
			/**
			 * @type {Array<{ code: string; field: string; value?: string }> | null}
			 */
			const rawErrors = JSON.parse(page.url.searchParams.get('partialErrors') || '');
			if (!rawErrors || !(rawErrors instanceof Array)) {
				return [];
			}

			// We don't want to display messages verbatim from the URL to make sure users don't modify it.
			/**
			 * @type {{ [key: string]: string }}
			 */
			const ERROR_CONSTANT = {
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
			'@type': 'Article',
			author: {
				'@type': 'Organization',
				name: 'Community Forsen Wiki',
			},
			contributor: authors
				.filter((author) => author.name !== null)
				.map((author) => ({
					'@type': 'Person',
					// @ts-ignore
					name: author.name.replace(/[^\w]/g, ''),
				})),
		})
	);
	const authorsHTML = $derived(
		// eslint-disable-next-line no-useless-escape
		`<script type="application/ld+json">${authorsScriptContent}<\/script>`
	);

	// @ts-ignore
	BigInt.prototype.toJSON = function () {
		return { $bigint: this.toString() };
	};

	function toggleAuthor() {
		showAuthors = !showAuthors;
	}

	onMount(() => {
		/**
		 * @type {ResizeObserver[]}
		 */
		let observers = [];

		if (!streamerMode) {
			return;
		}

		const streamerModeItems = /** @type {HTMLElement[]}*/ ([
			...document.querySelectorAll('.article-root img'),
			...document.querySelectorAll('.article-root [data-lexical-youtube]'),
			...document.querySelectorAll('.article-root [data-lexical-twitch]'),
			...document.querySelectorAll('.article-root video'),
		]);

		for (let index = 0; index < streamerModeItems.length; index++) {
			const item = streamerModeItems[index];

			const parent = item.parentElement;

			if (!parent) {
				continue;
			}

			parent.classList.add('relative');

			const overlay = document.createElement('div');
			overlay.innerHTML = 'Show';

			overlay.classList.add(
				'absolute',
				'flex',
				'cursor-pointer',
				'items-center',
				'justify-center',
				'text-white',
				'bg-black/50',
				'whitespace-nowrap',
				'z-10'
			);

			overlay.style.width = `${item.offsetWidth + 2}px`;
			overlay.style.height = `${item.offsetHeight + 2}px`;

			const positionOverlay = () => {
				overlay.style.left = `${item.offsetLeft + item.offsetWidth / 2}px`;
				overlay.style.top = `${item.offsetTop + item.offsetHeight / 2}px`;
				overlay.style.width = `${item.offsetWidth + 2}px`;
				overlay.style.height = `${item.offsetHeight + 2}px`;
				overlay.style.transform = 'translate(-50%, -50%)';
			};

			item.insertAdjacentElement('afterend', overlay);
			positionOverlay();

			const ro = new ResizeObserver(positionOverlay);
			ro.observe(parent);
			observers.push(ro);

			const reveal = () => {
				item.classList.add('streamer-mode-disable');
				overlay.removeEventListener('click', reveal);
				overlay.remove();
			};

			overlay.addEventListener('click', reveal);
		}

		return () => {
			observers.forEach((ro) => ro.disconnect());
		};
	});
</script>

<svelte:head>
	<title>{rawTitle || title} - Community Forsen Wiki</title>

	<meta property="og:site_name" content="Forsen Wiki" />

	{#if !isArticleSystem}
		<link rel="canonical" href="{page.url.origin}/w/{title}" />
		<meta property="og:url" content="{page.url.origin}/w/{title}" />

		<meta property="og:type" content="article" />

		{#if text?.length}
			<meta name="description" content={text} />
			<meta property="og:description" content={text} />
		{/if}

		{#if image?.length}
			<meta
				property="og:image"
				content={getImageCacheURL(image, { quality: 'medium-low' }).toString()}
			/>
		{/if}

		<meta property="article:published_time" content={createdTimestamp.toISOString()} />
		<meta property="article:modified_time" content={lastUpdated.toISOString()} />

		{#each authors as author (author.name)}
			{#if author.name}
				<meta property="article:author" content={author.name} />
			{/if}
		{/each}

		{@html authorsHTML}
	{/if}
</svelte:head>

<Container class={streamerMode ? 'streamer-mode' : ''}>
	<article class="relative flex grow flex-col gap-4">
		<RandomButton />

		{#if submitErrors.length}
			<Box class="bg-yellow-300/75! p-4 text-black">
				<strong>Partial submit error(s)</strong>
				{#each submitErrors as error (error)}
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
								forsen.wiki is currently <span class="font-bold">work in progress</span>.
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
					<main class="article-root prose dark:prose-invert max-w-[unset] grow wrap-break-word">
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
						{#if !streamerMode || showAuthors}
							{#each authors as author, index (author.name)}
								{author.name}

								{index < authors.length - 1 ? ', ' : ''}
							{/each}
						{:else}
							<Button
								onclick={() => toggleAuthor()}
								class="inline-block h-[unset]! bg-transparent! p-0! underline"
							>
								(Streamer mode) Show authors
							</Button>
						{/if}
					</span>
				</p>
			{/if}
		</footer>

		{#if relatedPosts.length}
			<div class="article-footer-color p-4">
				<p>
					<span><strong>Article{relatedPosts.length > 1 ? 's' : ''} linking here:</strong></span>
					<span>
						{#each relatedPosts as post, index (post.title)}
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
			<summary class="cursor-pointer"><span class="font-bold">Tools</span></summary>

			<div class="flex gap-4">
				<CacheBustButton />
				<LinkButton
					class="mt-2 min-h-[unset] min-w-[unset] p-1! text-xs"
					href="/api/article/read/{title}">API request</LinkButton
				>
			</div>
		</details>
	</footer>
</Container>
