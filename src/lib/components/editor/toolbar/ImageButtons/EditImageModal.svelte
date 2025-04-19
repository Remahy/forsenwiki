<script>
	import { XIcon } from 'lucide-svelte';
	import Button from '$lib/components/Button.svelte';
	import { modal } from '$lib/stores/modal';
	import Select from '$lib/components/Select.svelte';
	import Spinner from '$lib/components/Spinner.svelte';
	import { MAX_IMAGE_SIZE_MIB, IMAGE_MIN_HEIGHT, IMAGE_MIN_WIDTH } from '$lib/constants/image';

	/**
	 * @typedef {Object} Props
	 * @property {string} [src]
	 * @property {string} [altText]
	 * @property {number} [width]
	 * @property {number} [height]
	 * @property {(data:import('../../plugins/Image/Image').ImagePayload) => void} onSubmit
	 */

	/** @type {Props} */
	let {
		src = $bindable(''),
		altText = $bindable(''),
		width = $bindable(IMAGE_MIN_WIDTH),
		height = $bindable(IMAGE_MIN_HEIGHT),
		onSubmit
	} = $props();

	/** @type {HTMLSelectElement | null} */
	let selectLinkTypeElement = $state(null);

	/** @type {HTMLInputElement | null} */
	let inputElement = $state(null);

	let currentLinkType = $state('new');

	let isLoading = $state(false);

	let isValidImage = $state(false);

	let error = $state('');

	let originalImageHeight = $state(0);
	let originalImageWidth = $state(0);

	/** @param {HTMLInputElement} target */
	const handleNewImage = (target) => {
		return new Promise((resolve, reject) => {
			isLoading = true;
			/** @type {Blob | undefined} */
			const file = target.files?.[0];

			if (file && file?.size) {
				const size = file.size / 1048576;

				if (size > MAX_IMAGE_SIZE_MIB) {
					isValidImage = false;
					error = `File size too large: Max is 5 MiB. Uploaded file size: ~${size.toFixed(2)} MiB`;

					if (inputElement) {
						inputElement.value = '';
					}

					src = '';
					reject(null);
					return;
				}

				const fileReader = new FileReader();
				fileReader.readAsDataURL(file);
				const img = new Image();

				fileReader.addEventListener('load', () => {
					if (typeof fileReader.result === 'string') {
						resolve(fileReader.result);
						src = fileReader.result;
						img.src = fileReader.result;
						isValidImage = true;
					}
					isLoading = false;
				});

				img.onload = () => {
					originalImageWidth = img.width;
					originalImageHeight = img.height;
					width = img.width;
					height = img.height;
				};

				img.onerror = () => {
					isValidImage = false;

					if (inputElement) {
						inputElement.value = '';
					}

					src = '';
					error = 'Image is invalid.';
					reject(null);
				};

				fileReader.addEventListener('error', () => {
					error = /** @type {string} */ (fileReader.error?.message);
				});
			} else {
				isValidImage = false;
				error = 'Image is invalid.';
				reject(null);
			}
		});
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
					await handleNewImage(target);
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

	const handleSubmit = () => {
		onSubmit({ src, altText, width: Number(width), height: Number(height) });
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
			<Select
				id="select"
				class="grow !p-2 text-base"
				bind:ref={selectLinkTypeElement}
				bind:value={currentLinkType}
				on:click={() => selectLinkTypeElement?.dispatchEvent(new Event('change'))}
			>
				<option value="new" selected class="text-lg">New</option>
				<option value="internal" hidden class="text-lg">Existing</option>
			</Select>
		</label>

		<label class="flex flex-col gap-2">
			<strong
				>{currentLinkType === 'internal'
					? 'Search for image'
					: src
						? 'Replace image'
						: 'New image'}</strong
			>
			<input
				type="file"
				accept="image/*"
				class="forsen-wiki-theme-border rounded border p-2"
				bind:value={src}
				oninput={handleInputChange}
				bind:this={inputElement}
				onclick={() => inputElement?.dispatchEvent(new Event('change'))}
			/>

			{#if isLoading}
				<div>
					<Spinner />
				</div>
			{/if}

			{#if error}
				<span class="font-bold text-red-700">{error}</span>
			{/if}
		</label>

		{#if src.length}
			<label class="flex flex-col gap-2">
				<strong>Alt text</strong>
				<input class="input-color rounded p-2" bind:value={altText} />
			</label>
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
						min={IMAGE_MIN_WIDTH}
						class="input-color w-full rounded p-2"
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
						min={IMAGE_MIN_HEIGHT}
						class="input-color w-full rounded p-2"
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
