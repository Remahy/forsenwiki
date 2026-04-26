<script>
	import { ScaleIcon, XIcon } from '@lucide/svelte';
	import { resolve } from '$app/paths';
	import Button from './Button.svelte';
	import Box from './Box.svelte';

	const hasSeenPrivacyUpdateNotice = globalThis?.localStorage
		? localStorage.getItem('privacy-update-march-2025')
		: true;
</script>

{#if !hasSeenPrivacyUpdateNotice}
	<Box class="rounded-none! bg-yellow-900/20! dark:bg-yellow-300/10!">
		<div class="container mx-auto flex items-center gap-4 p-4">
			<ScaleIcon class="hidden size-8 lg:block" />
			<div class="grow">
				<a href={resolve('/privacy')}>
					<p>
						(March 2026) Privacy policy has been updated. Please take a moment to read it before its
						effective date <strong>April 12</strong>.
					</p>

					<p>
						<strong>Changes:</strong>
						<span>Removed section about Wsrv caching.</span>
						<span
							>Modified Cloudflare section to mention that it now acts as our host and cache for
							user uploaded content.</span
						>
						<span
							>Removed mention of notifying users of privacy policy changes via email, we don't have
							any user emails.</span
						>
					</p>
				</a>
			</div>

			<Button
				class="p-0!"
				on:click={() => {
					localStorage.setItem('privacy-update-march-2025', 'true');
					window.location.reload();
				}}
			>
				<XIcon class="inline min-w-4 py-1" />
			</Button>
		</div>
	</Box>
{/if}
