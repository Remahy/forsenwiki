<script>
	import { XIcon } from 'lucide-svelte';
	import { page } from '$app/stores';
	import { modal, uploadModal } from '$lib/stores/modal';
	import {
		DOCUMENT_FILE_SIZE,
		getType,
		IMAGE_AUDIO_FILE_SIZE,
		mimetypes,
		supportedMimeTypes,
		VIDEO_MAX_FILE_SIZE,
	} from '$lib/s3/limits';
	import { validateContent } from '$lib/api/content';
	import { uploadFiles } from '$lib/s3/uploadContentHandlers';
	import { handleNewImage } from '../editor/utils/handleNewImage';
	import { handleNewFile } from '../editor/utils/handleNewFile';
	import { createFileUploadObject } from '../editor/utils/fileUploadObject';
	import Spinner from '../Spinner.svelte';
	import Button from '../Button.svelte';
	import Box from '../Box.svelte';
	import UploadingContentModal from '../UploadingContentModal.svelte';
	import { resetUploadingContentModalGlobals } from '../uploadingContentModalGlobals.svelte';

	/** @type {{ file: File, hash: string, name: string, type: string }[]} */
	const content = $state([]);

	let error = $state('');

	/** @type {boolean} */
	let isLoading = $state(false);

	/** @param {HTMLInputElement} target */
	const handleNewWrapper = async (target) => {
		const { files } = target;
		if (!files?.length) {
			return;
		}

		for (let index = 0; index < files.length; index++) {
			const file = files[index];
			const type = getType(file.type);

			try {
				switch (type) {
					case 'image': {
						const data = await handleNewImage(file, $page.data.isModerator);

						if (data.linkType === 'internal') {
							error += `Image "${file.name}" already exists as "${data.name}".\n`;
						} else if (data.file && !content.some(({ hash }) => hash === data.hash)) {
							// @ts-ignore
							content.push(data);
						}
						break;
					}
					case 'audio': {
						const data = await handleNewFile(file);

						if (data.linkType === 'internal') {
							error += `Audio "${file.name}" already exists as "${data.name}".\n`;
						} else if (data.file && !content.some(({ hash }) => hash === data.hash)) {
							// @ts-ignore
							content.push(data);
						}
						break;
					}
					case 'video': {
						const data = await handleNewFile(file);

						if (data.linkType === 'internal') {
							error += `Video "${file.name}" already exists as "${data.name}".\n`;
						} else if (data.file && !content.some(({ hash }) => hash === data.hash)) {
							// @ts-ignore
							content.push(data);
						}
						break;
					}
					case 'document': {
						const data = await handleNewFile(file);

						if (data.linkType === 'internal') {
							error += `Document "${file.name}" already exists as "${data.name}".\n`;
						} else if (data.file && !content.some(({ hash }) => hash === data.hash)) {
							// @ts-ignore
							content.push(data);
						}
						break;
					}
				}
			} catch (err) {
				console.error(err);
				// @ts-ignore
				error = err?.message || `Error with file "${file.name}".`;
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
				await handleNewWrapper(target);
			} catch {
				// noop
			} finally {
				isLoading = false;
			}
		}
	};

	/**
	 * @param {number} index
	 */
	const cancelUploadByIndex = (index) => {
		content.splice(index, 1);
	};

	const cancel = () => {
		$modal.isOpen = false;
	};

	const handleSubmit = async () => {
		isLoading = true;
		const filesToUpload = [];

		for (let index = 0; index < content.length; index++) {
			const entry = content[index];

			let fileUploadObject;
			try {
				fileUploadObject = await createFileUploadObject(entry.file, entry.name, entry.hash);

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

					throw new Error('Error with content validation.');
				}

				filesToUpload.push(fileUploadObject);
			} catch (err) {
				console.error(err);
				isLoading = false;
				return;
			}
		}

		uploadModal.set({ component: UploadingContentModal, isOpen: true });

		try {
			await uploadFiles(filesToUpload);
		} catch (err) {
			console.error(err);
			error = err?.toString() || 'Something went wrong uploading files.';
			$uploadModal.isOpen = false;
			resetUploadingContentModalGlobals();
		} finally {
			isLoading = false;
		}
	};
</script>

<div class="modal-color pointer-events-auto relative p-0">
	<header class="forsen-wiki-theme-border flex items-center justify-between border-b p-6">
		<h1 class="text-xl font-semibold lg:text-2xl">Upload content</h1>
		<Button class="ml-auto inline-flex items-center rounded-lg" on:click={cancel}>
			<XIcon />
		</Button>
	</header>

	<main class="forsen-wiki-theme-border flex flex-col gap-16 overflow-hidden border-b p-6">
		<div class="flex flex-col gap-2">
			<Box class="mb-4 bg-indigo-400/10! p-4 text-sm">
				<p>
					<strong>Limitations:</strong>
				</p>
				<ul class="ml-4.5 list-disc">
					<li class="mb-2">
						<strong class="inline-block min-w-24">Image</strong> File size {IMAGE_AUDIO_FILE_SIZE /
							1_048_576} MiB. Max dimensions 5000x5000. Supported types: {mimetypes.image
							.flatMap(([v]) => v.split('/').pop())
							.join(', ')}
					</li>
					<li class="mb-2">
						<strong class="inline-block min-w-24">Audio</strong> File size {IMAGE_AUDIO_FILE_SIZE /
							1_048_576} MiB. Supported types: {mimetypes.audio.flatMap(([v]) => v).join(', ')}
					</li>
					<li class="mb-2">
						<strong class="inline-block min-w-24">Video</strong> File size {VIDEO_MAX_FILE_SIZE /
							1_048_576} MiB. Supported types: {mimetypes.video
							.flatMap(([v]) => v.split('/').pop())
							.join(', ')}
					</li>
					<li class="mb-2">
						<strong class="inline-block min-w-24">Document</strong> File size {DOCUMENT_FILE_SIZE /
							1_048_576} MiB. Supported types: {mimetypes.document
							.flatMap(([v]) => v.split('/').pop())
							.join(', ')}
					</li>
					<li><strong>Moderators have a global limit of 5 GiB.</strong></li>
				</ul>
			</Box>

			<small>You can upload several files.</small>
			<input
				type="file"
				multiple
				accept={supportedMimeTypes.join(', ')}
				oninput={handleInputChange}
				class="forsen-wiki-theme-border rounded-sm border p-2"
			/>

			{#if isLoading}
				<div>
					<Spinner />
				</div>
			{/if}

			{#if error}
				<span class="font-bold text-red-700">{error.trim()}</span>
			{/if}
		</div>

		<div class="flex flex-col gap-2">
			<strong>Files to upload</strong>

			<ul class="ml-4.5 list-disc">
				{#each content as entry, index (entry)}
					<li>
						<div class="flex items-baseline gap-4">
							<span>{entry.name} ({entry.file.type})</span>
							<Button
								class="bg-transparent! p-0! text-red-500!"
								onclick={() => cancelUploadByIndex(index)}
							>
								<span>Cancel</span>
							</Button>
						</div>
					</li>
				{/each}
			</ul>
		</div>
	</main>

	<footer class="flex items-center justify-end gap-2 p-6">
		<Button on:click={cancel} disabled={isLoading}>Cancel</Button>
		<Button on:click={handleSubmit} disabled={!content.length || isLoading}>Submit</Button>
	</footer>
</div>
