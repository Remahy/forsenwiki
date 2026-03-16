<script>
	import Spinner from './Spinner.svelte';
	import { uploadContentModalGlobals } from './uploadContentModalGlobals.svelte';

	let { uploading = { count: 0 }, uploaded = [] } = uploadContentModalGlobals;

	$effect(() => console.log(uploading, uploaded));
</script>

<div class="modal-color pointer-events-auto relative p-0">
	<header class="forsen-wiki-theme-border flex items-center justify-between border-b p-6">
		<h1 class="text-xl font-semibold lg:text-2xl">Uploading article content</h1>
	</header>

	<main class="forsen-wiki-theme-border flex flex-col gap-16 overflow-hidden border-b p-6">
		{#if uploading.count > 0}
			<div>
				<p>Uploading {uploading} files...</p>
				<progress
					class="w-full [&::-moz-progress-bar]:bg-blue-400 [&::-webkit-progress-bar]:rounded-lg [&::-webkit-progress-bar]:bg-slate-300 [&::-webkit-progress-value]:rounded-lg [&::-webkit-progress-value]:bg-blue-400"
					value={uploaded.length}
					max={uploading.count}
				></progress>
				<p>{uploaded.length}/{uploading.count}</p>
			</div>

			{#if uploaded.length}
				<div class="flex flex-wrap justify-between gap-8">
					{#each uploaded as upload (upload.url)}
						<div
							class="forsen-wiki-theme-border bg-dark w-fit overflow-hidden rounded-4xl border p-4"
						>
							<img class="max-h-32 min-h-32 w-auto" src={upload.url} alt="" />
						</div>
					{/each}
				</div>
			{/if}
		{:else}
			<div class="self-center"><Spinner /></div>
		{/if}
	</main>
</div>
