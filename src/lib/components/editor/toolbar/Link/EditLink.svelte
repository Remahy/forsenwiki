<script>
	import { Link2Icon, LinkIcon } from '@lucide/svelte';
	import { formatRelative } from 'date-fns';
	import { enGB } from 'date-fns/locale';
	import isUrl from 'is-url';
	import { getEditor } from 'svelte-lexical';
	import Button from '$lib/components/Button.svelte';
	import { searchRequest } from '$lib/api/search';
	import Spinner from '$lib/components/Spinner.svelte';
	import { readPost } from '$lib/api/posts';
	import { sanitizeUrl } from '../../utils/sanitizeUrl';
	import { createDebouncedSearch } from '../../utils/debouncedSearch.svelte';
	import { getHeadings } from '$lib/components/ToC/getHeadings';
	import Select from '$lib/components/Select.svelte';

	/**
	 * @typedef {import('$lib/api/search').SearchResult} SearchResult
	 */

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

	let editor = $derived(getEditor());

	let isInternal = $derived(selectedNode.__isInternal);
	let internalId = $derived(selectedNode.__internalId);
	let url = $derived(selectedNode.__url);

	let currentIsInternal = $derived(isInternal);
	let currentInternalId = $derived(internalId);
	let currentURL = $derived(url);

	/** @param {boolean} isInternal */
	const linkType = (isInternal) => {
		currentIsInternal = isInternal;
		error = '';

		inputElement?.dispatchEvent(new Event('input', { bubbles: true }));
	};

	const update = () => {
		editor.update(() => {
			selectedNode.setIsInternal(currentIsInternal);

			if (currentIsInternal) {
				selectedNode.setInternalId(currentInternalId);
			}

			selectedNode.setURL(finalUrl);
		});
	};

	let heading = $state();
	/**
	 * @type {Array<{ label: string, id: string }>}
	 */
	let headings = $state([]);
	let loadingHeadings = $state(false);

	/** @param {string} title */
	const loadHeadings = async (title) => {
		loadingHeadings = true;

		/** @type {Response?} */
		let res;

		try {
			res = await readPost({ postTitle: title });
		} catch (error) {
			console.error(error);
			headings = [];
			loadingHeadings = false;
			return;
		}

		if (!res || res.status !== 200) {
			headings = [];
			loadingHeadings = false;
		}

		try {
			const json = await res.json();

			const { html } = json;

			const article = new DOMParser().parseFromString(`<main>${html}</main>`, 'text/html');

			const foundHeadings = getHeadings(article.body);

			headings = foundHeadings.map(({ id, textContent }) => ({ id, label: textContent }));
			loadingHeadings = false;
		} catch (error) {
			console.error(error);
			loadingHeadings = false;
			headings = [];
		}
	};

	/**
	 * @param {HTMLSelectElement} target
	 */
	const handleHeadingChange = (target) => {
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const url = new URL(finalUrl, window.location.origin);
		url.hash = target.value;
		finalUrl = url.pathname + url.hash;

		isInternal = true;
		update();
	};

	/** @param {{ title: string, rawTitle: string, id: string }} value */
	const handleInternalLink = (value) => {
		finalUrl = '/w/' + value.title;
		currentInternalId = value.id;
		currentIsInternal = true;
		update();
		loadHeadings(value.title);
	};

	/** @param {string} _value */
	const handleSearchInternalLink = (_value) => {
		const s = search.results.find((r) => r.rawTitle === _value);
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

		setTimeout(() => {
			target.focus();
		});
	};

	const search = createDebouncedSearch(
		() => searchQuery,
		/** @returns {Promise<SearchResult[]>} */
		async (query, signal) => {
			const res = await searchRequest(query, ['article'], { signal });

			if (!res.ok) {
				throw new Error(`Search failed: ${res.status}`);
			}

			return res.json();
		},
		{ initialValue: [] }
	);
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
			{:else if search.isSearching}
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
					{#each search.results as result (result.id)}
						<option value={result.rawTitle}
							>Created: {formatRelative(result.createdTimestamp, Date.now(), {
								locale: enGB,
							})}</option
						>
					{/each}
				</datalist>
			{/if}
		</label>

		{#if currentIsInternal && internalId && headings.length}
			<div class="flex flex-col gap-2">
				<strong>Heading</strong>
				{#if !loadingHeadings}
					<Select
						title="Heading"
						class="input-color w-full rounded-sm p-2"
						onchange={(/** @type {{ currentTarget: HTMLSelectElement }} */ evt) =>
							handleHeadingChange(evt.currentTarget)}
						value={heading}
					>
						<option value=""></option>
						{#each headings as heading (heading.id)}
							<option value={heading.id}>{heading.label}</option>
						{/each}
					</Select>
				{:else}
					<div><Spinner /></div>
				{/if}
			</div>
		{/if}

		{#if error || search.error}
			<span class="font-bold text-red-700">{error || search.error}</span>
		{/if}
	</div>
</div>
