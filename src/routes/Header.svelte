<script>
	// Built-in thingie "$app/stores"
	// import { page } from '$app/stores';

	import Logo from '$lib/components/Logo.svelte';
</script>

<header class="bg-stone-100">
	<div class="container mx-auto flex">
		<a href="/" class="hover:text-stone-500">
			<div class="flex items-end gap-2 pl-12 py-4 lg:pl-0">
				<Logo width="64" height="64" />
				<div class="flex flex-col justify-end">
					<small>Community</small>
					<h1 class="font-semibold leading-none">Forsen<br />Wiki</h1>
				</div>
			</div>
		</a>
	</div>
</header>
