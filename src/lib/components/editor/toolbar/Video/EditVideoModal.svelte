<script>
	import { XIcon } from '@lucide/svelte';

	import { modal } from '$lib/stores/modal';
	import Button from '$lib/components/Button.svelte';
	import { searchRequest } from '$lib/api/search';
	import Spinner from '$lib/components/Spinner.svelte';
	import Link from '$lib/components/Link.svelte';
	import { STATIC_DOMAIN } from '$lib/environment/environment';
	import UploadContent from '$lib/components/Search/UploadContent.svelte';
	import {
		handleUploadContentSubmit,
		uploadContentState,
	} from '$lib/components/Search/uploadContent.svelte';
	import { createDebouncedSearch } from '../../utils/debouncedSearch.svelte';

	/**
	 * @typedef {import('$lib/s3/limits.js').MimetypeType} MimetypeType
	 * @typedef {import('$lib/api/search').SearchResult} SearchResult
	 */

	/**
	 * @typedef {Object} Props
	 * @property {string} [src]
	 * @property {string} [fileType]
	 * @property {(data: import('../../plugins/VideoEmbed/VideoEmbed').VideoEmbedPayload) => void} onSubmit
	 */

	/** @type {Props} */
	let { src = $bindable(''), fileType = $bindable(''), onSubmit } = $props();

	const cancel = () => {
		$modal.isOpen = false;
	};

	let newSrc = $state('');
	let newSrcName = $state('');
	/**
	 * @type {MimetypeType | undefined}
	 */
	let newFileType = $state();

	/** @type {'new' | 'internal'} */
	let currentVideoType = $state('internal');
	let isLoading = $state(false);
	let isValidVideo = $state(false);
	let error = $state('');

	let searchQuery = $state(src);

	let displayFileType = $derived(newFileType || fileType || 'video');

	/** @param {{ rawTitle: string, title?: string, fileType?: MimetypeType }} value */
	const handleInternalContent = (value) => {
		if (!value.title) {
			return;
		}

		newSrc = value.title;
		newSrcName = value.rawTitle;
		newFileType = value.fileType;

		isValidVideo = true;
	};

	const handleSubmit = async () => {
		isValidVideo = false;

		if (newSrc) {
			onSubmit({ src: newSrc, fileType: newFileType });
		}

		$modal.isOpen = false;
	};

	const search = createDebouncedSearch(
		() => searchQuery,
		/** @returns {Promise<SearchResult[]>} */
		async (query, signal) => {
			const res = await searchRequest(query, ['content'], {
				signal,
				contentTypes: ['video', 'audio'],
				page: 0,
				orderBy: 'desc',
			});

			if (!res.ok) {
				throw new Error(`Search failed: ${res.status}`);
			}

			return res.json();
		},
		{ initialValue: [] }
	);
</script>

<div class="modal-color pointer-events-auto relative p-0">
	<header class="forsen-wiki-theme-border flex items-center justify-between border-b p-6">
		<h1 class="text-xl font-semibold lg:text-2xl">Edit {displayFileType}</h1>
		<Button class="ml-auto inline-flex items-center rounded-lg" on:click={cancel}>
			<XIcon />
		</Button>
	</header>

	<main class="forsen-wiki-theme-border flex flex-col gap-16 overflow-hidden border-b p-6">
		<label class="flex flex-col gap-2" for="select">
			<strong class="capitalize">{displayFileType} source</strong>
			<div class="flex">
				<Button
					class="grow rounded-r-none! {currentVideoType === 'internal' ? '' : 'opacity-50'}"
					on:click={() => (currentVideoType = 'internal')}>Browse</Button
				>
				<Button
					class="grow rounded-l-none! {currentVideoType === 'new' ? '' : 'opacity-50'}"
					on:click={() => (currentVideoType = 'new')}>Upload</Button
				>
			</div>

			{#if newSrc || src}
				<figure
					class="forsen-wiki-theme-border bg-dark mx-auto flex min-h-50 min-w-50 items-center justify-center border"
				>
					{#key newSrc}
						<video controls>
							<source src="{STATIC_DOMAIN}/{newSrc || src}" />
						</video>
					{/key}
				</figure>
			{/if}

			{#if newSrc.length}
				<div>File selected: {newSrcName}</div>
			{/if}

			{#if isLoading}
				<div>
					<Spinner />
				</div>
			{/if}

			{#if error || search.error}
				<span class="font-bold text-red-700">{error || search.error}</span>
			{/if}
		</label>

		{#if currentVideoType === 'internal'}
			<div>
				<div class="flex flex-col gap-2">
					<strong>Search by name</strong>
					<input class="input-color w-full rounded-sm p-2" bind:value={searchQuery} />
				</div>

				{#if search.isSearching}
					<div class="flex grow items-center gap-2">
						<Spinner size="16" />
						<span>Searching for "{searchQuery}"...</span>
					</div>
				{:else}
					<strong>Results for "{searchQuery}"</strong>
				{/if}

				<div class="prose dark:prose-invert relative mt-2 flex max-w-[unset]">
					<table class="w-full table-auto">
						<tbody>
							{#each search.results as result (result.id)}
								<tr
									class={newSrc === result.title
										? `
									bg-black/10
									dark:bg-white/10
								`
										: ''}
								>
									<td class="max-w-xs">
										<div class="truncate">
											<Link href="/content/{result.id}" target="_blank">
												<strong>{result.rawTitle}</strong>
											</Link>
										</div>
									</td>
									<td class="max-w-xs">
										<div class="truncate">
											<strong>{result.fileType}</strong>
										</div>
									</td>
									<td
										><Button
											class="min-h-0! p-2! text-xs"
											on:click={() => handleInternalContent(result)}>Select</Button
										>{newSrc === result.title ? '(Selected)' : ''}</td
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

		{#if currentVideoType === 'new'}
			<div class="flex flex-col gap-2">
				<p>Video & audio content must be fully uploaded to the wiki before use.</p>
				<div class="forsen-wiki-theme-outline flex flex-col gap-16 overflow-hidden p-6">
					<UploadContent />
					<Button
						on:click={handleUploadContentSubmit}
						disabled={!uploadContentState.content.length || uploadContentState.isLoading}
						>Upload</Button
					>
				</div>
				<p>Then use the "Browse" tab to search for your newly uploaded content.</p>
			</div>
		{/if}
	</main>

	<footer class="flex items-center justify-end gap-2 p-6">
		<Button on:click={cancel}>Cancel</Button>
		<Button on:click={handleSubmit} disabled={!isValidVideo || isLoading}>Submit</Button>
	</footer>
</div>
