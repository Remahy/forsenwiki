<script>
	import '../app.pcss';
	import Header from './Header.svelte';
	import Footer from './Footer.svelte';
</script>

<div class="app flex flex-col min-h-screen">
	<Header />

	<main class="flex grow w-full">
		<slot></slot>
	</main>

  <Footer />
</div>
