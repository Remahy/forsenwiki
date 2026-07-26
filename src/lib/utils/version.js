import rawVersion from '$lib/version.txt?raw';

const version = rawVersion.trim().replace(/[\n]+/g, '-').replace(/ /g, '-');

export { version };
