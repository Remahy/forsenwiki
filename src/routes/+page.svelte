<script>
	import Box from '$lib/components/Box.svelte';
</script>

<svelte:head>
	<title>Unofficial Forsen Wiki</title>
	<meta name="description" content="forsen" />
</svelte:head>

<section class="container mx-auto flex grow flex-col p-4 lg:p-0 lg:py-12">
	<div
		class="m-0 my-4 mt-0 w-full rounded bg-gradient-to-br from-violet-200 to-violet-300 p-4 sm:my-8 sm:mt-0"
	>
		<p class="m-0 text-center leading-10">
			forsen.wiki is currently a <strong>work in progress</strong>.
			<br />
			Feel free to take a look around or{' '}
			<a
				href="/create/"
				class="whitespace-nowrap rounded bg-violet-700 p-2 font-semibold text-white hover:bg-violet-800"
				data-sveltekit-reload>Create new article</a
			>
		</p>
	</div>

	<div class="block grow gap-4 lg:flex">
		<div class="mb-4 flex grow flex-col lg:mb-0">
			<Box class="mb-4 grow p-4">
				<div class="mb-2 border-b-2 border-violet-700 pb-2">
					<h2 class="text-2xl">Recent edits</h2>
				</div>
				<ul class="mx-4 list-disc">
					<li class="p-2 pl-0"><strong>Article</strong> - Edit date - By Author</li>
				</ul>
			</Box>

			<Box class="grow p-4">
				<div class="mb-2 border-b-2 border-violet-700 pb-2">
					<h2 class="text-2xl">New articles</h2>
				</div>
				<ul class="mx-4 list-disc">
					<li class="p-2 pl-0"><strong>Article</strong> - Creation date - By Author</li>
				</ul>
			</Box>
		</div>

		<div class="lg:min-w-96">
			<Box class="grow p-4">
				<div class="mb-2 border-b-2 border-violet-700 pb-2">
					<h2 class="text-2xl">New users</h2>
				</div>
				<ul class="mx-4 list-disc">
					<li class="p-2 pl-0"><strong>User</strong> - Creation date</li>
				</ul>
			</Box>
		</div>
	</div>
</section>
