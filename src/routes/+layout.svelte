<script>
	import { setContext } from 'svelte';
	import { writable } from 'svelte/store';

	import Modal from '$lib/components/modal.svelte';

	import '../app.pcss';
	import Header from './Header.svelte';
	import Footer from './Footer.svelte';

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
