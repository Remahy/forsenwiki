<script>
	import { uploadModal } from '$lib/stores/modal';
	import { browser } from '$app/environment';

	uploadModal.subscribe((modal) => {
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

{#if $uploadModal && $uploadModal.isOpen}
	{@const SvelteComponent = $uploadModal.component}
	<div class="fixed inset-0 z-50 flex items-center overflow-y-auto">
		<div class="modal-bg-transparent fixed inset-0 duration-300"></div>
		<div
			role="dialog"
			aria-modal="true"
			class="
				pointer-events-none relative inset-0 z-2 m-auto w-full max-w-2xl
				overflow-hidden opacity-100 shadow-2xl
			"
		>
			<SvelteComponent {...$uploadModal} />
		</div>
	</div>
{/if}
