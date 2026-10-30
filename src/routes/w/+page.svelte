<script>
	import Box from '$lib/components/Box.svelte';
	import Container from '$lib/components/Container.svelte';
	import Link from '$lib/components/Link.svelte';

	let { data } = $props();

	const LETTERS = ['#', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'];

	const groups = $derived(data.groups);
	const total = $derived(data.total);

	const visibleLetters = $derived(groups.map(({ letter }) => letter));

	/** @param {string} letter */
	const letterId = (letter) => (letter === '#' ? 'other' : letter.toLowerCase());
</script>

<svelte:head>
	<title>All articles - Community Forsen Wiki</title>
	<meta name="description" content="Every article on the Forsen Wiki." />
</svelte:head>

<Container>
	<Box class="flex flex-col gap-4 p-4">
		<div class="box-heading-wrapper flex flex-wrap items-baseline justify-between gap-2">
			<h1 class="text-3xl">All articles</h1>
			<span>{total} articles</span>
		</div>

		<nav aria-label="Jump to letter" class="flex flex-wrap gap-1">
			{#each LETTERS as letter (letter)}
				{#if visibleLetters.includes(letter)}
					<a
						href="#letter-{letterId(letter)}"
						class="link forsen-wiki-theme-border min-w-8 rounded-sm border px-2 py-1 text-center font-bold"
						>{letter}</a
					>
				{:else}
					<span
						aria-hidden="true"
						class="min-w-8 rounded-sm border border-transparent px-2 py-1 text-center opacity-40"
						>{letter}</span
					>
				{/if}
			{/each}
		</nav>
	</Box>

	{#each groups as group (group.letter)}
		<Box class="p-4">
			<section id="letter-{letterId(group.letter)}" class="scroll-mt-4">
				<div class="box-heading-wrapper mb-2 flex items-baseline justify-between">
					<h2 class="text-2xl">{group.letter}</h2>
					<small>{group.articles.length}</small>
				</div>

				<ul class="columns-1 gap-8 p-0 sm:columns-2 lg:columns-3">
					{#each group.articles as article (article.title)}
						<li class="break-inside-avoid py-1">
							<Link href="/w/{article.title}">{article.rawTitle}</Link>
						</li>
					{/each}
				</ul>
			</section>
		</Box>
	{:else}
		<Box class="p-4">
			<span>No articles yet.</span>
		</Box>
	{/each}
</Container>
