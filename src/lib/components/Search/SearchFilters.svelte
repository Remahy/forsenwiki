<script>
	import { page } from '$app/stores';
	import Button from '../Button.svelte';
	import Select from '../Select.svelte';
	import Badge from '../Badge.svelte';
	import { CONTENT_TYPE_BADGES, SEARCH_TYPE_BADGES } from './badges';
	import { parseSearchURL } from './parseSearchURL';

	/** @type {string[]} */
	let types = $state([]);

	/** @type {string[]} */
	let contentTypes = $state([]);

	/** @type {'asc' | 'desc'} */
	let order = $state('desc');

	$effect(() => {
		const { url } = $page;

		const {
			types: t,
			options: { orderBy: o, contentTypes: ct },
		} = parseSearchURL(url);

		types = t;

		// @ts-ignore
		order = o;

		if (t.includes('content') || t.includes('') || !t.length) {
			contentTypes = ct;
		}
	});
</script>

<div class="flex flex-col gap-1">
	<strong class="min-w-25">Type</strong>
	<div class="flex items-baseline gap-3">
		<label class="flex flex-wrap items-center gap-2">
			<input
				type="checkbox"
				checked={!types.length || types.includes('')}
				disabled
				class="opacity-50"
			/>
			<span>All</span>
		</label>
		{#each Object.entries(SEARCH_TYPE_BADGES) as [value, { label, color }] (value)}
			<label class="flex items-center gap-2">
				<input type="checkbox" name="type" bind:group={types} {value} />
				<Badge class={color}>{label}</Badge>
			</label>
		{/each}
	</div>
</div>

{#if types.includes('content')}
	<div class="flex flex-col gap-1">
		<strong class="min-w-25">Content type</strong>
		<div class="flex flex-wrap items-baseline gap-3">
			<label class="flex items-center gap-2">
				<input
					type="checkbox"
					checked={!contentTypes.length || contentTypes.includes('')}
					disabled
					class="opacity-50"
				/>
				<span>All</span>
			</label>

			{#each Object.entries(CONTENT_TYPE_BADGES) as [value, { label, icon }] (value)}
				<label class="flex items-center gap-2">
					<input type="checkbox" name="contenttype" bind:group={contentTypes} {value} />
					<Badge {icon}>{label}</Badge>
				</label>
			{/each}
		</div>
	</div>
{/if}

<label class="flex items-baseline gap-2">
	<strong class="min-w-12">Order</strong>
	<Select title="Order by" name="order" class="size-full" bind:value={order}>
		<option value="desc">Descending</option>
		<option value="asc">Ascending</option>
	</Select>
</label>

<Button type="submit" class="self-start">
	<span>Apply filter</span>
</Button>
