<script>
	import Box from '$lib/components/Box.svelte';
	import Container from '$lib/components/Container.svelte';
	import Link from '$lib/components/Link.svelte';
	import LinkButton from '$lib/components/LinkButton.svelte';
	import { EditIcon, FileIcon } from 'lucide-svelte';

	export let data;

	const { title, rawTitle, postUpdates, totalByteLength } = data;
</script>

<svelte:head>
	<title>&quot;{rawTitle}&quot; history - Community Forsen Wiki</title>
	<meta
		name="description"
		content="History for &quot;{rawTitle}&quot; on forsen.wiki - All things forsen, and more."
	/>
</svelte:head>

<Container>
	<div
		class="rounded bg-gradient-to-br from-violet-200 to-violet-300 p-4 dark:from-violet-800/30 dark:to-violet-950/30"
	>
		<div class="flex w-full gap-2">
			<div class="flex grow items-center overflow-hidden">
				<p>
					<strong>History for &quot;{rawTitle}&quot;</strong>
				</p>
			</div>

			<div class="flex shrink-0 items-start gap-2">
				<LinkButton href="/w/{title}" class="flex items-center gap-2 text-sm">
					<FileIcon size="16" /><span class="hidden md:inline">View article</span>
				</LinkButton>

				<LinkButton href="/w/{title}/edit" reload class="flex items-center gap-2 text-sm">
					<EditIcon size="16" /><span class="hidden md:inline">Edit article</span>
				</LinkButton>
			</div>
		</div>

		<p><strong>Current total length:</strong> {totalByteLength} bytes.</p>
	</div>

	<Box class="p-4">
		<div class="prose max-w-[unset] dark:prose-invert">
			<ul>
				{#each postUpdates as postUpdate, index}
					<li class:mt-3={index !== 0}>
						<Link href="/w/{title}/history/{postUpdate.id}"
							>{new Date(postUpdate.createdTimestamp).toLocaleString()}</Link
						> by {postUpdate.metadata.user.name}
						{#if postUpdate.metadata.byteLength}
							<span class="opacity-50">({postUpdate.metadata.byteLength})</span>
						{/if}
						{#if index === 0}
							(current)
						{/if}
					</li>
				{/each}
			</ul>
		</div>
	</Box>
</Container>
