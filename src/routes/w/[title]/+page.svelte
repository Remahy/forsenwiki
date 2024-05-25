<script>
	import { EditIcon } from 'lucide-svelte';

	import '$lib/components/editor/plugins/Image.css'

	export let data;
</script>

<div class="container mx-auto flex grow flex-col gap-8 p-4 lg:p-0 lg:py-12">
	<article class="relative flex grow flex-col gap-8">
		<header
			class="flex w-full items-center rounded bg-gradient-to-br from-violet-200 to-violet-300 p-4"
		>
			<p class="grow">
				forsen.wiki is currently <strong>work in progress</strong>.
			</p>

			<a
				href="/w/{data.post.title}/edit"
				class="flex gap-2 rounded bg-violet-500 p-2 font-semibold text-white hover:bg-violet-800"
				data-sveltekit-reload><EditIcon /><span class="hidden md:inline">Edit article</span></a
			>
		</header>

		<main class="prose max-w-[unset] grow editor-shell">
			<h1>{data.post.rawTitle}</h1>

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
						{#each data.authors as author, index}
							{author.name}
							{index < data.authors.length - 1 ? ', ' : ''}
						{/each}
					</span>
				</p>
			{/if}
		</footer>
	</article>
</div>
