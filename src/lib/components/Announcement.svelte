<script>
	import { ScaleIcon, XIcon } from 'lucide-svelte';
	import Button from './Button.svelte';
	import Box from './Box.svelte';
	// import Link from './Link.svelte';

	// const hasSeenPrivacyUpdateNotice = globalThis?.localStorage
	// 	? localStorage.getItem('privacy-update-june-3-2024')
	// 	: true;
</script>

<!--
	{#if !hasSeenPrivacyUpdateNotice}
		<Box class="!rounded-none !bg-yellow-900/20 dark:!bg-yellow-300/20">
			<div class="container mx-auto flex items-center gap-4 p-4">
				<ScaleIcon class="hidden h-8 w-8 lg:block" />
				<div class="grow">
					<p>
						<a href="/privacy"
							>(June 3) Privacy policy has been updated. Please take a moment to read it.</a
						>
					</p>

					<p>
						<strong>Changes:</strong> Removed section about tracking cookies, added section about collecting
						statistics on an ongoing basis. Clarified purpose of Cloudflare.
					</p>
				</div>

				<Button
					class="m-auto"
					on:click={() => {
						localStorage.setItem('privacy-update-june-3-2024', 'true');
						window.location.reload();
					}}
				>
					<span class="hidden lg:inline">Close</span>
					<XIcon class="inline lg:hidden" />
				</Button>
			</div>
		</Box>
{/if}
-->
