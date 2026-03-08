const MODERATORS_ARE_FAT_FILE_SIZE = 5 * 1024 * 1024 * 1024; // 5GiB
export const VIDEO_MAX_FILE_SIZE = 1 * 1024 * 1024 * 1024; // 1GiB
export const IMAGE_AUDIO_FILE_SIZE = 5 * 1024 * 1024; // 25MiB
export const DOCUMENT_FILE_SIZE = 10 * 1024 * 1024; // 10MiB

const mimetypes = {
	image: [['image/avif'], ['image/gif'], ['image/jpeg'], ['image/png'], ['image/webp']],
	video: [['video/mp4'], ['video/webm']],
	audio: [['audio/aac'], ['audio/mpeg'], ['audio/webm']],
	document: [
		['text/plain'],
		['text/csv'],
		['text/markdown'],
		['application/msword'],
		['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
	],
};

const magikaExtend = {
	...mimetypes,
	image: mimetypes.image.concat([['image/jpeg', 'jpg']]),
	audio: mimetypes.audio.concat([['audio/mpeg', 'mp3']]),
	document: mimetypes.document.concat([
		['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'docx'],
		['application/msword', 'doc'],
		['text/plain', 'txt'],
		['text/markdown', 'md'],
	]),
};
export const magikaTypeToMimetype = Object.entries(magikaExtend).reduce((acc, [type, list]) => {
	for (const mimes of list) {
		for (let index = 0; index < mimes.length; index++) {
			const mime = mimes[index];
			const ext = /** @type {string} */ (mime.split('/').pop());
			acc[ext] = mimes[0];
		}
	}

	return acc;
}, /** @type {{[key: string]: string}} */ ({}));

const mimeLookup = Object.entries(mimetypes).reduce((acc, [type, list]) => {
	for (const [mime] of list) {
		acc[mime] = type;
	}

	return acc;
}, /** @type {{[key: string]: string}} */ ({}));

/**
 * @param {string} contentType
 * @returns {keyof mimetypes | null}
 */
export const getType = (contentType) => /** @type {any} */ (mimeLookup[contentType]) ?? null;

/**
 * @param {'image' | 'video' | 'audio' | 'document'} type
 * @param {number} length
 * @param {boolean} isModerator
 */
export const getFileSizeLimit = (type, length, isModerator) => {
	if (!Number.isInteger(length) || length <= 0) {
		return { allowed: false, max: null };
	}

	if (!type) {
		return { allowed: false, max: null };
	}

	if (isModerator) {
		const max = MODERATORS_ARE_FAT_FILE_SIZE;
		return { allowed: length <= max, max };
	}

	if (['image', 'audio'].includes(type)) {
		const max = IMAGE_AUDIO_FILE_SIZE;
		return { allowed: length <= max, max };
	}

	if (type === 'document') {
		const max = DOCUMENT_FILE_SIZE;
		return { allowed: length <= max, max };
	}

	if (type === 'video') {
		const max = VIDEO_MAX_FILE_SIZE;
		return { allowed: length <= max, max };
	}

	return { allowed: false, max: null };
};
