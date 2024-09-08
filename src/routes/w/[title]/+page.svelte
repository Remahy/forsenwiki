<script>
	import { EditIcon, HistoryIcon } from 'lucide-svelte';
	import { formatRelative } from 'date-fns';
	import { enGB } from 'date-fns/locale';

	import '$lib/components/editor/plugins/Image/Image.css';

	import Container from '$lib/components/Container.svelte';
	import LinkButton from '$lib/components/LinkButton.svelte';

	export let data;

	const {
		post: { rawTitle, title, createdTimestamp, lastUpdated },
		authors,
		html,
	} = data;
</script>

<svelte:head>
	<title>{rawTitle} - Community Forsen Wiki</title>
	<meta
		name="description"
		content="Read about &quot;{rawTitle}&quot; on forsen.wiki - All things forsen, and more."
	/>
</svelte:head>

<Container>
	<article class="relative flex grow flex-col gap-8">
		<header
			class="rounded bg-gradient-to-br from-violet-200 to-violet-300 p-4 dark:from-violet-800/30 dark:to-violet-950/30"
		>
			<div class="flex w-full gap-2">
				<div class="flex grow items-center overflow-hidden">
					<p>
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

		<main class="editor-shell prose max-w-[unset] grow dark:prose-invert">
			<h1>{rawTitle}</h1>

			{@html html}
		</main>

		<footer class="rounded bg-violet-200 p-4 dark:bg-violet-950 dark:bg-opacity-30">
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
</Container>
