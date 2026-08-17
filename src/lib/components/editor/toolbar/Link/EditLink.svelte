<script>
	import isUrl from 'is-url';
	import Button from '$lib/components/Button.svelte';
	import { searchRequest } from '$lib/api/search';
	import { sanitizeUrl } from '../../utils/sanitizeUrl';
	import { Link2Icon, LinkIcon } from '@lucide/svelte';
	import Spinner from '$lib/components/Spinner.svelte';
	import { formatRelative } from 'date-fns';
	import { enGB } from 'date-fns/locale';
	import { getEditor } from 'svelte-lexical';

	const IS_INTERNAL = true;
	const IS_EXTERNAL = false;

	/**
	 * @typedef {Object} Props
	 * @property {import('$lib/lexical/custom').ALinkNode} selectedNode
	 */

	/** @type {Props} */
	let { selectedNode } = $props();

	/** @type {HTMLInputElement} */
	let inputElement;

	let finalUrl = $state();
	let error = $state('');
	let searchQuery = $state('');
	let isSearching = $state(false);
	/** @type {Array<{ title: string, rawTitle: string, lastUpdated: string, id: string }>} */
	let searchResults = $state([]);

	let editor = $derived(getEditor());

	let isInternal = $derived(selectedNode.__isInternal);
	let internalId = $derived(selectedNode.__internalId);
	let url = $derived(selectedNode.__url);

	let currentIsInternal = $derived(isInternal);
	let currentInternalId = $derived(internalId);
	let currentURL = $derived(url);

	const update = () => {
		editor.update(() => {
			console.log('updated');
			selectedNode.setIsInternal(currentIsInternal);

			if (currentIsInternal) {
				selectedNode.setInternalId(currentInternalId);
			}

			selectedNode.setURL(finalUrl);
		});
	};

	/** @param {boolean} isInternal */
	const linkType = (isInternal) => {
		currentIsInternal = isInternal;
		error = '';

		inputElement?.dispatchEvent(new Event('input', { bubbles: true }));
	};

	/** @param {{ title: string, rawTitle: string, lastUpdated: string, id: string }} value */
	const handleInternalLink = (value) => {
		finalUrl = '/w/' + value.title;
		currentInternalId = value.id;
		currentIsInternal = true;
		update();
	};

	/** @param {string} _value */
	const handleSearchInternalLink = (_value) => {
		const s = searchResults.find((r) => r.rawTitle === _value);
		if (s) {
			handleInternalLink(s);
			return;
		}

		let value = _value;

		if (value === finalUrl && internalId) {
			value = internalId;
		}

		searchQuery = value;

		if (!searchQuery) {
			error = 'Insert search query.';
		}
	};

	/** @param {string} value */
	const handleExternalLink = (value) => {
		const sUrl = sanitizeUrl(value);
		if (isUrl(sUrl)) {
			finalUrl = sUrl;
			url = sUrl;
			update();
			return;
		}

		error = 'Link is invalid.';
	};

	/** @param {Event} e */
	const handleInputChange = (e) => {
		error = '';

		/** @type {HTMLInputElement} */
		const target = /** @type {any} */ (e.target);
		if (target) {
			const value = target.value;

			if (currentIsInternal) {
				handleSearchInternalLink(value);
			} else {
				handleExternalLink(value);
			}
		}
	};

	$effect(() => {
		if (!searchQuery) {
			return;
		}

		isSearching = true;

		// Debouncer
		const handler = setTimeout(async () => {
			try {
				const res = await searchRequest(searchQuery, ['article']);
				searchResults = await res.json();
			} catch (err) {
				console.error(err);
				error = 'Search returned an error.';
			}

			isSearching = false;
		}, 750);

		// Cleanup function to clear the timeout if the search query changes before the timeout completes
		return () => {
			clearTimeout(handler);
			isSearching = false;
		};
	});
</script>

<div class="flex flex-col gap-4">
	<label class="flex flex-col gap-2" for="select">
		<strong>Type of link</strong>
		<div class="flex">
			<Button
				class="grow rounded-r-none! {currentIsInternal ? '' : 'opacity-50'}"
				on:click={() => linkType(IS_INTERNAL)}>Internal</Button
			>
			<Button
				class="grow rounded-l-none! {!currentIsInternal ? '' : 'opacity-50'}"
				on:click={() => linkType(IS_EXTERNAL)}>External</Button
			>
		</div>
	</label>

	<div class="flex flex-col gap-2">
		{#if currentIsInternal && finalUrl}
			<span>Selected: {finalUrl}</span>
		{/if}

		<label title="URL" class="relative flex w-full items-center gap-2">
			<span class="hidden">URL</span>
			{#if !currentIsInternal}
				<LinkIcon class="absolute left-4" />
			{:else if isSearching}
				<Spinner size="16" class="absolute left-4" />
			{:else}
				<Link2Icon class="absolute left-4" />
			{/if}

			<input
				bind:this={inputElement}
				bind:value={currentURL}
				oninput={handleInputChange}
				class="input-color min-h-10.5 w-full py-1 pl-12"
				list="internal-search"
			/>

			{#if currentIsInternal}
				<datalist id="internal-search">
					{#each searchResults as result (result.id)}
						<option value={result.rawTitle}
							>Last updated: {formatRelative(result.lastUpdated, Date.now(), {
								locale: enGB,
							})}</option
						>
					{/each}
				</datalist>
			{/if}
		</label>
		{#if error}
			<span class="font-bold text-red-700">{error}</span>
		{/if}
	</div>
</div>
