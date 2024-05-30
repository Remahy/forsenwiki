<script>
	import { page } from '$app/stores';
	import LinkBox from '$lib/components/LinkBox.svelte';
	import LinkButton from '$lib/components/LinkButton.svelte';

	/** @type {import('./+page.server').QueryResult[]} */
	let results = $page.data.results;
</script>

<svelte:head>
	<title>Search the Community Forsen Wiki</title>
	<meta
		name="description"
		content="Query for forsen, forsen forsen forsen forsen forsen forsen, and more."
	/>
</svelte:head>

<section class="container mx-auto flex grow flex-col p-4 lg:p-0 lg:py-12">
	<div
		class="m-0 my-4 mt-0 w-full rounded bg-gradient-to-br from-violet-200 to-violet-300 p-4 sm:my-8 sm:mt-0 dark:from-violet-800/30 dark:to-violet-950/30"
	>
		<p class="m-0 text-center leading-10">
			<strong>Tip:</strong>
			<span>Searching by an author's username shows any content they've modified or created.</span>
		</p>
	</div>

	<div class="flex flex-col gap-2">
		{#each results as result}
			<LinkBox href={!result.type ? `/w/${result.title}` : result.title} class="flex">
				<div class="flex grow flex-col gap-2">
					<strong class="break-words">{result.rawTitle}</strong>
					<p>Last updated: {new Date(result.lastUpdated).toLocaleString()}</p>
					{#if result.type === 'content'}
						<img src={result.title} alt={result.rawTitle} class="w-fit max-w-full" />
					{/if}
				</div>
			</LinkBox>
		{/each}
	</div>
</section>
