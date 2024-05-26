<script>
	import Box from '$lib/components/Box.svelte';
	import Link from '$lib/components/Link.svelte';
</script>

<svelte:head>
	<title>Authentication Error - Community Forsen Wiki</title>
	<meta name="description" content="Errors for ants." />
</svelte:head>

<div class="container mx-auto flex grow p-4 lg:p-0 lg:py-12">
	<Box class="grow !bg-red-200 p-12 dark:!bg-red-950 dark:!bg-opacity-50">
		<section class="prose prose-lg w-full max-w-[unset] dark:prose-invert">
			<h1>OOPSIE WOOPSIE!!</h1>

			<p>Something went wrong.</p>

			<p>
				If you got here after trying to login, it is possible you did not read the <Link
					href="/terms">Terms & Conditions</Link
				>.
			</p>
		</section>
	</Box>
</div>
