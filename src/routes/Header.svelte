<script>
	// Built-in thingie "$app/stores"
	// import { page } from '$app/stores';

	import Logo from '$lib/components/Logo.svelte';
</script>

<header>
	<a href="/" class="hover:text-stone-500">
		<div class="flex items-end gap-2 p-4 bg-stone-100">
			<Logo width="64" height="64" />
			<h1 class="font-semibold">Forsen<br />Wiki</h1>
		</div>
	</a>
</header>
