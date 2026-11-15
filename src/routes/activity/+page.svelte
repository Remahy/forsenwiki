<script>
	import { formatRelative } from 'date-fns';
	import { enGB } from 'date-fns/locale';
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';
	import { source } from 'sveltekit-sse';
	import { page } from '$app/stores';
	import Box from '$lib/components/Box.svelte';
	import Link from '$lib/components/Link.svelte';
	import StreamerModeShow from '$lib/components/StreamerModeShow.svelte';
	import {
		getActivityFilters,
		MINIMUM_LIMIT,
		MAXIMUM_LIMIT,
		createActivityParams,
		handleAuthorsString,
		activityMatchesFilters,
	} from '$lib/utils/activity';
	import {
		AVAILABLE_ACTIVITY_TYPES,
		ACTIVITY_TYPES,
		ACTIVITY_TYPE_LABELS,
	} from '$lib/constants/activity';
	import Button from '$lib/components/Button.svelte';
	import { getMoreActivity } from '$lib/api/activity';
	import { reviver } from '$lib/utils/json';
	import { STATIC_DOMAIN } from '$lib/environment/environment';

	/**
	 * @typedef {import('$lib/db/activity/read').ActivityEntry} ActivityEntry
	 * @typedef {import('$lib/db/activity/read').ChildActivityEntry} ChildActivityEntry
	 */

	const filters = $derived(getActivityFilters($page.url.searchParams));

	let authorsInput = $derived(filters.authors.join(', '));
	let typesInput = $derived([...filters.types]);
	let limitInput = $derived(filters.limit);

	const handleFilterSearch = () => {
		const searchParams = createActivityParams({
			authors: handleAuthorsString(authorsInput),
			types: typesInput,
			limit: Number(limitInput),
		});
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const url = new URL($page.url);
		url.search = `?${searchParams.toString()}`;
		window.location.href = url.toString();
	};

	/** @type {Writable<ActivityEntry[]>} */
	const activities = writable($page.data.activities);

	let loading = $state(false);
	let done = $state(false);

	const handleLoadMore = async () => {
		loading = true;

		if (!$activities.length) {
			done = true;
			return;
		}

		try {
			const cursor = $activities[$activities.length - 1].id;

			const rawResponse = await getMoreActivity({ ...filters, cursor });
			const responseText = await rawResponse.text();
			const response = JSON.parse(responseText, reviver);
			$activities.push(...response);
			$activities = $activities;
			loading = false;

			if (response.length === 0) {
				done = true;
			}
		} catch (err) {
			console.error(err);
			loading = false;
		}
	};

	const sseActivityCreate = source('/api/adonis/frontpage').select('activity:create');

	onMount(() => {
		sseActivityCreate.subscribe((v) => {
			if (v) {
				/** @type {ActivityEntry} */
				const input = JSON.parse(v, reviver);

				const exists = $activities.some(({ id }) => id === input.id);

				if (!exists && activityMatchesFilters(input, filters)) {
					$activities.unshift(input);
					$activities = $activities;
				}
			}
		});
	});
</script>

{#snippet line(
	/** @type {ChildActivityEntry} */ activity,
	/** @type {ActivityEntry | null} */ parent
)}
	{@const { type, user, post, postUpdate, content } = activity}
	{#if type === ACTIVITY_TYPES.USER_REGISTER && user}
		<span class="rounded-sm bg-sky-500/25 p-1 text-xs">New user</span>
		<StreamerModeShow>
			<Link href="/user/{user.id}" target="_blank"><span class="font-bold">{user.name}</span></Link>
		</StreamerModeShow>&nbsp;
	{:else if type === ACTIVITY_TYPES.CONTENT_UPLOAD && content}
		<span>
			<Link href="{STATIC_DOMAIN}/{content.hash}" target="_blank">
				<span class="font-bold">{content.name}</span>
			</Link>&nbsp;
		</span>
		<span class="rounded-sm bg-violet-500/25 p-1 text-xs">Upload</span>
		<span>
			<small class="opacity-85"
				>{content.type ?? 'unknown'}{content.contentType
					? `, ${content.contentType}`
					: ''}{content.contentLength !== null ? ` (${content.contentLength})` : ''}&nbsp;</small
			>
		</span>
	{:else if type === ACTIVITY_TYPES.ARTICLE_RENAME}
		<small>
			<span class="font-bold">Title change:</span>
			"{postUpdate?.newTitle}"{#if postUpdate?.oldTitle}
				&nbsp;<i>was "{postUpdate.oldTitle}"</i>
			{/if}&nbsp;
		</small>
	{:else}
		{#if post}
			<span>
				<Link href="/w/{post.title}{postUpdate ? `/history/${postUpdate.id}` : ''}" target="_blank">
					<span class="font-bold">{post.rawTitle}</span>
				</Link>&nbsp;
			</span>
		{/if}
		{#if type === ACTIVITY_TYPES.ARTICLE_CREATE}
			<span class="rounded-sm bg-emerald-500/25 p-1 text-xs">New!</span>
		{:else if type !== ACTIVITY_TYPES.ARTICLE_UPDATE}
			<span class="rounded-sm bg-black/10 p-1 text-xs dark:bg-white/10"
				>{ACTIVITY_TYPE_LABELS[type] ?? type}</span
			>
		{/if}
		{#if postUpdate}
			<span><small class="opacity-85">({postUpdate.byteLength})&nbsp;</small></span>
		{/if}
		{#if type === ACTIVITY_TYPES.ARTICLE_UPDATE && post && postUpdate}
			<span>
				<Link href="/w/{post.title}/history/{postUpdate.id}-" target="_blank"
					>Compare with previous</Link
				>&nbsp;</span
			>
		{/if}
	{/if}
	{#if activity.explanation}
		<small><i>{activity.explanation}</i>&nbsp;</small>
	{/if}
	{#if !parent}
		<small
			>{formatRelative(activity.createdTimestamp, Date.now(), {
				locale: enGB,
			})}&nbsp;</small
		>
	{/if}
	{#if user && type !== ACTIVITY_TYPES.USER_REGISTER && user.id !== parent?.user?.id}
		<span>
			<small>
				<span class="font-bold">By:</span>
				<StreamerModeShow>
					<Link href="/user/{user.id}" target="_blank" class="decoration-1!">{user.name}</Link>
				</StreamerModeShow>
			</small>
		</span>
	{/if}
	{#if content?.metadata}
		<details class="mt-1">
			<summary class="cursor-pointer"><small>Metadata</small></summary>
			<pre class="overflow-x-auto text-xs">{JSON.stringify(content.metadata, null, 2)}</pre>
		</details>
	{/if}
{/snippet}

<section class="container mx-auto flex grow flex-col gap-4 p-4 lg:py-12">
	<noscript>
		<Box class="bg-red-500! p-4 text-black">
			<span class="font-bold">This page requires JavaScript to function.</span>
		</Box>
	</noscript>

	<Box class="flex flex-col overflow-hidden p-4 lg:mb-0">
		<div class="box-heading-wrapper mb-2">
			<h2 class="text-2xl">Activity</h2>
		</div>
		<div class="flex flex-col gap-2">
			<label title="Authors">
				<strong>Filter by authors:</strong> <small>(Comma delimited)</small>
				<div><input bind:value={authorsInput} class="input-color w-full rounded-sm" /></div>
			</label>
			<div class="flex flex-col gap-1">
				<strong>Filter by types:</strong>
				<div class="flex flex-wrap items-baseline gap-3">
					<label class="flex items-baseline gap-2">
						<input type="checkbox" checked={!typesInput.length} disabled class="opacity-50" />
						<span>All</span>
					</label>
					{#each AVAILABLE_ACTIVITY_TYPES as type (type)}
						<label class="flex items-baseline gap-2">
							<input type="checkbox" name="type" bind:group={typesInput} value={type} />
							<span>{ACTIVITY_TYPE_LABELS[type]}</span>
						</label>
					{/each}
				</div>
			</div>
			<label title="Limit">
				<strong>Limit:</strong>
				<div>
					<input
						bind:value={limitInput}
						type="number"
						min={MINIMUM_LIMIT}
						max={MAXIMUM_LIMIT}
						class="input-color rounded-sm"
					/>
				</div>
			</label>
			<Button class="self-start" on:click={handleFilterSearch}>Apply filter</Button>
		</div>
	</Box>
	<Box class="flex grow flex-col overflow-hidden p-2 lg:mb-0">
		{#each $activities as activity, index (activity.id)}
			<div class="p-2 {!(index % 2) ? 'bg-black/10 dark:bg-white/5' : ''}">
				{@render line(activity, null)}
				{#if activity.children.length}
					<details class="mt-1">
						<summary class="cursor-pointer">
							<small>
								{activity.children.length} linked {activity.children.length === 1
									? 'activity'
									: 'activities'}:
								{activity.children.map(({ type }) => ACTIVITY_TYPE_LABELS[type] ?? type).join(', ')}
							</small>
						</summary>
						<ul class="mt-1 ml-4 border-l-2 border-black/20 pl-2 dark:border-white/20">
							{#each activity.children as child (child.id)}
								<li class="py-1">{@render line(child, activity)}</li>
							{/each}
						</ul>
					</details>
				{/if}
			</div>
		{:else}
			<span class="bg-black/10 p-2 dark:bg-white/5">Nothing found.</span>
		{/each}

		{#if !done && $activities.length}
			<div>
				<Button on:click={handleLoadMore} disabled={loading} class="mt-2"
					>Load {filters.limit} more...</Button
				>
			</div>
		{/if}
	</Box>
</section>
