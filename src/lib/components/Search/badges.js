import { AudioLinesIcon, FileTextIcon, ImageIcon, VideoIcon } from '@lucide/svelte';

export const SEARCH_TYPE_BADGES = {
	article: { label: 'Article', color: 'bg-black/10 dark:bg-black' },
	content: { label: 'Content', color: 'bg-violet-500/25' },
};

/** @satisfies {Record<keyof typeof import('$lib/s3/limits').mimetypes, { label: string, icon: typeof ImageIcon }>} */
export const CONTENT_TYPE_BADGES = {
	image: { label: 'Image', icon: ImageIcon },
	video: { label: 'Video', icon: VideoIcon },
	audio: { label: 'Audio', icon: AudioLinesIcon },
	document: { label: 'Document', icon: FileTextIcon },
};
