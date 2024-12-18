const headers = new Headers({ 'content-type': 'application/json' });

/**
 * @param {string} clip
 */
export const getYouTubeClipURL = async (clip) => {
	const body = JSON.stringify({ clip });

	return fetch(`/api/utils/youtube`, { method: 'POST', body, headers });
};
