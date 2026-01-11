/**
 * @param {Map<string, number>} cache
 * @param {string} title
 * @param {number} cacheTTL in milliseconds.
 */
export const getShouldCacheBust = (cache, title, cacheTTL = 21_600_000) => {
	let cacheBust = true;

	const ratelimit = cache.get(title);
	if (ratelimit && ratelimit > Date.now()) {
		cacheBust = false;
	} else {
		cache.set(title, Date.now() + cacheTTL);
	}

	return cacheBust;
};
