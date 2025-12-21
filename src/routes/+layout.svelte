<script>
	import { setContext } from 'svelte';
	import { writable } from 'svelte/store';

	import Modal from '$lib/components/modal.svelte';
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';

	import '../app.css';

	/**
	 * @typedef {Object} Props
	 * @property {import('svelte').Snippet} [children]
	 */

	/** @type {Props} */
	let { children } = $props();

	/** @type {ComposerWritable} */
	setContext('COMPOSER', writable(null));
	setContext('YDOCPERSISTENCE', writable(null));
	setContext('YDOC', writable(null));
</script>

<div class="app flex min-h-screen flex-col">
	<Header />

	{@render children?.()}

	<Footer />
</div>

<Modal />
