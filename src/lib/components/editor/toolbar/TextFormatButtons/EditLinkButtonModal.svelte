<script>
	import { Trash2Icon, XIcon } from 'lucide-svelte';

	import { modal } from '$lib/stores/modal';
	import Button from '$lib/components/Button.svelte';
	import Select from '$lib/components/Select.svelte';
	import isUrl from 'is-url';
	import { onMount } from 'svelte';
	import { sanitizeUrl } from '../../utils/sanitizeUrl';

	/** @typedef {import('@lexical/link').LinkAttributes} LinkAttributes */

	/**
	 * @typedef {Object} Props
	 * @property {boolean} [hasLink]
	 * @property {(url: string, attrs: LinkAttributes) => void} [onSubmit]
	 * @property {() => void} [deleteLink]
	 * @property {string} [url]
	 * @property {LinkAttributes} [attrs]
	 * @property {boolean} [isInternal]
	 */

	/** @type {Props} */
	let {
		hasLink = false,
		onSubmit = () => {},
		deleteLink = () => {},
		url = $bindable(''),
		attrs = {},
		isInternal = false
	} = $props();

	/** @type {HTMLSelectElement | null} */
	let selectLinkTypeElement = $state(null);

	/** @type {HTMLInputElement | null} */
	let inputElement = $state(null);

	let currentLinkType = $state(isInternal ? 'internal' : 'external');

	let isValidLink = $state(false);

	let error = $state('');

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
			url = sUrl;
			return;
		}

		error = 'Link is invalid.';
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
		}
	};

	const cancel = () => {
		$modal.isOpen = false
	};

	const handleSubmit = () => {
		onSubmit(url, attrs);
		$modal.isOpen = false;
	};

	onMount(() => {
		// Trigger handleInputChange if we're, for example, provided an URL through a selection + copy & paste action.
		if (url) {
			handleInputChange(/** @type {any} */ ({ target: { value: url } }));
		}
	});
</script>

<div class="modal-color pointer-events-auto relative p-0">
	<header class="forsen-wiki-theme-border flex items-center justify-between border-b p-6">
		<h1 class="text-xl font-semibold lg:text-2xl">Edit link</h1>
		<Button
			class="ml-auto inline-flex items-center rounded-lg"
			on:click={cancel}
		>
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
				on:click={() => selectLinkTypeElement?.dispatchEvent(new Event('change'))}
			>
				<option value="external" selected class="text-lg">External</option>
				<option value="internal" hidden class="text-lg">Internal</option>
			</Select>
		</label>

		<label class="flex flex-col gap-2">
			<strong>{currentLinkType === 'internal' ? 'Search article' : 'URL'}</strong>
			<input
				class="input-color w-full rounded-sm p-2"
				bind:value={url}
				oninput={handleInputChange}
				bind:this={inputElement}
				onclick={() => inputElement?.dispatchEvent(new Event('change'))}
			/>

			{#if error}
				<span class="font-bold text-red-700">{error}</span>
			{/if}
		</label>
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
