<script>
	/** @type {import('./$types').PageData} */
	export let data;
</script>

<div class="container mx-auto flex grow flex-col gap-2 p-4 lg:p-0 lg:py-12">
	<article class="prose relative max-w-[unset] grow p-2 flex flex-col">
		<main>
			{@html data.html}
		</main>

		<footer class="grow flex flex-col justify-end">
			<div class="text-purple-800">⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿</div>
			<p><strong>Created:</strong> {new Date(data.post.createdTimestamp).toLocaleString()}</p>
			{#if data.post.lastUpdated.getTime() !== data.post.createdTimestamp.getTime()}
				<p><strong>Updated:</strong> {new Date(data.post.lastUpdated).toLocaleString()}</p>
			{/if}
		</footer>
	</article>
</div>
