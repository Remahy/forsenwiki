import isUrl from 'is-url';
import sanitize from 'sanitize-filename';

/**
 * @param {string} title
 * @returns {{ raw: string, sanitized: string }}
 */
export const sanitizeTitle = (title) => {
	const raw = title.replace(/\s{2,}/, ' ').trim();

	const spaceReplacedTitle = raw
		.replace(/\s/g, '_')
		.replace(/_{2,}/g, '_')
		.replace(/'/g, '')
		.trim();

	const fileNameSanitizedTitle = sanitize(spaceReplacedTitle);

	const lowerCaseTitle = fileNameSanitizedTitle.toLocaleLowerCase();

	// Extreme replacement, when previous steps fail to produce a valid url.
	if (!isUrl(`https://example.com/${lowerCaseTitle}`)) {
		const onlyASCIITitle = lowerCaseTitle.replace(/\W+/g, '');
		return { raw, sanitized: encodeURIComponent(onlyASCIITitle) };
	}

	return { raw, sanitized: encodeURIComponent(lowerCaseTitle) };
};
