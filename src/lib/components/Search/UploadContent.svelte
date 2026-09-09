<script>
	import { page } from '$app/stores';

	import {
		DOCUMENT_FILE_SIZE,
		getType,
		IMAGE_AUDIO_FILE_SIZE,
		mimetypes,
		supportedMimeTypes,
		VIDEO_MAX_FILE_SIZE,
	} from '$lib/s3/limits';

	import { handleNewImage } from '../editor/utils/handleNewImage';
	import { handleNewFile } from '../editor/utils/handleNewFile';
	import Spinner from '../Spinner.svelte';
	import Box from '../Box.svelte';
	import Button from '../Button.svelte';
	import { uploadContentState } from './uploadContent.svelte';

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
							uploadContentState.error += `Image "${file.name}" already exists as "${data.name}".\n`;
						} else if (
							data.file &&
							!uploadContentState.content.some(({ hash }) => hash === data.hash)
						) {
							// @ts-ignore
							uploadContentState.content.push(data);
						}
						break;
					}
					case 'audio': {
						const data = await handleNewFile(file);

						if (data.linkType === 'internal') {
							uploadContentState.error += `Audio "${file.name}" already exists as "${data.name}".\n`;
						} else if (
							data.file &&
							!uploadContentState.content.some(({ hash }) => hash === data.hash)
						) {
							// @ts-ignore
							uploadContentState.content.push(data);
						}
						break;
					}
					case 'video': {
						const data = await handleNewFile(file);

						if (data.linkType === 'internal') {
							uploadContentState.error += `Video "${file.name}" already exists as "${data.name}".\n`;
						} else if (
							data.file &&
							!uploadContentState.content.some(({ hash }) => hash === data.hash)
						) {
							// @ts-ignore
							uploadContentState.content.push(data);
						}
						break;
					}
					case 'document': {
						const data = await handleNewFile(file);

						if (data.linkType === 'internal') {
							uploadContentState.error += `Document "${file.name}" already exists as "${data.name}".\n`;
						} else if (
							data.file &&
							!uploadContentState.content.some(({ hash }) => hash === data.hash)
						) {
							// @ts-ignore
							uploadContentState.content.push(data);
						}
						break;
					}
				}
			} catch (err) {
				console.error(err);
				// @ts-ignore
				uploadContentState.error = err?.message || `Error with file "${file.name}".`;
			}
		}
	};

	/**
	 * @param {number} index
	 */
	const cancelUploadByIndex = (index) => {
		uploadContentState.content.splice(index, 1);
	};

	/** @param {Event} e */
	const handleInputChange = async (e) => {
		uploadContentState.error = '';

		/** @type {HTMLInputElement} */
		const target = /** @type {any} */ (e.target);
		if (target) {
			try {
				await handleNewWrapper(target);
			} catch {
				// noop
			} finally {
				uploadContentState.isLoading = false;
			}
		}
	};
</script>

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

	{#if uploadContentState.isLoading}
		<div>
			<Spinner />
		</div>
	{/if}

	{#if uploadContentState.error}
		<span class="font-bold text-red-700">{uploadContentState.error.trim()}</span>
	{/if}
</div>

<div class="flex flex-col gap-2">
	<strong>Files to upload</strong>

	<ol class="ml-4.5 list-decimal">
		{#each uploadContentState.content as entry, index (entry)}
			<li>
				<div class="inline-flex w-full items-center gap-4">
					<div class="grow">
						<div>
							<strong>File name</strong>
							<small
								class={uploadContentState.content[index].name.length > 80
									? `
										font-bold text-red-500
									`
									: ''}>Max length 80 characters</small
							>
						</div>
						<input
							type="text"
							class="input-color w-full py-4 placeholder:text-inherit/25"
							placeholder={entry.file.name}
							maxlength="80"
							bind:value={uploadContentState.content[index].name}
						/>
					</div>
					<div>
						<Button
							class="bg-transparent! p-0! text-red-500!"
							onclick={() => cancelUploadByIndex(index)}
						>
							<span>Cancel</span>
						</Button>
						<span>({entry.file.type})</span>
					</div>
				</div>
			</li>
		{/each}
	</ol>
</div>
