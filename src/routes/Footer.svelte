<script>
	import License from '$lib/components/License.svelte';
	import Link from '$lib/components/Link.svelte';
	import GitHub from '$lib/components/icons/GitHub.svelte';
	import TwitchGlitch from '$lib/components/icons/TwitchGlitch.svelte';
</script>

<footer class="bg-purple-950 text-white">
	<div
		class="container mx-auto flex w-full flex-wrap items-stretch justify-between gap-8 gap-y-8 p-12 lg:p-0 lg:py-12"
	>
		<div class="flex h-full flex-col justify-end gap-2 overflow-hidden">
			<License />
			<div class="text-purple-800">⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿</div>
			<ul class="flex flex-col gap-2 font-semibold">
				<li>
					<Link href="/terms"><span class="grow">Terms & Conditions</span></Link>
				</li>
				<li>
					<Link href="/privacy"><span class="grow">Privacy Policy</span></Link>
				</li>
			</ul>
		</div>

		<div class="flex h-full flex-col justify-end gap-2 overflow-hidden">
			<p>forsen.wiki Version 0.0.1</p>
			<div class="text-purple-800">⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿</div>
			<ul class="flex flex-col gap-2 font-semibold">
				<li>
					<Link href="https://github.com/Remahy/forsenwiki" target="github.com/remahy/forsenwiki">
						<GitHub size="18" color="white" /> <span class="grow">GitHub</span>
					</Link>
				</li>
				<li>
					<Link href="https://www.twitch.tv/forsen" target="twitch.tv/forsen">
						<TwitchGlitch size="18" /> <span class="grow">Twitch</span>
					</Link>
				</li>
			</ul>
		</div>
	</div>
</footer>
