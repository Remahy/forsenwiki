<script>
	import { FileIcon, HistoryIcon } from 'lucide-svelte';
	import { page } from '$app/stores';

	import LinkButton from '$lib/components/LinkButton.svelte';
	import Container from '$lib/components/Container.svelte';

	import '$lib/components/editor/plugins/Image/Image.css';

	let { data } = $props();

	const {
		title,
		rawTitle,
		toDate,
		toAuthor,
		fromDate,
		fromAuthor,
		diffHTML: { html: diffHTML },
		diffJSON,
		editorJSON,
	} = data;

	const tD = toDate.toLocaleString();
	const fD = fromDate.toLocaleString();

	const displayTitle = `Comparing "${tD}" vs "${fD}"`;
</script>

<svelte:head>
	<title>{displayTitle} - Community Forsen Wiki</title>
	<meta name="description" content="{displayTitle} on forsen.wiki" />
	<meta property="og:description" content="{displayTitle} on forsen.wiki" />

	<link rel="canonical" href="{$page.url.origin}/w/{title}" />
	<meta property="og:url" content="{$page.url.origin}/w/{title}" />
</svelte:head>

<Container>
	<article class="relative flex grow flex-col gap-8">
		<header class="bg-heading-message p-4">
			<div class="flex w-full gap-2">
				<div class="flex grow items-center overflow-hidden">
					<p>
						<strong>{displayTitle}</strong>
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

			<div class="mt-4">
				<p>
					<span><strong>&quot;{tD}&quot; version author:</strong></span>
					<span>
						{toAuthor?.name || '?'}
					</span>
				</p>

				<p>
					<span><strong>&quot;{fD}&quot; version author:</strong></span>
					<span>
						{fromAuthor?.name || '?'}
					</span>
				</p>
			</div>
		</header>

		<div class="flex flex-col gap-2 text-xs">
			<p>
				<strong>Legend:</strong>
			</p>
			<p class="p-1 text-red-500 outline">
				<span><strong>Red:</strong> Deleted &#40;-&#41;</span>
			</p>
			<p class="p-1 text-orange-500 outline outline-dashed dark:text-orange-300">
				<span><strong>Orange:</strong> Modified &#40;~&#41;</span>
			</p>
			<p class="p-1 text-green-500 outline">
				<span><strong>Green:</strong> Added &#40;+&#41;</span>
			</p>
			<p>
				When available, hover over the question mark <span
					class="mx-1 rounded-full bg-blue-500/50 px-2 py-1 font-bold outline outline-white">?</span
				> to read what fields were modified.
			</p>
		</div>

		<main class="article-root prose dark:prose-invert max-w-[unset] grow">
			<h1>{rawTitle}</h1>

			{@html diffHTML}

			<hr />

			<details>
				<summary>Show raw data</summary>

				<strong>Diff JSON:</strong>
				<pre class="mt-0">{JSON.stringify(diffJSON, null, 2)}</pre>

				<strong>Editor JSON:</strong>
				<pre class="mt-0">{JSON.stringify(editorJSON, null, 2)}</pre>
			</details>
		</main>
	</article>
</Container>
