<script>
	import { modal } from '$lib/stores/modal';
	import { browser } from '$app/environment';

	function closeModal() {
		$modal.isOpen = false;
	}

	modal.subscribe((modal) => {
		if (!browser || !modal) {
			return;
		}

		if (modal.isOpen) {
			document.body.classList.add('overflow-hidden');
		} else {
			document.body.classList.remove('overflow-hidden');
		}
	});
</script>

{#if $modal && $modal.isOpen}
	<div class="fixed inset-0 z-50 flex items-center overflow-y-auto">
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<div class="fixed inset-0 bg-black bg-opacity-50 duration-300" on:click|self={closeModal} />
		<div
			role="dialog"
			aria-modal="true"
			class="pointer-events-none relative inset-0 z-[2] m-auto w-full max-w-2xl overflow-hidden opacity-100 shadow-2xl"
		>
			<svelte:component this={$modal.component} {...$modal} />
		</div>
	</div>
{/if}
