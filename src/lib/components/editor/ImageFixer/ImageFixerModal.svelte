<script>
	import { onMount } from 'svelte';
	import { $nodesOfType as nodesOfType, mergeRegister } from 'lexical';
	import { XIcon } from '@lucide/svelte';
	import Button from '$lib/components/Button.svelte';
	import { modal } from '$lib/stores/modal';
	import { loadContent, saveContent } from '$lib/utils/indexedDb/content';
	import Spinner from '$lib/components/Spinner.svelte';
	import { ImageNode } from '$lib/lexical/custom';
	import { editorGlobals } from '../editorGlobals.svelte';
	import { getUniqueImageHashes } from '../utils/getImages';

	const id = $derived(editorGlobals.articleId);

	/**
	 * @type {{ editor: LexicalEditor }}
	 */
	const { editor } = $props();

	/**
	 * @type {string[]}
	 */
	let imageHashes = $state([]);

	const images = $derived.by(async () => {
		let res = [];

		for (let index = 0; index < imageHashes.length; index++) {
			const hash = imageHashes[index];
			res.push(loadContent(id, hash));
		}

		const promiseRes = await Promise.all(res);

		return promiseRes.filter(Boolean);
	});

	const cancel = () => {
		$modal.isOpen = false;
	};

	/**
	 * @type {NodeJS.Timeout | undefined}
	 */
	let timer;

	/**
	 * @param {any} image
	 * @param {Event & { currentTarget: EventTarget & HTMLInputElement }} e
	 */
	const handleNameInput = (image, e) => {
		clearTimeout(timer);

		if (!image) {
			return;
		}

		if (!e.target) {
			return;
		}

		/** @type {{ value: string }}*/
		const { value } = /**@type {any}*/ (e.target);

		timer = setTimeout(async () => {
			const newFile = new File([image.file], value || 'Uploaded image', {
				type: image.file.type,
			});
			(async () => {
				await saveContent(id, image.hash, newFile);
			})();
		}, 500);
	};

	/**
	 * @param {{ hash: string, file: { name: string } }} image
	 */
	const handleImageDelete = (image) => {
		const ok = confirm(`Are you sure you want to delete image "${image.file.name}"?`);

		if (!ok) {
			return;
		}

		editor.update(() => {
			const images = nodesOfType(ImageNode);
			if (!images.length) {
				return;
			}

			for (let index = 0; index < images.length; index++) {
				const node = images[index];

				const src = node.getSrc();

				if (src === image.hash) {
					node.remove();
				}
			}
		});
	};

	onMount(() => {
		imageHashes = getUniqueImageHashes(editor);

		return mergeRegister(
			editor.registerUpdateListener(() => {
				imageHashes = getUniqueImageHashes(editor);
			})
		);
	});
</script>

<div class="modal-color pointer-events-auto relative p-0">
	<header class="forsen-wiki-theme-border flex items-center justify-between border-b p-6">
		<h1 class="text-xl font-semibold lg:text-2xl">Images for upload</h1>
		<Button class="ml-auto inline-flex items-center rounded-lg" on:click={cancel}>
			<XIcon />
		</Button>
	</header>

	<main class="forsen-wiki-theme-border flex flex-col gap-16 border-b p-6">
		{#await images}
			<Spinner />
		{:then imageResult}
			{#each imageResult as image (image.hash)}
				<div class="">
					<figure
						class="forsen-wiki-theme-border bg-dark mx-auto flex min-h-50 min-w-50 items-center justify-center border"
					>
						<img src={image.url} alt="" class="max-h-100" />
					</figure>

					<label class="flex flex-col gap-2">
						<div>
							<strong>File name</strong>
							<small class={image.file.name.length > 80 ? 'font-bold text-red-500' : ''}
								>Max length 80 characters</small
							>
						</div>
						<input
							class="input-color rounded-sm p-2"
							oninput={(e) => handleNameInput(image, e)}
							maxlength="80"
							value={image.file.name}
						/>
					</label>
					<Button
						class="bg-transparent! p-0! text-red-500!"
						onclick={() => handleImageDelete(image)}
					>
						<span>Delete "{image.file.name}"</span>
					</Button>
				</div>
			{:else}
				<span>None! c v paste some images!</span>
			{/each}
		{/await}
	</main>
</div>
