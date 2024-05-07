<script>
	import '../app.pcss';
	import Header from './Header.svelte';
	import Footer from './Footer.svelte';
</script>

<div class="app flex min-h-screen flex-col">
	<Header />

	<slot></slot>

	<Footer />
</div>
