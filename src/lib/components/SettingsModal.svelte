<script>
	import { XIcon } from '@lucide/svelte';
	import { page } from '$app/state';
	import { modal } from '$lib/stores/modal';
	import { saveUserSettings } from '$lib/api/usersettings';
	import Button from './Button.svelte';

	let streamerMode = $state(page.data.session?.user?.userSettings?.streamerMode);
	let loading = $state(false);

	/**
	 * @param {boolean} [streamerMode]
	 */
	async function saveStreamerMode(streamerMode) {
		loading = true;

		const response = await saveUserSettings({ streamerMode });

		if (!response.ok) {
			console.error('Failed to save user settings');
			loading = false;
		} else {
			window.location.reload();
		}
	}

	const cancel = () => {
		$modal.isOpen = false;
	};
</script>

<div class="modal-color pointer-events-auto relative p-0">
	<header class="forsen-wiki-theme-border flex items-center justify-between border-b p-6">
		<h1 class="text-xl font-semibold lg:text-2xl">User settings</h1>
		<Button
			disabled={loading}
			class="ml-auto inline-flex items-center rounded-lg"
			on:click={cancel}
		>
			<XIcon />
		</Button>
	</header>

	<main class="forsen-wiki-theme-border flex flex-col gap-16 overflow-hidden border-b p-6">
		<label class="flex items-baseline gap-2">
			<input
				type="checkbox"
				name="type"
				bind:checked={streamerMode}
				disabled={loading}
				onchange={() => saveStreamerMode(streamerMode)}
			/>
			<span>Streamer mode</span>
		</label>
	</main>
</div>
