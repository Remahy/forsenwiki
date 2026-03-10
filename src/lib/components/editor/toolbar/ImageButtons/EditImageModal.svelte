<script>
	import { XIcon } from 'lucide-svelte';
	import Button from '$lib/components/Button.svelte';
	import { modal } from '$lib/stores/modal';
	import Spinner from '$lib/components/Spinner.svelte';
	import { IMAGE_MIN_HEIGHT, IMAGE_MIN_WIDTH } from '$lib/constants/image';
	import { loadContent, saveContent } from '$lib/utils/indexedDb/content';
	import { validateContent } from '$lib/api/content';
	import { ErrorWithCode } from '$lib/errors/ErrorWithCode';
	import { IMAGE_OFF, LUCIDE_ICON_LOADER } from '../../plugins/Image/Image';
	import { handleNewImage, ImageErrorCodes } from '../../utils/handleNewImage';
	import { createFileUploadObject } from '../../utils/fileUploadObject';
	import { editorGlobals } from '../../editorGlobals.svelte';

	const id = $derived(editorGlobals.articleId);

	/**
	 * @typedef {Object} Props
	 * @property {string} [src]
	 * @property {string} [altText]
	 * @property {number} [width]
	 * @property {number} [height]
	 * @property {(data: import('../../plugins/Image/Image').ImagePayload) => void} onSubmit
	 */

	/** @type {Props} */
	let {
		src = $bindable(''),
		altText = $bindable(''),
		width = $bindable(IMAGE_MIN_WIDTH),
		height = $bindable(IMAGE_MIN_HEIGHT),
		onSubmit,
	} = $props();

	let newSrc = $state('');
	let newSrcName = $state('');
	/** @type {File | null} */
	let newFile = $state(null);
	let newHash = $state('');

	/** @type {HTMLInputElement | null} */
	let inputElement = $state(null);

	let currentLinkType = $state('new');

	let isLoading = $state(false);

	let isValidImage = $state(false);

	let error = $state('');

	let originalImageHeight = $state(0);
	let originalImageWidth = $state(0);

	let previewImage = $derived.by(async () => {
		let value = newSrc || src;

		if (value.startsWith('https://') || value.startsWith('data:')) {
			return value;
		}

		const image = await loadContent(id, src);

		if (image) {
			return image.url;
		} else {
			console.error('Failed loading image from IndexedDb');
		}

		return IMAGE_OFF;
	});

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
				currentLinkType = 'internal';
				// Take me to "Browse" and search for content.name
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
			if (err instanceof ErrorWithCode) {
				error = err.message;
				switch (err.code) {
					case ImageErrorCodes.TOO_LARGE:
					case ImageErrorCodes.INVALID_IMAGE:
					case ImageErrorCodes.DIMENSIONS_TOO_LARGE:
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
			// const value = target.value;
			try {
				if (currentLinkType === 'new') {
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
				const fileUploadObject = await createFileUploadObject(newFile, newSrcName, newHash);

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

			await saveContent(id, newHash, newFile);
			onSubmit({ src: newHash, altText, width: Number(width), height: Number(height) });
		} else if (newSrc) {
			onSubmit({ src: newSrc, altText, width: Number(width), height: Number(height) });
		}

		$modal.isOpen = false;
	};
</script>

<div class="modal-color pointer-events-auto relative p-0">
	<header class="forsen-wiki-theme-border flex items-center justify-between border-b p-6">
		<h1 class="text-xl font-semibold lg:text-2xl">Edit image</h1>
		<Button class="ml-auto inline-flex items-center rounded-lg" on:click={cancel}>
			<XIcon />
		</Button>
	</header>

	<main class="forsen-wiki-theme-border flex flex-col gap-16 overflow-hidden border-b p-6">
		<label class="flex flex-col gap-2" for="select">
			<strong>Image source</strong>
			<div class="flex">
				<Button
					class="grow rounded-r-none! {currentLinkType === 'internal' ? '' : 'opacity-50'}"
					on:click={() => (currentLinkType = 'internal')}>Browse</Button
				>
				<Button
					class="grow rounded-l-none! {currentLinkType === 'new' ? '' : 'opacity-50'}"
					on:click={() => (currentLinkType = 'new')}>Upload</Button
				>
			</div>

			{#if src || newSrc}
				<figure
					class="bg-dark forsen-wiki-theme-border mx-auto flex min-h-50 min-w-50 items-center justify-center border"
				>
					{#await previewImage}
						<img class="animate-spin rounded-full" src={LUCIDE_ICON_LOADER} alt={altText} />
					{:then result}
						<img src={result} alt={altText || 'Preview of uploaded image'} class="max-h-100" />
					{/await}
				</figure>
			{/if}
		</label>

		{#if currentLinkType === 'new'}
			<label class="flex flex-col gap-2">
				<strong>{src.length ? 'Replace image' : 'New image'}</strong>
				<input
					type="file"
					accept="image/*"
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
		{:else}
			<p>Work in progress!</p>
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
