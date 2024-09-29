<script>
	import { FileIcon, GitCompareIcon, HistoryIcon } from 'lucide-svelte';
	import Container from '$lib/components/Container.svelte';
	import LinkButton from '$lib/components/LinkButton.svelte';

	import '$lib/components/editor/plugins/Image/Image.css';

	export let data;

	const {
		title,
		rawTitle,
		createdTimestamp,
		author,
		current,
		byteLength,
		toPostUpdateId,
		recentPostUpdateId,
		html,
	} = data;

	const date = new Date(createdTimestamp).toLocaleString();

	const displayTitle = `"${date}" version for "${rawTitle}" article`;

	const authorName = author?.name || '?';
</script>

<svelte:head>
	<title>{displayTitle} - Community Forsen Wiki</title>
	<meta name="description" content="{displayTitle} on forsen.wiki - All things forsen, and more." />
</svelte:head>

<Container>
	<article class="relative flex grow flex-col gap-8">
		<header
			class="rounded bg-gradient-to-br from-yellow-200 to-yellow-300 p-4 dark:from-yellow-800/30 dark:to-yellow-950/30"
		>
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

		<main class="editor-shell prose max-w-[unset] grow dark:prose-invert">
			<h1>{rawTitle}</h1>

			{@html html}
		</main>
	</article>
</Container>
