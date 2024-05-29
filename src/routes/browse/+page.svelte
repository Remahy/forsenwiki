<script>
	import InfiniteLoading from 'svelte-infinite-loading';
	import { formatRelative } from 'date-fns';
	import { enGB } from 'date-fns/locale';

	import { page } from '$app/stores';
	import { browseRequest } from '$lib/api/browse';
	import Box from '$lib/components/Box.svelte';
	import Container from '$lib/components/Container.svelte';

	let data = $page.data.results;

	// @ts-ignore - These detail props are callbacks.
	function infiniteHandler({ detail: { complete, error, loaded } }) {
		// Classic, good old, then & catch.
		browseRequest(data[data.length - 1]?.id || '')
			.then(async (res) => {
				const newData = await res.json();
				if (newData.length) {
					data = [...data, ...newData];
					loaded();
				} else {
					complete();
				}
			})
			.catch((e) => {
				console.error(e);
				error();
			});
	}
</script>

<Container>
	<div class="prose prose-lg mb-6 w-full max-w-[unset] dark:prose-invert">
		<h2>Browsing around...</h2>
		<p>All created articles sorted by creation date.</p>
	</div>

	{#each data as article}
		<a href="/w/{article.title}">
			<Box
				class="flex flex-col gap-2 border-2 border-violet-400 p-6 hover:bg-violet-300 dark:border-violet-950 dark:hover:bg-violet-950 dark:hover:bg-opacity-60"
			>
				<div class="text-2xl font-bold">{article.rawTitle || article.title}</div>
				<p>
					<span title={new Date(article.createdTimestamp).toString()}>
						<strong>Created:</strong>
						{new Date(article.createdTimestamp).toDateString()}
					</span>
					{#if new Date(article.lastUpdated).getTime() !== new Date(article.createdTimestamp).getTime()}
						<span title={new Date(article.lastUpdated).toString()}>
							<strong>Updated:</strong>
							{formatRelative(article.lastUpdated, Date.now(), { locale: enGB })}
						</span>
					{/if}
				</p>
			</Box>
		</a>
	{/each}

	<InfiniteLoading on:infinite={infiniteHandler}>
		<div slot="noResults"></div>
		<div slot="noMore" class="text-left">
			forsen.wiki v0.0.1 launched {formatRelative('2024-05-25T11:42:29.000Z', Date.now(), {
				locale: enGB,
			})}
			({new Date('2024-05-25T11:42:29.000Z').toDateString()})
		</div>
	</InfiniteLoading>
</Container>
