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
	import Badge from '$lib/components/Badge.svelte';
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
	import { DISCLAIMER_TAG_LABELS } from '$lib/constants/constants';

	/**
	 * @typedef {import('$lib/db/activity/read').ActivityEntry} ActivityEntry
	 * @typedef {import('$lib/db/activity/read').ChildActivityEntry} ChildActivityEntry
	 */

	/** @type {Record<import('$lib/constants/activity').ActivityType, string>} */
	const BADGE_COLORS = {
		ARTICLE_CREATE: 'bg-emerald-500/25',
		ARTICLE_UPDATE: 'bg-orange-500/25',
		ARTICLE_RENAME: 'bg-orange-500/25',
		ARTICLE_RETAG: 'bg-orange-500/25',
		USER_REGISTER: 'bg-black/10 dark:bg-black',
		CONTENT_UPLOAD: 'bg-violet-500/25',
		CONTENT_DELETE: 'bg-red-500/25',
		CONTENT_RENAME: 'bg-fuchsia-500/25',
	};

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

{#snippet badge(/** @type {import('$lib/constants/activity').ActivityType} */ type)}
	<Badge class={BADGE_COLORS[type]}>{ACTIVITY_TYPE_LABELS[type] ?? type}</Badge>
{/snippet}

{#snippet line(
	/** @type {ChildActivityEntry} */ activity,
	/** @type {ActivityEntry | null} */ parent
)}
	{@const { type, user, post, postUpdate, content } = activity}
	{@render badge(type)}
	{#if type === ACTIVITY_TYPES.USER_REGISTER && user}
		<StreamerModeShow>
			<Link href="/user/{user.id}" target="_blank"><span class="font-bold">{user.name}</span></Link>
		</StreamerModeShow>&nbsp;
	{:else if (type === ACTIVITY_TYPES.CONTENT_UPLOAD || type === ACTIVITY_TYPES.CONTENT_DELETE) && content}
		<span>
			{#if content.deleted}
				<span class="font-bold" title="Deleted">{content.name}</span>&nbsp;
			{:else}
				<Link href="/content/{content.id}" target="_blank">
					<span class="font-bold">{content.name}</span>
				</Link>&nbsp;
			{/if}
		</span>
		<span>
			<small class="opacity-85"
				>{content.contentLength !== null ? `(${content.contentLength}) ` : ''}{content.type ??
					'unknown'}{content.contentType ? `, ${content.contentType}` : ''}&nbsp;</small
			>
		</span>
	{:else if type === ACTIVITY_TYPES.CONTENT_RENAME}
		<small>
			{#if content && !content.deleted}
				<Link href="/content/{content.id}" target="_blank">"{activity.newName}"</Link>
			{:else}
				"{activity.newName}"
			{/if}
			{#if activity.oldName}
				&nbsp;<i>was "{activity.oldName}"</i>
			{/if}&nbsp;
		</small>
	{:else if type === ACTIVITY_TYPES.ARTICLE_RETAG}
		{@const label = (/** @type {string} */ tag) => DISCLAIMER_TAG_LABELS[tag] ?? tag}
		{@const added = activity.newTags.filter((tag) => !activity.oldTags.includes(tag))}
		{@const removed = activity.oldTags.filter((tag) => !activity.newTags.includes(tag))}
		<small>
			{#if added.length}
				<span class="font-bold">Added:</span> {added.map(label).join(', ')}&nbsp;
			{/if}
			{#if removed.length}
				<span class="font-bold">Removed:</span> {removed.map(label).join(', ')}&nbsp;
			{/if}
		</small>
	{:else if type === ACTIVITY_TYPES.ARTICLE_RENAME}
		<small>
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
	{#if activity.explanation}
		<small>&nbsp;<i>{activity.explanation}</i></small>
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
