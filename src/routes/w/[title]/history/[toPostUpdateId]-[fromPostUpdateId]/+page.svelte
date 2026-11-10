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

{#snippet versionHeading(/** @type {typeof older | newer} */ version)}
	<div class="box-heading-wrapper">
		<p class="text-xl font-bold">
			Version as of {version.date.toLocaleString()}
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
					<span><span class="font-bold">Red, left:</span> Deleted &#40;-&#41;</span>
				</p>
				<p class="p-1 text-orange-500 outline outline-dashed dark:text-orange-300">
					<span><span class="font-bold">Orange, right:</span> Modified &#40;~&#41;</span>
				</p>
				<p class="p-1 text-green-500 outline">
					<span><span class="font-bold">Green, right:</span> Added &#40;+&#41;</span>
				</p>
				<p>
					When available, hover over the question mark <span
						class="mx-1 rounded-full bg-blue-500/50 px-2 py-1 font-bold outline outline-white"
						>?</span
					> to read what fields were modified, and over a change to read who made it.
				</p>
			</div>

			<div class="grid grid-cols-2 gap-x-4">
				{@render versionHeading(older)}
				{@render versionHeading(newer)}
			</div>

			<Box class="-mx-4 overflow-x-auto p-4 sm:mx-0">
				<div
					class="article-root prose dark:prose-invert grid max-w-[unset] min-w-2xl grid-cols-2 gap-x-4"
					bind:this={changesElement}
				>
					{#each changes as change, index (index)}
						<!-- eslint-disable svelte/no-at-html-tags -->
						<div class="diff-old min-w-0">{@html change.older}</div>
						<div class="diff-new min-w-0">{@html change.newer}</div>
					{:else}
						<i class="col-span-2">No visible changes.</i>
					{/each}
				</div>
			</Box>
		</section>

		<section class="flex flex-col gap-4">
			{@render versionHeading(newer)}

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
