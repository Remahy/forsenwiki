<script>
	import { XIcon } from '@lucide/svelte';
	import { modal } from '$lib/stores/modal';
	import Button from '../Button.svelte';
	import UploadContent from './UploadContent.svelte';
	import {
		uploadContentState,
		handleUploadContentSubmit,
		resetUploadContentState,
	} from './uploadContent.svelte';

	const cancel = () => {
		$modal.isOpen = false;
		resetUploadContentState();
	};
</script>

<div class="modal-color pointer-events-auto relative p-0">
	<header class="forsen-wiki-theme-border flex items-center justify-between border-b p-6">
		<h1 class="text-xl font-semibold lg:text-2xl">Upload content</h1>
		<Button class="ml-auto inline-flex items-center rounded-lg" on:click={cancel}>
			<XIcon />
		</Button>
	</header>

	<main class="forsen-wiki-theme-border flex flex-col gap-16 overflow-hidden border-b p-6">
		<UploadContent />
	</main>

	<footer class="flex items-center justify-end gap-2 p-6">
		<Button on:click={cancel} disabled={uploadContentState.isLoading}>Cancel</Button>
		<Button
			on:click={handleUploadContentSubmit}
			disabled={!uploadContentState.content.length || uploadContentState.isLoading}>Upload</Button
		>
	</footer>
</div>
