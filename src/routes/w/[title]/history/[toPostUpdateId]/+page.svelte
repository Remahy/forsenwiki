<script>
	import { FileIcon, GitCompareIcon, HistoryIcon } from 'lucide-svelte';
	import { page } from '$app/stores';

	import Container from '$lib/components/Container.svelte';
	import LinkButton from '$lib/components/LinkButton.svelte';
	import Box from '$lib/components/Box.svelte';

	import '$lib/components/editor/plugins/Image/Image.css';

	let { data } = $props();

	const {
		title,
		rawTitle,
		createdTimestamp,
		author,
		current,
		byteLength,
		toPostUpdateId,
		recentPostUpdateId,
		html: { html },
	} = $derived(data);

	const date = $derived(new Date(createdTimestamp));

	const displayTitle =  $derived(`"${date.toLocaleString()}" version for "${rawTitle}" article`);

	const authorName =  $derived(author?.name || '?');
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
						<strong title={date.toUTCString()}>{displayTitle}</strong>
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

					{#if !current}
						<LinkButton
							href="/w/{title}/history/{toPostUpdateId}..{recentPostUpdateId}"
							class="flex items-center gap-2 text-sm"
							title="Compare to live article"
						>
							<GitCompareIcon size="16" />
							<span class="hidden lg:inline">Compare to live article</span>
						</LinkButton>
					{/if}

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
				{#if current}
					<p>This is the current live version of this article.</p>
				{:else}
					<p>This is a historical version of this article.</p>
				{/if}
				<p>
					<span><strong>Version author:</strong></span>
					<span>
						{authorName}
					</span>
				</p>
				<p><strong>Update length:</strong> {byteLength} bytes.</p>
			</div>
		</header>

		<div class="flex grow flex-col gap-4 lg:flex-row">
			<Box class="flex grow flex-col overflow-hidden p-4 lg:mb-0">
				<main class="article-root prose dark:prose-invert max-w-[unset] grow">
					<h1>{rawTitle}</h1>

					{@html html}
				</main>
			</Box>

			<div class="hidden lg:block lg:w-96 lg:min-w-96"></div>
		</div>
	</article>
</Container>
