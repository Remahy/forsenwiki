<script>
	import { self } from 'svelte/legacy';

	import { modal } from '$lib/stores/modal';
	import { browser } from '$app/environment';

	const closeModal = () => {
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
	{@const SvelteComponent = $modal.component}
	<div class="fixed inset-0 z-50 flex items-center overflow-y-auto">
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div class="modal-bg-transparent fixed inset-0 duration-300" onclick={self(closeModal)}></div>
		<div
			role="dialog"
			aria-modal="true"
			class="pointer-events-none relative inset-0 z-[2] m-auto w-full max-w-2xl overflow-hidden opacity-100 shadow-2xl"
		>
			<SvelteComponent {...$modal} />
		</div>
	</div>
{/if}
