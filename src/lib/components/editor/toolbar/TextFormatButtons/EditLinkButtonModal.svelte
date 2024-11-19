<script>
	import { Trash2Icon, XIcon } from 'lucide-svelte';

	import { modal } from '$lib/stores/modal';
	import Button from '$lib/components/Button.svelte';
	import Select from '$lib/components/Select.svelte';
	import isUrl from 'is-url';
	import { onMount } from 'svelte';
	import { sanitizeUrl } from '../../utils/sanitizeUrl';

	/** @typedef {import('@lexical/link').LinkAttributes} LinkAttributes */

	/** @type {boolean} */
	export let hasLink = false;

	/** @type {(url: string, attrs: LinkAttributes) => void} */
	export let onSubmit = () => {};

	/** @type {() => void} */
	export let deleteLink = () => {};

	/** @type {string} */
	export let url = '';

	/** @type {LinkAttributes} */
	export let attrs = {};

	export let isInternal = false;

	/** @type {HTMLSelectElement} */
	let selectLinkTypeElement;

	/** @type {HTMLInputElement} */
	let inputElement;

	let currentLinkType = isInternal ? 'internal' : 'external';

	let isValidLink = false;

	let error = '';

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

<div
	class="pointer-events-auto relative rounded border bg-white p-0 shadow dark:border-violet-900 dark:bg-neutral-950"
>
	<header class="flex items-center justify-between border-b p-6 dark:border-violet-900">
		<h1 class="text-xl font-semibold lg:text-2xl">Edit link</h1>
		<Button
			class="ml-auto inline-flex items-center rounded-lg"
			on:click={() => ($modal.isOpen = false)}
		>
			<XIcon />
		</Button>
	</header>

	<main class="flex flex-col gap-16 border-b p-6 dark:border-violet-900">
		<label class="flex flex-col gap-2" for="select">
			<strong>Type of link</strong>
			<Select
				id="select"
				class="grow p-2"
				bind:ref={selectLinkTypeElement}
				on:change={linkType}
				bind:value={currentLinkType}
				on:click={() => selectLinkTypeElement.dispatchEvent(new Event('change'))}
			>
				<option value="external" selected class="text-lg">External</option>
				<option value="internal" hidden class="text-lg">Internal</option>
			</Select>
		</label>

		<label class="flex flex-col gap-2">
			<strong>{currentLinkType === 'internal' ? 'Search article' : 'URL'}</strong>
			<input
				class="w-full rounded bg-transparent p-2 dark:border-violet-900"
				bind:value={url}
				on:input={handleInputChange}
				bind:this={inputElement}
				on:click={() => inputElement.dispatchEvent(new Event('change'))}
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
