<script>
	import { getType } from '$lib/s3/limits';
	import { uploadModal } from '$lib/stores/modal';
	import Button from './Button.svelte';
	import AudioPreview from './content/AudioPreview.svelte';
	import ImagePreview from './content/ImagePreview.svelte';
	import VideoPreview from './content/VideoPreview.svelte';
	import LinkButton from './LinkButton.svelte';
	import Spinner from './Spinner.svelte';
	import { uploadingContentModalGlobals } from './uploadingContentModalGlobals.svelte';

	let { uploading = { count: 0 }, uploaded = [] } = uploadingContentModalGlobals;

	const cancel = () => {
		$uploadModal.isOpen = false;
	};
</script>

<div class="modal-color pointer-events-auto relative p-0">
	<header class="forsen-wiki-theme-border flex items-center justify-between border-b p-6">
		<h1 class="text-xl font-semibold lg:text-2xl">Uploading content</h1>
	</header>

	<main class="forsen-wiki-theme-border flex flex-col gap-16 overflow-hidden border-b p-6">
		{#if uploading.count > 0}
			<div>
				<p>Uploading {uploading.count} files...</p>
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
						{@const type = getType(upload.contentType)}
						<div
							class="forsen-wiki-theme-border bg-dark flex w-fit flex-col gap-2 overflow-hidden rounded border"
						>
							{#if type === 'image'}
								<ImagePreview src={upload.url} name="" className="max-h-32 w-auto! max-w-32!" />
							{:else if type === 'audio'}
								<AudioPreview src={upload.url} />
							{:else if type === 'video'}
								<VideoPreview contentType={upload.contentType} src={upload.url} />
							{:else if type === 'document'}
								<span>Document {upload.url}</span>
							{/if}
							<LinkButton href="/content/{upload.id}" target="_blank" class="self-start"
								>View</LinkButton
							>
						</div>
					{/each}
				</div>
			{/if}
		{:else}
			<div class="self-center"><Spinner /></div>
		{/if}
	</main>

	{#if uploading.count > 0}
		<footer class="flex items-center justify-end gap-2 p-6">
			<Button on:click={cancel} disabled={uploaded.length < uploading.count}>OK</Button>
		</footer>
	{/if}
</div>
