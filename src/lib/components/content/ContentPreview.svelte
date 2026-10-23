<script>
	// @ts-nocheck

	import { STATIC_DOMAIN } from '$lib/environment/environment';
	import { getImageCacheURL } from '$lib/utils/getImageCacheURL';
	import AudioPreview from './AudioPreview.svelte';
	import DocumentPreview from './DocumentPreview.svelte';
	import ImagePreview from './ImagePreview.svelte';
	import VideoPreview from './VideoPreview.svelte';

	/**
	 * @typedef {import('../../../routes/api/search/+server').QueryResult} QueryResult
	 */

	/**
	 * @type {QueryResult}
	 */
	const self = $props();

	const PreviewComponents = {
		image: {
			component: ImagePreview,
			/**
			 * @param {QueryResult} props
			 */
			props: (props) => ({ src: getImageCacheURL(props.title).toString(), name: props.rawTitle }),
		},
		video: {
			component: VideoPreview,
			/**
			 * @param {QueryResult} props
			 */
			props: (props) => ({
				src: `${STATIC_DOMAIN}/${props.title}`,
				contentType: props.contentType,
			}),
		},
		audio: {
			component: AudioPreview,
			/**
			 * @param {QueryResult} props
			 */
			props: (props) => ({
				src: `${STATIC_DOMAIN}/${props.title}`,
			}),
		},
		document: {
			component: DocumentPreview,
			/**
			 * @param {QueryResult} props
			 */
			props: (props) => ({
				src: `${STATIC_DOMAIN}/${props.title}`,
				name: props.rawTitle,
			}),
		},
	};

	const SvelteComponent = $derived(self.fileType && PreviewComponents[self.fileType].component);
	const SvelteComponentProps = $derived(
		self.fileType && PreviewComponents[self.fileType].props(self)
	);
</script>

{#if SvelteComponent && SvelteComponentProps}
	<SvelteComponent {...SvelteComponentProps} />
{:else}
	<span>No preview available.</span>
{/if}
