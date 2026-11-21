export const CONTENT_IN_USE = 'CONTENT_IN_USE';
export const CONTENT_PROTECTED = 'CONTENT_PROTECTED';

export const LINK_CONTENT_TYPE = 'link';

/** Upload hashes are bare hex, so a link's hash can never be one. */
export const LINK_HASH_PREFIX = 'link:';

/** How long an upload has to reach storage before its row is cleaned up. */
export const UPLOAD_WINDOW_HOURS = 24;
