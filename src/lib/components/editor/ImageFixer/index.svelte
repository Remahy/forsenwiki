<script>
	import { getEditor } from 'svelte-lexical';
	import Button from '$lib/components/Button.svelte';
	import { modal } from '$lib/stores/modal';
	import ImageFixerModal from './ImageFixerModal.svelte';

	let editor = $derived(getEditor?.());

	const handleOnClick = () => {
		modal.set({
			isOpen: true,
			component: ImageFixerModal,
			editor,
		});
	};
</script>

{#if editor}
	<Button onclick={handleOnClick}>View local draft images</Button>
{/if}
