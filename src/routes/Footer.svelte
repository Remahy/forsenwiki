<script>
	import License from '$lib/components/License.svelte';
	import GitHub from '$lib/components/icons/GitHub.svelte';
	import TwitchGlitch from '$lib/components/icons/TwitchGlitch.svelte';
</script>

<footer class="flex w-full items-stretch justify-between gap-2 bg-fuchsia-950 p-4 py-8 text-white">
	<div class="flex flex-col justify-end gap-2 h-full">
		<License />
		<hr class="h-0.5 rounded border-0 bg-fuchsia-900" />
		<ul class="flex flex-col gap-2 font-semibold">
			<li>
				<a href="/terms" class="flex gap-2 underline underline-offset-2">Terms & Conditions</a>
			</li>
			<li>
				<a href="/privacy" class="flex gap-2 underline underline-offset-2">Privacy Policy</a>
			</li>
		</ul>
	</div>
	<div class="flex flex-col justify-end gap-2 h-full">
		<p>forsen.wiki Version 0.0.1</p>
		<hr class="h-0.5 rounded border-0 bg-fuchsia-900" />
		<ul class="flex flex-col gap-2 font-semibold">
			<li>
				<a
					href="https://github.com/Remahy/forsenwiki"
					target="github.com/remahy/forsenwiki"
					class="flex gap-2 underline underline-offset-2"
					><GitHub size="21" color="white" />GitHub</a
				>
			</li>
			<li>
				<a
					href="https://www.twitch.tv/forsen"
					target="twitch.tv/forsen"
					class="flex gap-2 underline underline-offset-2"
				>
					<TwitchGlitch size="21" />Twitch
				</a>
			</li>
		</ul>
	</div>
</footer>
