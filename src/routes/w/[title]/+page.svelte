<script>
	import { EditIcon, HistoryIcon } from 'lucide-svelte';
	import { formatRelative } from 'date-fns';
	import { enGB } from 'date-fns/locale';

	import '$lib/components/editor/plugins/Image/Image.css';

	import Container from '$lib/components/Container.svelte';
	import LinkButton from '$lib/components/LinkButton.svelte';

	export let data;
</script>

<svelte:head>
	<title>{data.post.rawTitle} - Community Forsen Wiki</title>
	<meta
		name="description"
		content="Read about &quot;{data.post
			.rawTitle}&quot; on forsen.wiki - All things forsen, and more."
	/>
</svelte:head>

<Container>
	<article class="relative flex grow flex-col gap-8">
		<header
			class="flex w-full items-center gap-2 rounded bg-gradient-to-br from-violet-200 to-violet-300 p-4 dark:from-violet-800/30 dark:to-violet-950/30"
		>
			<p class="grow">
				forsen.wiki is currently <strong>work in progress</strong>.
			</p>

			<LinkButton href="/w/{data.post.title}/history" class="flex items-center gap-2 text-sm">
				<HistoryIcon size="16" /><span class="hidden md:inline">History</span>
			</LinkButton>

			<LinkButton href="/w/{data.post.title}/edit" reload class="flex items-center gap-2 text-sm">
				<EditIcon size="16" /><span class="hidden md:inline">Edit article</span>
			</LinkButton>
		</header>

		<main class="editor-shell prose max-w-[unset] grow dark:prose-invert">
			<h1>{data.post.rawTitle}</h1>

			{@html data.html}
		</main>

		<footer class="rounded bg-violet-200 p-4 dark:bg-violet-950 dark:bg-opacity-30">
			<p>
				<span title={new Date(data.post.createdTimestamp).toString()}>
					<strong>Created:</strong>
					{new Date(data.post.createdTimestamp).toDateString()}
				</span>
				{#if data.post.lastUpdated.getTime() !== data.post.createdTimestamp.getTime()}
					<span title={new Date(data.post.lastUpdated).toString()}>
						<strong>Updated:</strong>
						{formatRelative(data.post.lastUpdated, Date.now(), { locale: enGB })}
					</span>
				{/if}
			</p>

			{#if data.authors.length}
				<p>
					<span><strong>Authors:</strong></span>
					<span>
						{#each data.authors as author, index}
							{author.name}{index < data.authors.length - 1 ? ', ' : ''}
						{/each}
					</span>
				</p>
			{/if}
		</footer>
	</article>
</Container>
