<script>
	import Button from '$lib/components/Button.svelte';
	import { EditIcon } from 'lucide-svelte';

	/** @type {import('./$types').PageData} */
	export let data;
</script>

<div class="container mx-auto flex grow flex-col gap-8 p-4 lg:p-0 lg:py-12">
	<article class="relative flex grow flex-col gap-8">
		<header
			class="flex w-full items-center rounded bg-gradient-to-br from-violet-200 to-violet-300 p-4"
		>
			<p class="grow">
				forsen.wiki is currently a <strong>work in progress</strong>.
			</p>
		</header>

		<main class="prose max-w-[unset] grow">
			{@html data.html}
		</main>

		<footer class="rounded bg-violet-200 p-4">
			<p>
				<span>
					<strong>Created:</strong>
					{new Date(data.post.createdTimestamp).toLocaleString()}
				</span>
				{#if data.post.lastUpdated.getTime() !== data.post.createdTimestamp.getTime()}
					<span>
						<strong>Updated:</strong>
						{new Date(data.post.lastUpdated).toLocaleString()}
					</span>
				{/if}
			</p>

			{#if data.authors.length}
				<p>
					<span><strong>Authors:</strong></span>
					<span>
						{#each data.authors as author, index}{author.name}{index < data.authors.length - 1 ? ', ' : ''}{/each}
					</span>
				</p>
			{/if}
		</footer>
	</article>
</div>
