<script>
	import { ListTreeIcon } from '@lucide/svelte';
	import { editorModal } from '$lib/stores/modal';
	import TreeviewModal from './TreeviewModal.svelte';
	import EditorButton from '../toolbar/EditorButton.svelte';

	const handleOpenTreeviewModal = () => {
		editorModal.set({
			isOpen: true,
			component: TreeviewModal,
		});
	};
</script>

<EditorButton title="Treeview" class="p-0!" onclick={handleOpenTreeviewModal}>
	<ListTreeIcon size="16" />
</EditorButton>
