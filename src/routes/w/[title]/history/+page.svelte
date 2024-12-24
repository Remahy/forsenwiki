<script>
	import { EditIcon, FileIcon } from 'lucide-svelte';

	import Box from '$lib/components/Box.svelte';
	import Container from '$lib/components/Container.svelte';
	import Link from '$lib/components/Link.svelte';
	import LinkButton from '$lib/components/LinkButton.svelte';
	import SuggestionBox from '$lib/components/SuggestionBox.svelte';

	let { data } = $props();

	const { title, rawTitle, postUpdates, totalByteLength } = data;

	let to = $state(1);
	let from = $state(0);

	let link = $derived(`history/${postUpdates[to].id}..${postUpdates[from].id}`);
</script>

<svelte:head>
	<title>&quot;{rawTitle}&quot; history - Community Forsen Wiki</title>
	<meta
		name="description"
		content="History for &quot;{rawTitle}&quot; on forsen.wiki - All things forsen, and more."
	/>
</svelte:head>

<Container>
	<SuggestionBox>
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
	</SuggestionBox>

	<Box class="p-4">
		<div class="flex">
			<LinkButton href={link} class="flex items-center gap-2 text-sm">
				Compare selected versions</LinkButton
			>
		</div>

		<div class="prose mt-3 max-w-[unset] dark:prose-invert">
			<ul>
				{#each postUpdates as postUpdate, index}
					<li
						class:mt-3={index !== 0}
						class:outline-dashed={index === to || index === from}
						class:outline-1={index === to || index === from}
						class={index === to || index === from ? 'dark:outline-white/25' : ''}
					>
						<div class="flex items-center">
							{#if from < index}
								<input type="radio" value={index} bind:group={to} />
							{:else}
								<input type="radio" disabled class="invisible" />
							{/if}

							{#if to > index}
								<input type="radio" value={index} bind:group={from} />
							{:else}
								<input type="radio" disabled class="invisible" />
							{/if}

							<span>
								<Link href="/w/{title}/history/{postUpdate.id}" class="ml-2">
									{new Date(postUpdate.createdTimestamp).toLocaleString()}
								</Link>

								<span>by {postUpdate.metadata.user.name}</span>

								{#if postUpdate.metadata.byteLength}
									<span class="opacity-50">({postUpdate.metadata.byteLength})</span>
								{/if}

								{#if index === 0}
									(current)
								{/if}
							</span>
						</div>
					</li>
				{/each}
			</ul>
		</div>
	</Box>
</Container>
