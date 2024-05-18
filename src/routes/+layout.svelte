<script>
	import { setContext } from 'svelte';
	import { writable } from 'svelte/store';

	import Modal from '$lib/components/modal.svelte';
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';

	import '../app.pcss';

	/** @type {ComposerWritable} */
	setContext('COMPOSER', writable(null));
	setContext('YDOCPERSISTENCE', writable(null));
	setContext('YDOC', writable(null));
</script>

<div class="app flex min-h-screen flex-col">
	<Header />

	<slot></slot>

	<Footer />
</div>

<Modal />
