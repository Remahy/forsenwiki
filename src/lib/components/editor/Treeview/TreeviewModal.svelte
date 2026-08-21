<script>
	import { XIcon } from '@lucide/svelte';
	import { editorModal } from '$lib/stores/modal';
	import Button from '$lib/components/Button.svelte';
	import TreeviewWrapper from '../toolbar/TreeviewWrapper.svelte';
	import { treeviewState } from './treeviewState.svelte';
	import { expandParents } from './utils';

	const cancel = () => {
		$editorModal.isOpen = false;
	};

	$effect(() => {
		if (!treeviewState.tree) {
			return;
		}

		const treeviewElement = treeviewState.tree.getElement();

		const selectedItems = treeviewState.tree.getSelectedItems();

		if (selectedItems.length === 1) {
			const item = selectedItems[0];
			expandParents(treeviewState.tree, item);

			if (!treeviewElement) {
				return;
			}

			requestAnimationFrame(() => {
				const id = item.getId();

				/** @type {HTMLDivElement | undefined | null} */
				const element = treeviewElement.querySelector(`[data-id="${id}"]`);

				if (element) {
					treeviewElement.scrollTo({
						top: element.offsetTop - treeviewElement.offsetTop,
					});
				}
			});
		}
	});
</script>

<div class="modal-color pointer-events-auto relative p-0">
	<header class="forsen-wiki-theme-border flex items-center justify-between border-b p-6">
		<h1 class="text-xl font-semibold lg:text-2xl">Treeview</h1>
		<Button class="ml-auto inline-flex items-center rounded-lg" on:click={cancel}>
			<XIcon />
		</Button>
	</header>

	<main
		class="forsen-wiki-theme-border flex max-h-screen grow flex-col gap-4 overflow-hidden border-b"
	>
		<TreeviewWrapper />
	</main>
</div>
