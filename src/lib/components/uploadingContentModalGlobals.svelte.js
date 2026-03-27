const defaults = {
	uploading: 0,
	uploaded: [],
};

/**
 * @type {Array<{ url: string, contentType: string, id: string }>}
 */
const uploaded = $state([]);

/**
 * @type {{ count: number }}
 */
const uploading = $state({ count: 0 });

export const uploadingContentModalGlobals = {
	uploaded,
	uploading,
};

/**
 * @param {{ url: string, contentType: string, id: string }} entry
 */
export const addNewUploaded = (entry) => {
	uploaded.push(entry);
};

/**
 * @param {number} length
 */
export const setUploading = (length) => {
	uploadingContentModalGlobals.uploading.count = length;
};

export const resetUploadingContentModalGlobals = () => {
	uploadingContentModalGlobals.uploaded = defaults.uploaded;
	uploadingContentModalGlobals.uploading.count = defaults.uploading;
};
