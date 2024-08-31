import isUrl from 'is-url';
import sanitize from 'sanitize-filename';

/** @param {string} title */
export const sanitizeTitle = (title) => {
	const raw = title;

	const spaceReplacedTitle = raw.replace(/\s/g, '_');

	const fileNameSanitizedTitle = sanitize(spaceReplacedTitle);

	const lowerCaseTitle = fileNameSanitizedTitle.toLocaleLowerCase();

	// Extreme replacement, when previous steps fail to produce a valid url.
	if (!isUrl(`https://example.com/${lowerCaseTitle}`)) {
		const onlyASCIITitle = lowerCaseTitle.replace(/\W+/g, '');
		return { raw, sanitized: encodeURIComponent(onlyASCIITitle) };
	}

	return { raw, sanitized: encodeURIComponent(lowerCaseTitle) };
};
