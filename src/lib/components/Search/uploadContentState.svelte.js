import { validateContent } from '$lib/api/content';
import { uploadFiles } from '$lib/s3/uploadContentHandlers';
import { createFileUploadObject } from '../editor/utils/fileUploadObject';
import UploadingContentModal from '../UploadingContentModal.svelte';
import { uploadModal } from '$lib/stores/modal';

/**
 * @type {{
 * content: Array<{ file: File, hash: string, name: string, type: string }>
 * isLoading: boolean,
 * error: string,
 * }}
 */
export const uploadContentState = $state({
	content: [],
	isLoading: false,
	error: '',
});

export const resetUploadContentState = () => {
	uploadContentState.content = [];
	uploadContentState.isLoading = false;
	uploadContentState.error = '';
};

export const handleUploadContentSubmit = async () => {
	uploadContentState.isLoading = true;
	const filesToUpload = [];

	for (let index = 0; index < uploadContentState.content.length; index++) {
		const entry = uploadContentState.content[index];

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
					uploadContentState.error = errors[0].message;
				} else {
					uploadContentState.error = errors.map(({ message }) => message).join('\n');
				}

				throw new Error('Error with content validation.');
			}

			filesToUpload.push(fileUploadObject);
		} catch (err) {
			console.error(err);
			uploadContentState.error = 'Something went wrong. Check console for more information.';
			uploadContentState.isLoading = false;
			return;
		}
	}

	uploadModal.set({ component: UploadingContentModal, isOpen: true, closable: true });

	try {
		await uploadFiles(filesToUpload);
	} catch (err) {
		console.error(err);
		uploadContentState.error = err?.toString() || 'Something went wrong uploading files.';
		uploadModal.update((current) => {
			current.isOpen = false;
			return current;
		});
	} finally {
		uploadContentState.isLoading = false;
	}
};
