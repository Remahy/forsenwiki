<script>
	import { XIcon } from '@lucide/svelte';
	import Button from '$lib/components/Button.svelte';
	import Spinner from '$lib/components/Spinner.svelte';
	import Link from '$lib/components/Link.svelte';
	import { modal } from '$lib/stores/modal';
	import { IMAGE_MIN_HEIGHT, IMAGE_MIN_WIDTH } from '$lib/constants/image';
	import { loadContent, saveContent } from '$lib/utils/indexedDb/content';
	import { validateContent } from '$lib/api/content';
	import { ErrorWithCode } from '$lib/errors/ErrorWithCode';
	import { searchRequest } from '$lib/api/search';
	import { getImageCacheURL } from '$lib/utils/getImageCacheURL';
	import { mimetypes } from '$lib/s3/limits';
	import { IMAGE_OFF, LUCIDE_ICON_LOADER } from '../../plugins/Image/Image';
	import { handleNewImage } from '../../utils/handleNewImage';
	import { createFileUploadObject } from '../../utils/fileUploadObject';
	import { editorGlobals } from '../../editorGlobals.svelte';
	import { FileErrorCodes } from '../../utils/handleNewFile';

	const id = $derived(editorGlobals.articleId);

	/**
	 * @typedef {Object} Props
	 * @property {string} [src]
	 * @property {string} [altText]
	 * @property {number | 'inherit'} [width]
	 * @property {number | 'inherit'} [height]
	 * @property {'internal' | 'new'} [currentImageType]
	 * @property {(data: import('../../plugins/Image/Image').ImagePayload) => void} onSubmit
	 */

	/** @type {Props} */
	let {
		src = $bindable(''),
		altText = $bindable(''),
		width = $bindable(IMAGE_MIN_WIDTH),
		height = $bindable(IMAGE_MIN_HEIGHT),
		currentImageType = $bindable('new'),
		onSubmit,
	} = $props();

	/** @type {{ file: File, hash: string, url: string }?} */
	let loadedImage = $state(null);
	let autoSaved = $state(false);
	let newSrc = $state('');
	/** @type {string?} */
	let newSrcName = $state(null);
	/** @type {File | null} */
	let newFile = $state(null);
	let newHash = $state('');

	/** @type {HTMLInputElement | null} */
	let inputElement = $state(null);

	let isLoading = $state(false);

	let isValidImage = $state(false);

	let error = $state('');

	let originalImageHeight = $state(0);
	let originalImageWidth = $state(0);

	let searchQuery = $state(src);
	let isSearching = $state(false);
	/** @type {Array<{ title: string, rawTitle: string, lastUpdated: string, id: string }>} */
	let searchResults = $state([]);

	let previewImage = $derived.by(async () => {
		let value = newSrc || src;

		if (value.startsWith('https://') || value.startsWith('data:')) {
			return value;
		}

		const image = await loadContent(id, value);

		if (image) {
			loadedImage = image;
			currentImageType = 'new';
			newSrcName = image.file.name;
			return image.url;
		}

		if (value) {
			return getImageCacheURL(value).toString();
		}

		console.error('Failed loading image from IndexedDb');
		return IMAGE_OFF;
	});

	/** @param {{ rawTitle: string, title?: string }} value */
	const handleInternalImage = (value) => {
		if (!value.title) {
			return;
		}

		if (newFile) {
			originalImageWidth = 0;
			originalImageHeight = 0;
			width = 'inherit';
			height = 'inherit';
		}

		newSrc = value.title;
		newSrcName = value.rawTitle;
		newHash = value.title;
		newFile = null;
		isValidImage = true;
	};

	/** @param {HTMLInputElement} target */
	const handleNewImageWrapper = async (target) => {
		const file = target.files?.[0];
		if (!file) {
			return;
		}

		try {
			const imageData = await handleNewImage(file);

			originalImageWidth = imageData.width;
			originalImageHeight = imageData.height;
			width = imageData.width;
			height = imageData.height;

			if (imageData.linkType === 'internal') {
				currentImageType = 'internal';
				// Take me to "Browse" and search for content.name
				searchQuery = imageData.name;
				isLoading = false;
				return;
			}

			if (imageData.file) {
				newFile = imageData.file;
				newSrc = imageData.src;
				newSrcName = imageData.name;
				newHash = imageData.hash;
				isValidImage = true;
			}

			isLoading = false;
			return imageData.src;
		} catch (err) {
			console.error(err);
			if (err instanceof ErrorWithCode) {
				error = err.message;
				switch (err.code) {
					case FileErrorCodes.TOO_LARGE:
					case FileErrorCodes.INVALID_IMAGE:
					case FileErrorCodes.DIMENSIONS_TOO_LARGE:
						isValidImage = false;

						if (inputElement) {
							inputElement.value = '';
						}

						newSrc = '';

						break;
				}
			}
		}
	};

	/** @param {Event} e */
	const handleInputChange = async (e) => {
		error = '';

		/** @type {HTMLInputElement} */
		const target = /** @type {any} */ (e.target);
		if (target) {
			try {
				if (currentImageType === 'new') {
					await handleNewImageWrapper(target);
				}
			} catch {
				// noop
			} finally {
				isLoading = false;
			}
		}
	};

	const cancel = () => {
		$modal.isOpen = false;
	};

	const handleSubmit = async () => {
		isValidImage = false;

		if (newHash && newFile) {
			try {
				const fileUploadObject = await createFileUploadObject(newFile, newSrcName || 'Uploaded image', newHash);

				const res = await validateContent([fileUploadObject]);

				const { status } = res;

				if (status !== 200) {
					const errorJSON = await res.json();
					const parsedMessage = JSON.parse(errorJSON.message);

					/**
					 * @type {Array<{ index: number, message: string }>}
					 */
					const errors = parsedMessage;

					if (errors[0].index === -1) {
						// -1 index means global error.
						error = errors[0].message;
					} else {
						error = errors.map(({ message }) => message).join('\n');
					}

					throw new Error('Error with image validation');
				}
			} catch (err) {
				console.error(err);
				return;
			}

			await saveContent(id, newHash, new File([newFile], newSrcName || 'Uploaded image', { type: newFile.type }));
			onSubmit({ src: newHash, altText, width: Number(width), height: Number(height) });
		} else if (newSrc) {
			onSubmit({ src: newSrc, altText, width: Number(width), height: Number(height) });
		}

		$modal.isOpen = false;
	};

	$effect(() => {
		autoSaved = false;
		if (!loadedImage || newHash || newFile) {
			return;
		}

		if (newSrcName !== loadedImage.file.name) {
			const newFile = new File([loadedImage.file], newSrcName || 'Uploaded image', { type: loadedImage.file.type });
			(async () => {
				await saveContent(id, loadedImage.hash, newFile);
				autoSaved = true;
			})();
		}
	});

	$effect(() => {
		if (!searchQuery) {
			return;
		}

		isSearching = true;

		// Debouncer
		const handler = setTimeout(async () => {
			try {
				const res = await searchRequest(searchQuery, ['content'], {
					contentTypes: ['image'],
					// Todo allow loading in of more pages.
					page: 0,
					orderBy: 'desc',
				});
				const json = await res.json();
				searchResults = json;
				console.log(json);
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

<div class="modal-color pointer-events-auto relative p-0">
	<header class="forsen-wiki-theme-border flex items-center justify-between border-b p-6">
		<h1 class="text-xl font-semibold lg:text-2xl">Edit image</h1>
		<Button class="ml-auto inline-flex items-center rounded-lg" on:click={cancel}>
			<XIcon />
		</Button>
	</header>

	<main class="forsen-wiki-theme-border flex flex-col gap-16 overflow-hidden border-b p-6">
		<label class="flex flex-col gap-2" for="select-button">
			<strong>Image source</strong>
			<div class="flex">
				<Button
					id="select-button"
					class="grow rounded-r-none! {currentImageType === 'internal' ? '' : `opacity-50`}"
					on:click={() => (currentImageType = 'internal')}>Browse</Button
				>
				<Button
					id="select-button"
					class="grow rounded-l-none! {currentImageType === 'new' ? '' : 'opacity-50'}"
					on:click={() => (currentImageType = 'new')}>Upload</Button
				>
			</div>

			{#if src || newSrc}
				<figure
					class="forsen-wiki-theme-border bg-dark mx-auto flex min-h-50 min-w-50 items-center justify-center border"
				>
					{#await previewImage}
						<img class="animate-spin rounded-full" src={LUCIDE_ICON_LOADER} alt={altText} />
					{:then result}
						<img
							src={result}
							alt={altText || `${currentImageType === 'new' ? 'Uploaded ' : ''}image preview`}
							class="max-h-100"
						/>
					{/await}
				</figure>
			{/if}
		</label>

		{#if currentImageType === 'new'}
			<label class="flex flex-col gap-2">
				<strong>{src.length ? 'Replace image' : 'New image'}</strong>
				<input
					type="file"
					accept={mimetypes.image.flatMap((v) => v).join(', ')}
					class="forsen-wiki-theme-border rounded-sm border p-2"
					oninput={handleInputChange}
					bind:this={inputElement}
					onclick={() => inputElement?.dispatchEvent(new Event('change'))}
				/>

				{#if newSrc.length}
					<div>File selected: {newSrcName}</div>
				{/if}

				{#if isLoading}
					<div>
						<Spinner />
					</div>
				{/if}

				{#if error}
					<span class="font-bold text-red-700">{error}</span>
				{/if}
			</label>
		{/if}

		{#if currentImageType === 'internal'}
			<div>
				<div class="flex flex-col gap-2">
					<strong>Search by name</strong>
					<input class="input-color w-full rounded-sm p-2" bind:value={searchQuery} />
				</div>

				{#if isSearching}
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
							{#each searchResults as result (result.id)}
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
									<td
										><Button
											class="min-h-0! p-2! text-xs"
											on:click={() => handleInternalImage(result)}>Select</Button
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

		{#if typeof newSrcName === 'string'}
			<label class="flex flex-col gap-2">
				<div>
					<strong>File name</strong>
					<small class={newSrcName.length > 80 ? 'font-bold text-red-500' : ''}
						>Max length 80 characters</small
					>
				</div>
				<input class="input-color rounded-sm p-2" bind:value={newSrcName} maxlength="80" />
				{#if autoSaved}
					<div class="rounded-md bg-emerald-500/25 p-2">
						<small>Successfully modified name.</small>
					</div>
				{/if}
			</label>
		{/if}

		{#if src || newSrc}
			<label class="flex flex-col gap-2">
				<strong>Alt text</strong>
				<input class="input-color rounded-sm p-2" bind:value={altText} />
			</label>
		{/if}

		{#if newSrc}
			<div class="flex gap-16">
				<label class="inline-flex grow flex-col gap-2">
					<span>
						<strong>Width</strong>
						{#if originalImageWidth}
							<small>Original: <span>{originalImageWidth}</span></small>
						{/if}
					</span>
					<input
						type="number"
						placeholder="Inherit"
						class="input-color w-full rounded-sm p-2"
						bind:value={width}
					/>
				</label>
				<label class="inline-flex grow flex-col gap-2">
					<span>
						<strong>Height</strong>
						{#if originalImageHeight}
							<small>Original: <span>{originalImageHeight}</span></small>
						{/if}
					</span>
					<input
						type="number"
						placeholder="Inherit"
						class="input-color w-full rounded-sm p-2"
						bind:value={height}
					/>
				</label>
			</div>
		{/if}
	</main>

	<footer class="flex items-center justify-end gap-2 p-6">
		<Button on:click={cancel}>Cancel</Button>
		<Button on:click={handleSubmit} disabled={!isValidImage || isLoading}>Submit</Button>
	</footer>
</div>
