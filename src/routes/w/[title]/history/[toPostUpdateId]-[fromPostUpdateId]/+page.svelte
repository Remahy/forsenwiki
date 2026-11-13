<script>
	import { FileIcon, HistoryIcon } from '@lucide/svelte';
	import { page } from '$app/stores';

	import '$lib/components/editor/Article.css';
	import '$lib/components/editor/Diff.css';

	import Container from '$lib/components/Container.svelte';
	import LinkButton from '$lib/components/LinkButton.svelte';
	import Box from '$lib/components/Box.svelte';
	import Article from '$lib/components/Article.svelte';
	import ToC from '$lib/components/ToC/index.svelte';
	import StreamerModeShow from '$lib/components/StreamerModeShow.svelte';
	import Link from '$lib/components/Link.svelte';

	let { data } = $props();

	const {
		post: { title, rawTitle },
		toDate,
		toAuthor,
		fromDate,
		fromAuthor,
		authors,
		changes,
		partial,
		omitted,
		large,
		view,
		attributed,
		html,
	} = $derived(data);

	const streamerMode = $derived($page.data.session?.user?.userSettings?.streamerMode);

	const [older, newer] = $derived(
		[
			{ date: fromDate, author: fromAuthor },
			{ date: toDate, author: toAuthor },
		].sort((a, b) => a.date.getTime() - b.date.getTime())
	);

	const CHANGE_LABELS = { insert: 'Added', delete: 'Deleted', change: 'Modified' };

	/** @type {HTMLElement | undefined} */
	let changesElement = $state();

	$effect(() => {
		if (!changesElement || !changes.length) {
			return;
		}

		/** @type {NodeListOf<HTMLElement>} */
		const marked = changesElement.querySelectorAll('[data-diff]');

		for (const element of marked) {
			const { diff, diffBy, diffAt, diffDescribed } = element.dataset;

			if (diffDescribed) {
				continue;
			}

			const author = streamerMode || !diffBy ? null : authors[diffBy];
			const description = [
				CHANGE_LABELS[/** @type {keyof typeof CHANGE_LABELS} */ (diff)],
				author ? `by ${author}` : null,
				diffAt ? `on ${new Date(Number(diffAt)).toLocaleString()}` : null,
			]
				.filter(Boolean)
				.join(' ');

			element.title = element.title ? `${description}\r\n${element.title}` : description;
			element.dataset.diffDescribed = 'true';
		}
	});

	const tD = $derived(toDate.toLocaleString());
	const fD = $derived(fromDate.toLocaleString());

	const displayTitle = $derived(`Comparing "${rawTitle}" version "${tD}" vs "${fD}"`);
</script>

<svelte:head>
	<title>{displayTitle} - Community Forsen Wiki</title>
	<meta name="og:title" content="{displayTitle} - Community Forsen Wiki" />

	<meta name="description" content="{displayTitle} on forsen.wiki" />
	<meta property="og:description" content="{displayTitle} on forsen.wiki" />

	<link rel="canonical" href="{$page.url.origin}/w/{title}" />
	<meta property="og:url" content="{$page.url.origin}/w/{title}" />
</svelte:head>

{#snippet versionHeading(
	/** @type {typeof older | newer} */ version,
	/** @type {string} */ title = ''
)}
	<div class="box-heading-wrapper">
		<p class="text-xl font-bold">
			{title}{version.date.toLocaleString()}
		</p>

		<span class="text-sm normal-case">
			Version author:
			<StreamerModeShow>
				<Link href="/user/{version.author?.id}" target="_blank" class="decoration-1!"
					>{version.author?.name}</Link
				>
			</StreamerModeShow>
		</span>
	</div>
{/snippet}

<Container>
	<article class="relative flex grow flex-col gap-8">
		<header class="bg-heading-message p-4">
			<div class="flex w-full gap-2">
				<div class="flex grow items-center overflow-hidden">
					<p>
						<strong>{displayTitle}.</strong>
					</p>
				</div>

				<div class="flex shrink-0 items-start gap-2">
					<LinkButton
						href="/w/{title}"
						class="flex items-center gap-2 text-sm"
						title="View live article"
					>
						<FileIcon size="16" />
						<span class="hidden lg:inline">View live article</span>
					</LinkButton>

					<LinkButton
						href="/w/{title}/history"
						class="flex items-center gap-2 text-sm"
						title="Return to history list"
					>
						<HistoryIcon size="16" />
						<span class="hidden lg:inline">Return to history list</span>
					</LinkButton>
				</div>
			</div>
		</header>

		<section class="flex flex-col gap-4">
			<div class="flex flex-col gap-2 text-xs">
				<p>
					<span class="font-bold">Legend:</span>
				</p>
				<p class="p-1 text-red-500 outline">
					<span><span class="font-bold">Red:</span> Deleted &#40;-&#41;</span>
				</p>
				<p class="p-1 text-orange-500 outline outline-dashed dark:text-orange-300">
					<span><span class="font-bold">Orange:</span> Modified &#40;~&#41;</span>
				</p>
				<p class="p-1 text-green-500 outline">
					<span><span class="font-bold">Green:</span> Added &#40;+&#41;</span>
				</p>
				<p>
					When available, hover over the question mark <span
						class="mx-1 rounded-full bg-blue-500/50 px-2 py-1 font-bold outline outline-white"
						>?</span
					> to read what fields were modified, and over a change to read who made it.
				</p>
			</div>

			{#if partial || omitted || !attributed}
				<Box class="flex flex-col gap-4 bg-yellow-300/75! p-4 text-black">
					{#if partial}
						<p class="text-sm" role="note">
							These versions differ too much to compare in detail in time.
						</p>
					{/if}

					{#if omitted}
						<p class="text-sm" role="note">
							{omitted.toLocaleString()} changed blocks are left out after the last one below.
						</p>
					{/if}

					{#if !attributed && large}
						<p class="text-sm" role="note">
							This article is too large to work out who made each change across several versions.
						</p>
					{:else if !attributed}
						<p class="text-sm" role="note">
							Who made each change could not be worked out in time. Reload the page to try again.
						</p>
					{/if}
				</Box>
			{/if}

			<div class="grid grid-cols-2 gap-x-4">
				{@render versionHeading(older)}
				{@render versionHeading(newer)}
			</div>

			<Box class="-mx-4 overflow-x-auto p-4 sm:mx-0">
				<div
					class="article-root prose dark:prose-invert grid max-w-[unset] gap-x-4 {view === 'split'
						? 'min-w-2xl grid-cols-2'
						: 'grid-cols-1'}"
					bind:this={changesElement}
				>
					{#each changes as change, index (index)}
						{#if change.start && view === 'split'}
							<p class="diff-start">Block {change.start.older}:</p>
							<p class="diff-start">Block {change.start.newer}:</p>
						{:else if change.start}
							<p class="diff-start">
								Block {change.start.newer}{change.start.older === change.start.newer
									? ''
									: ` (was ${change.start.older})`}:
							</p>
						{/if}

						{#each change.columns as column, side (side)}
							<!-- eslint-disable svelte/no-at-html-tags -->
							<div class="min-w-0 {view === 'split' ? ['diff-old', 'diff-new'][side] : ''}">
								{@html column}
							</div>
						{/each}
					{:else}
						<i class="col-span-2">No visible changes.</i>
					{/each}
				</div>
			</Box>
		</section>

		<section class="flex flex-col gap-4">
			{@render versionHeading(newer, 'Version as of ')}

			<div class="flex grow flex-col gap-4 lg:flex-row">
				<Box class="-mx-4 flex grow flex-col overflow-hidden p-4 sm:mx-0 lg:mb-0">
					{#if html?.html}
						<main class="article-root prose dark:prose-invert max-w-[unset] grow">
							<div class="forsen-wiki-theme-border mb-2 border-b-2 pb-2">
								<strong class="text-4xl">{rawTitle}</strong>
							</div>

							<Article html={html.html} />
						</main>
					{:else}
						<i>Error: No HTML returned.</i>
					{/if}
				</Box>

				<ToC />
			</div>
		</section>
	</article>
</Container>
