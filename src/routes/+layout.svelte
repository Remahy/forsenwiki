<script>
	import { setContext } from 'svelte';
	import { writable } from 'svelte/store';
	import { page } from '$app/stores';

	import Modal from '$lib/components/Modal.svelte';
	import UploadModal from '$lib/components/UploadModal.svelte';
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';

	import '../app.css';

	let streamerMode = $state($page.data.session?.user?.userSettings?.streamerMode);

	/**
	 * @typedef {Object} Props
	 * @property {import('svelte').Snippet} [children]
	 */

	/** @type {Props} */
	let { children } = $props();

	// These are basically our global frontend variables.
	/** @type {ComposerWritable} */
	setContext('COMPOSER', writable(null));
	setContext('YDOCPERSISTENCE', writable(null));
	setContext('YDOC', writable(null));
</script>

<div class="app flex min-h-screen flex-col" class:streamer-mode={streamerMode}>
	<Header />

	{@render children?.()}

	<Footer />
</div>

<Modal />
<UploadModal />
