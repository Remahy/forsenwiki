<script>
	import Box from '$lib/components/Box.svelte';
	import Container from '$lib/components/Container.svelte';
	import ToC from '$lib/components/ToC.svelte';
	import changelogsHTML from './changelogs.html?raw';
</script>

<svelte:head>
	<title>Community Forsen Wiki</title>
	<meta name="description" content="Forsen Wiki code changelogs" />
</svelte:head>

<Container>
	<article class="relative flex grow flex-col gap-4">
		<div class="flex grow flex-col gap-4 lg:flex-row">
			<Box class="flex grow flex-col p-4 lg:mb-0">
				<main class="article-root prose dark:prose-invert max-w-[unset] grow">
					<h1>Changelogs</h1>

					<p>Compared to forsen, this project actually attempts to improve itself.</p>

					{@html changelogsHTML}
				</main>
			</Box>

			<ToC />
		</div>
	</article></Container
>
