<script>
	import { formatRelative } from 'date-fns';
	import { enGB } from 'date-fns/locale';
	import { Trash2Icon, XIcon } from 'lucide-svelte';
	import isUrl from 'is-url';

	import { modal } from '$lib/stores/modal';
	import Button from '$lib/components/Button.svelte';
	import Select from '$lib/components/Select.svelte';
	import { searchRequest } from '$lib/api/search';
	import { sanitizeUrl } from '../../utils/sanitizeUrl';
	import Spinner from '$lib/components/Spinner.svelte';
	import Link from '$lib/components/Link.svelte';
	import { untrack } from 'svelte';

	/** @typedef {import('@lexical/link').LinkAttributes} LinkAttributes */

	/**
	 * @typedef {Object} Props
	 * @property {boolean} [hasLink]
	 * @property {(obj: { url: string, isInternal: boolean, internalId: string | null, rawTitle: string | null }, attrs: LinkAttributes) => void} [onSubmit]
	 * @property {() => void} [deleteLink]
	 * @property {string} [url]
	 * @property {LinkAttributes} [attrs]
	 * @property {boolean} [isInternal]
	 * @property {string | null} internalId
	 */

	/** @type {Props} */
	let {
		hasLink = false,
		onSubmit = () => {},
		deleteLink = () => {},
		url = $bindable(''),
		attrs = {},
		isInternal = $bindable(false),
		internalId = $bindable(null),
	} = $props();

	let finalUrl = $state();

	/** @type {HTMLSelectElement | null} */
	let selectLinkTypeElement = $state(null);

	/** @type {HTMLInputElement | null} */
	let inputElement = $state(null);

	let currentLinkType = $derived(isInternal ? 'internal' : 'external');

	let isValidLink = $state(false);

	let error = $state('');

	let searchQuery = $state('');
	let isSearching = $state(false);
	/** @type {Array<{ title: string, rawTitle: string, lastUpdated: string, id: string }>} */
	let searchResults = $state([]);

	let rawTitle = $state('');

	/** @param {Event} e */
	const linkType = (e) => {
		/** @type {HTMLSelectElement} */
		const target = /** @type {any} */ (e.target);
		if (target) {
			// These are only used as placeholders, don't action on them.
			const value = target.value;

			if (!['external', 'internal'].includes(value)) {
				return;
			}

			currentLinkType = value;
			error = '';
		}
	};

	const handleDeleteLink = () => {
		deleteLink();
		$modal.isOpen = false;
	};

	/** @param {string} value */
	const handleExternalLink = (value) => {
		const sUrl = sanitizeUrl(value);
		if (isUrl(sUrl)) {
			isValidLink = true;
			finalUrl = sUrl;
			url = sUrl;
			return;
		}

		error = 'Link is invalid.';
	};

	/** @param {string} _value */
	const handleSearchInternalLink = (_value) => {
		let value = _value;

		if (value === finalUrl && internalId) {
			value = internalId;
		}

		searchQuery = value;

		if (!searchQuery) {
			error = 'Insert search query.';
		}
	};

	/** @param {{ title: string, rawTitle: string, lastUpdated: string, id: string }} value */
	const handleInternalLink = (value) => {
		finalUrl = '/w/' + value.title;
		rawTitle = value.rawTitle;
		internalId = value.id;
		isInternal = true;
		isValidLink = true;
	};

	/** @param {Event} e */
	const handleInputChange = (e) => {
		isValidLink = false;
		error = '';

		/** @type {HTMLInputElement} */
		const target = /** @type {any} */ (e.target);
		if (target) {
			const value = target.value;

			if (currentLinkType === 'external') {
				handleExternalLink(value);
			}

			if (currentLinkType === 'internal') {
				handleSearchInternalLink(value);
			}
		}
	};

	const cancel = () => {
		$modal.isOpen = false;
	};

	const handleSubmit = () => {
		onSubmit({ url: finalUrl, isInternal, internalId, rawTitle }, attrs);
		$modal.isOpen = false;
	};

	$effect(() => {
		if (!searchQuery) {
			return;
		}

		isSearching = true;

		// Debouncer
		const handler = setTimeout(async () => {
			try {
				const res = await searchRequest(searchQuery, 'article');
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

	$effect(() => {
		// Trigger handleInputChange if we're, for example, provided an URL through a selection + copy & paste action.
		untrack(() => {
			if (url) {
				finalUrl = url;
				handleInputChange(/** @type {any} */ ({ target: { value: url } }));
			}
		});
	});
</script>

<div class="modal-color pointer-events-auto relative p-0">
	<header class="forsen-wiki-theme-border flex items-center justify-between border-b p-6">
		<h1 class="text-xl font-semibold lg:text-2xl">Edit link</h1>
		<Button class="ml-auto inline-flex items-center rounded-lg" on:click={cancel}>
			<XIcon />
		</Button>
	</header>

	<main class="forsen-wiki-theme-border flex flex-col gap-16 border-b p-6">
		<label class="flex flex-col gap-2" for="select">
			<strong>Type of link</strong>
			<Select
				id="select"
				class="grow p-2"
				bind:ref={selectLinkTypeElement}
				on:change={linkType}
				bind:value={currentLinkType}
				on:click={() => {
					selectLinkTypeElement?.dispatchEvent(new Event('change', { bubbles: true }));
					inputElement?.dispatchEvent(new Event('input', { bubbles: true }));
				}}
			>
				<option value="external" selected class="text-lg">External</option>
				<option value="internal" class="text-lg">Internal</option>
			</Select>
		</label>

		{#if currentLinkType === 'internal' && finalUrl}
			<div class="flex flex-col gap-2">
				<strong>URL</strong>
				<input
					class="input-color mb-2 w-full rounded-sm p-2 opacity-50"
					value={finalUrl}
					disabled
				/>
			</div>
		{/if}

		<div class="flex flex-col gap-2">
			<label class="flex flex-col gap-2">
				<strong>{currentLinkType === 'internal' ? 'Search article' : 'URL'}</strong>
				<input
					class="input-color w-full rounded-sm p-2"
					bind:value={url}
					oninput={handleInputChange}
					bind:this={inputElement}
					onclick={() => inputElement?.dispatchEvent(new Event('input', { bubbles: true }))}
				/>
			</label>
			{#if error}
				<span class="font-bold text-red-700">{error}</span>
			{/if}

			{#if currentLinkType === 'internal'}
				<div>
					{#if isSearching}
						<div class="flex grow items-center gap-2">
							<Spinner size="16" />
							<span>Searching for "{searchQuery}"...</span>
						</div>
					{:else}
						<strong>Results for "{searchQuery}"</strong>
					{/if}

					<div class="prose dark:prose-invert relative mt-2 flex max-w-[unset]">
						<table class="table-auto">
							<tbody>
								{#each searchResults as result}
									<tr class={internalId === result.id ? 'bg-black/10 dark:bg-white/10' : ''}>
										<td
											><Link href="/w/{result.title}" target="_blank">
												<strong>{result.rawTitle}</strong>
											</Link></td
										>
										<td>{formatRelative(result.lastUpdated, Date.now(), { locale: enGB })}</td>
										<td
											><Button
												class="!min-h-0 !p-2 text-xs"
												on:click={() => handleInternalLink(result)}>Select</Button
											>{internalId === result.id ? '(Selected)' : ''}</td
										>
									</tr>
								{:else}
									<tr>
										<th><p>Found nothing.</p></th>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			{/if}
		</div>
	</main>

	<footer class="flex items-center justify-end gap-2 p-6">
		{#if hasLink}
			<Button class="bg-red-600 font-bold hover:bg-red-700" on:click={handleDeleteLink}>
				<Trash2Icon /> Delete
			</Button>
		{/if}

		<Button disabled={!isValidLink} on:click={handleSubmit}>Submit</Button>
	</footer>
</div>
