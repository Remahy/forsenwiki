/**
 * @param {Blob} blob
 */
export async function calculateChecksumSha256(blob) {
	const uint8Array = new Uint8Array(await blob.arrayBuffer());
	const hashBuffer = await crypto.subtle.digest('SHA-256', uint8Array);
	const hashArray = Array.from(new Uint8Array(hashBuffer));

	return hashArray.map((h) => h.toString(16).padStart(2, '0')).join('');
}
