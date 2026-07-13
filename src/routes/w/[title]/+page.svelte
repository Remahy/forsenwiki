<script lang="ts">
	import { SquarePenIcon, HistoryIcon } from '@lucide/svelte';
	import { formatRelative } from 'date-fns';
	import { enGB } from 'date-fns/locale';
	//import { page } from '$app/stores';
	import { page } from '$app/state';

	import '$lib/components/editor/Article.css';

	import Container from '$lib/components/Container.svelte';
	import LinkButton from '$lib/components/LinkButton.svelte';
	import SuggestionBox from '$lib/components/SuggestionBox.svelte';
	import Box from '$lib/components/Box.svelte';
	import ToC from '$lib/components/ToC.svelte';
	import RandomButton from '$lib/components/RandomButton.svelte';
	import CacheBustButton from '$lib/components/CacheBustButton.svelte';
	import Link from '$lib/components/Link.svelte';
	import { isSystem } from '$lib/utils/isSystem.js';
	import { getImageCacheURL } from '$lib/utils/getImageCacheURL.js';
	import { onMount, tick } from 'svelte';

	const submitErrors = $derived.by(() => {
		try {
			const rawErrors: Array<{ code: string; field: string; value?: string }> | null = JSON.parse(
				page.url.searchParams.get('partialErrors') || ''
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
			'@type': 'Article',
			author: {
				'@type': 'Organization',
				name: 'Community Forsen Wiki',
			},
			contributor: authors
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

	let streamerMode = $state(page.data.userSettings?.streamerMode ?? false);
	let processed = $state(false);

	const observers: ResizeObserver[] = [];

	onMount(async () => {
		if (!streamerMode) {
			processed = true;
			return;
		}

		processed = true;
		await tick();

		const images = document.querySelectorAll<HTMLImageElement>('.article-root > img');
		const observers: ResizeObserver[] = [];

		images.forEach((img) => {
			img.classList.add('cursor-pointer');

			const parent = img.parentElement!;
			parent.style.position = 'relative';

			const overlay = document.createElement('div');
			overlay.textContent = 'Press to show';

			overlay.classList.add('backdrop-blur-3xl');

			Object.assign(overlay.style, {
				position: 'absolute',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				color: 'white',
				backgroundColor: 'rgba(1, 1, 1, 0.5)',
				zIndex: '10',
				pointerEvents: 'none',
				whiteSpace: 'nowrap',
				width: `${img.offsetWidth}px`,
				height: `${img.offsetHeight}px`,
			});

			const positionOverlay = () => {
				overlay.style.left = `${img.offsetLeft + img.offsetWidth / 2 - 1}px`;
				overlay.style.top = `${img.offsetTop + img.offsetHeight / 2 - 1}px`;
				overlay.style.width = `${img.offsetWidth + 1}px`;
				overlay.style.height = `${img.offsetHeight + 1}px`;
				overlay.style.transform = 'translate(-50%, -50%)';
			};

			positionOverlay();
			parent.appendChild(overlay);

			const ro = new ResizeObserver(() => {
				positionOverlay();
			});
			ro.observe(img);
			observers.push(ro);

			let hidden = true;

			const reveal = () => {
				if (hidden) {
					overlay.remove();
					hidden = false;
				} else {
					positionOverlay();
					parent.appendChild(overlay);
					hidden = true;
				}
			};

			img.addEventListener('click', reveal);
		});

		return () => {
			observers.forEach((ro) => ro.disconnect());
		};
	});

	let revealedAuthors = $state(new Set<number>());

	function toggleAuthor(index: number) {
		if (revealedAuthors.has(index)) {
			revealedAuthors.delete(index);
		} else {
			revealedAuthors.add(index);
		}

		revealedAuthors = new Set(revealedAuthors);
	}

	function censorName(name: string) {
		return name.replace(/./g, '#');
	}
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
			<Box class="bg-yellow-300/75! p-4 text-black">
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
						{#if processed}
							<img
								src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSmcGqVnD1Zioghm9EushC9aRPz3J_ZyEt29KlhLPzQ5g&s"
							/>
							Lorem ipsum dolor, sit amet consectetur adipisicing elit. Vitae quae quia voluptatibus hic,
							nam dicta quisquam obcaecati, quasi, labore inventore quas est minus itaque sunt debitis.
							Sint animi obcaecati repudiandae. Lorem, ipsum dolor sit amet consectetur adipisicing elit.
							Minus eveniet numquam et voluptatem. Incidunt, velit. Earum hic ab, facilis, magni quis,
							aliquam beatae a at porro ullam perferendis eaque nam? Facilis sapiente consequuntur a modi
							aliquam! Vero dolorem dolore quaerat explicabo eos tempore aliquid officia. Alias vel ab
							deserunt. Officiis perferendis est esse ut aliquam soluta, alias quaerat ab ex. Quidem quia,
							adipisci incidunt a error, doloribus velit cumque inventore ullam, aliquid veniam sequi.
							Eligendi deleniti ea atque debitis, porro enim asperiores doloremque nemo nulla ipsum quis
							quae. Laborum, repellat. Nihil est sequi tempore vitae minus quae eligendi alias vel nostrum,
							magni quidem facilis quos odio aspernatur corrupti qui illo laborum soluta dolore, quas
							sunt rerum autem facere. Est, fuga? Et eum culpa dolorem quod, vitae aperiam molestiae quia,
							natus repellendus similique iure, temporibus saepe facere placeat nesciunt non eligendi
							labore id exercitationem veritatis? Laborum distinctio unde impedit sapiente quam. Modi
							provident velit unde, qui consequatur odio eligendi totam officiis odit laboriosam, distinctio
							placeat assumenda ad magnam quibusdam, similique voluptatibus. Quae, rerum. Quisquam, voluptate
							minima illo rem eaque deserunt optio! Libero laborum dicta a autem architecto labore eius
							in quo quaerat id ipsa nesciunt, at quia quasi dignissimos nisi illum sint explicabo quas
							esse amet excepturi. Magni eveniet laborum excepturi. Officiis obcaecati ex ipsam, fugiat
							laborum illum repudiandae a, facilis ipsa, eveniet vel eos inventore. Doloremque ex placeat
							unde, a vel quod veniam, corporis velit sed minima nam, labore libero? A consequatur cum
							veniam, in ex illum nulla perferendis non fugit, cumque totam nobis quisquam earum quam
							fuga harum? Architecto vero molestiae autem cupiditate veniam. Temporibus libero consequuntur
							quaerat incidunt! Temporibus, dignissimos magnam mollitia incidunt voluptates odit itaque
							fugiat nihil quibusdam, quos cupiditate similique explicabo quae ad iste expedita unde eaque.
							Accusantium laboriosam nostrum dignissimos sed deleniti sunt quibusdam voluptatibus?
							<img
								src="https://www.aaha.org/wp-content/uploads/2024/09/kitten-lying-in-blanket.jpg"
							/>

							{@html html}
						{/if}
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
							{#if !streamerMode || revealedAuthors.has(index)}
								{author.name}
							{:else}
								<button type="button" onclick={() => toggleAuthor(index)}>
									{censorName(author.name || '')}
								</button>
							{/if}

							{index < authors.length - 1 ? ', ' : ''}
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
