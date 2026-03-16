const defaults ={
	uploading: 0,
	uploaded: [],
};

/**
 * @type {Array<{ url: string }>}
 */
const uploaded = $state([]);

/**
 * @type {{ count: number }}
 */
const uploading = $state({ count: 0 });

export const uploadContentModalGlobals = {
	uploaded,
	uploading,
};

/**
 * @param {{ url: string }} entry
 */
export const addNewUploaded = (entry) => {
	uploaded.push(entry);
};

/**
 * @param {number} length
 */
export const setUploading = (length) => {
	uploadContentModalGlobals.uploading.count = length;
};

export const resetUploadContentModalGlobals = () => {
	uploadContentModalGlobals.uploaded = defaults.uploaded;
	uploadContentModalGlobals.uploading.count = defaults.uploading;
};
