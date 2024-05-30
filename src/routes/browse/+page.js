export const load = async ({ url, fetch }) => {
	const rawCursor = url.searchParams.get('cursor') || '';

	/** @type {Array<{ id: string, title: string, rawTitle: string, createdTimestamp: string, lastUpdates: string }>} */
	const res = await (await fetch(`/api/browse?cursor=${rawCursor}`)).json();

	return { results: res };
};
