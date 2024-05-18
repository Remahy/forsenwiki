<script>
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';
	import { source } from 'sveltekit-sse';
	import Box from '$lib/components/Box.svelte';
	import Link from '$lib/components/Link.svelte';

	/** @type {Writable<Array<{ title: string, rawTitle: string, createdTimestamp: string, author: string }>>} */
	const latestArticles = writable([]);
	/** @type {Writable<Array<{ title: string, rawTitle: string, lastUpdated: string, author: string }>>} */
	const latestUpdates = writable([]);
	/** @type {Writable<Array<{ name: string }>>} */
	const latestUsers = writable([]);

	const value = source('/adonis/frontpage').select('article:create');
	const value2 = source('/adonis/frontpage').select('article:update');
	const value3 = source('/adonis/frontpage').select('user:create');

	onMount(() => {
		value.subscribe((v) => {
			if (v) {
				const values = $latestArticles;
				const newLength = values.unshift(JSON.parse(v));

				if (newLength > 10) values.pop();

				latestArticles.set(values);
			}
		});
		value2.subscribe((v) => {
			if (v) {
				const values = $latestUpdates;
				const newLength = values.unshift(JSON.parse(v));

				if (newLength > 10) values.pop();

				latestUpdates.set(values);
			}
		});
		value3.subscribe((v) => {
			if (v) {
				const values = $latestUsers;
				const newLength = values.unshift(JSON.parse(v));

				if (newLength > 10) values.pop();

				latestUsers.set(values);
			}
		});
	});
</script>

<svelte:head>
	<title>Community Forsen Wiki</title>
	<meta name="description" content="forsen" />
</svelte:head>

<section class="container mx-auto flex grow flex-col p-4 lg:p-0 lg:py-12">
	<div
		class="m-0 my-4 mt-0 w-full rounded bg-gradient-to-br from-violet-200 to-violet-300 p-4 sm:my-8 sm:mt-0"
	>
		<p class="m-0 text-center leading-10">
			forsen.wiki is currently <strong>work in progress</strong>.
			<br />
			Feel free to take a look around or{' '}
			<a
				href="/create/"
				class="whitespace-nowrap rounded bg-violet-500 p-2 font-semibold text-white hover:bg-violet-800"
				data-sveltekit-reload>Create new article</a
			>
		</p>
	</div>

	<div class="block grow gap-4 lg:flex">
		<div class="mb-4 flex grow flex-col lg:mb-0">
			<Box class="mb-4 grow p-4">
				<div class="mb-2 border-b-2 border-violet-700 pb-2">
					<h2 class="text-2xl">Recent updates</h2>
				</div>
				<ul class="mx-4 list-disc">
					{#each $latestUpdates as update}
						<li class="p-2 pl-0">
							<Link href="/w/{update.title}">
								<span>
									<strong>{update.rawTitle}</strong> - {new Date(
										update.lastUpdated
									).toLocaleTimeString()} - By {update.author}
								</span>
							</Link>
						</li>
					{/each}
				</ul>
			</Box>

			<Box class="grow p-4">
				<div class="mb-2 border-b-2 border-violet-700 pb-2">
					<h2 class="text-2xl">New articles</h2>
				</div>
				<ul class="mx-4 list-disc">
					{#each $latestArticles as article}
						<li class="p-2 pl-0">
							<Link href="/w/{article.title}">
								<span>
									<strong>{article.rawTitle}</strong> - {new Date(
										article.createdTimestamp
									).toLocaleTimeString()} - By {article.author}
								</span>
							</Link>
						</li>
					{/each}
				</ul>
			</Box>
		</div>

		<div class="lg:min-w-96">
			<Box class="grow p-4">
				<div class="mb-2 border-b-2 border-violet-700 pb-2">
					<h2 class="text-2xl">New users</h2>
				</div>
				<ul class="mx-4 list-disc">
					{#each $latestUsers as user}
						<li class="p-2 pl-0">
							<span>
								<strong>{user.name}</strong>
							</span>
						</li>
					{/each}
				</ul>
			</Box>
		</div>
	</div>
</section>
