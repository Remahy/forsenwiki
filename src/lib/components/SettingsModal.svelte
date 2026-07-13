<script>
	import { modal } from '$lib/stores/modal';
	import { page } from '$app/state';

	let streamerMode = $state(page.data.userSettings?.streamerMode ?? false);

	/**
	 * @param {boolean} enabled
	 */

	async function saveStreamerMode(enabled) {
		const response = await fetch('/api/user/settings', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ streamerMode: enabled }),
		});

		if (!response.ok) {
			console.error('Failed to save user settings');
		} else {
			window.location.reload();
		}
	}

	const close = () => {
		$modal.isOpen = false;
	};
</script>

<div class="modal-color pointer-events-auto w-full max-w-md p-6 shadow-sm">
	<div class="box-heading-wrapper mb-5 flex items-center justify-between">
		<div>
			<h2 class="text-lg font-semibold">Settings</h2>
			<p class="mt-1 text-sm text-slate-500 dark:text-slate-400">Customize your experience</p>
		</div>

		<button
			class="rounded-sm p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100"
			onclick={close}
			aria-label="Close settings"
		>
			✕
		</button>
	</div>

	<div
		class="rounded-sm border border-slate-300 bg-slate-100/80 p-4 dark:border-slate-800 dark:bg-slate-900/60"
	>
		<label class="flex items-center justify-between gap-3">
			<div>
				<span class="block text-sm font-medium text-slate-700 dark:text-slate-200"
					>Streamer mode</span
				>
				<span class="mt-1 block text-xs text-slate-500 dark:text-slate-400">
					Hide sensitive content while streaming
				</span>
			</div>

			<input
				type="checkbox"
				class="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
				bind:checked={streamerMode}
				onchange={() => saveStreamerMode(streamerMode)}
			/>
		</label>
	</div>
</div>
