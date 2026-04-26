<script>
	import { page } from '$app/stores';
	import Button from '../Button.svelte';
	import Select from '../Select.svelte';
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
		<label class="flex flex-wrap items-baseline gap-2">
			<input
				type="checkbox"
				checked={!types.length || types.includes('')}
				disabled
				class="opacity-50"
			/>
			<span>All</span>
		</label>
		<label class="flex items-baseline gap-2">
			<input type="checkbox" name="type" bind:group={types} value="article" />
			<span>Articles</span>
		</label>

		<label class="flex items-baseline gap-2">
			<input type="checkbox" name="type" bind:group={types} value="content" />
			<span>Content</span>
		</label>
	</div>
</div>

{#if types.includes('content') || types.includes('') || !types.length}
	<div class="flex flex-col gap-1">
		<strong class="min-w-25">Content type</strong>
		<div class="flex flex-wrap items-baseline gap-3">
			<label class="flex items-baseline gap-2">
				<input
					type="checkbox"
					checked={!contentTypes.length || contentTypes.includes('')}
					disabled
					class="opacity-50"
				/>
				<span>All</span>
			</label>

			<label class="flex items-baseline gap-2">
				<input type="checkbox" name="contenttype" bind:group={contentTypes} value="image" />
				<span>Image</span>
			</label>
			<label class="flex items-baseline gap-2">
				<input type="checkbox" name="contenttype" bind:group={contentTypes} value="video" />
				<span>Video</span>
			</label>
			<label class="flex items-baseline gap-2">
				<input type="checkbox" name="contenttype" bind:group={contentTypes} value="audio" />
				<span>Audio</span>
			</label>
			<label class="flex items-baseline gap-2">
				<input type="checkbox" name="contenttype" bind:group={contentTypes} value="document" />
				<span>Document</span>
			</label>
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
