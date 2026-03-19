<script>
	import License from '$lib/components/License.svelte';
	import Link from '$lib/components/Link.svelte';
	import { version } from '$lib/utils/version';
	import Discord from './icons/Discord.svelte';
	import GitHub from './icons/GitHub.svelte';
	import TwitchGlitch from './icons/TwitchGlitch.svelte';
</script>

<footer class="footer">
	<div class="container mx-auto w-full items-stretch gap-2 gap-y-8 p-4 lg:flex lg:py-12">
		<div class="bg-dark flex-1 grow overflow-hidden rounded-sm p-4">
			<License />

			<div class="decoration-text-color" aria-hidden="true">⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿</div>

			<ul class="flex flex-col gap-2 font-semibold">
				<li>
					<Link href="/terms"><span class="grow">Terms & Conditions</span></Link>
				</li>

				<li>
					<Link href="/privacy"><span class="grow">Privacy Policy</span></Link>
				</li>

				<li>
					<Link href="/dmca">
						<span class="grow">DMCA</span>
					</Link>
				</li>
			</ul>
		</div>

		<div class="bg-dark mt-2 flex-1 grow overflow-hidden rounded-sm p-4 text-right lg:mt-0">
			<p>forsen.wiki - {version}</p>

			<div class="decoration-text-color" aria-hidden="true">⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿</div>

			<ul class="flex flex-col gap-2 font-semibold">
				<li class="font-normal">Not associated with Twitch.tv and/or Amazon</li>
				<li class="font-normal">or forsen. This is run by the community.</li>

				<li>
					<Link href="/about">
						<span class="grow">About</span>
					</Link>
				</li>
			</ul>
		</div>

		<div class="bg-dark mt-2 flex flex-col justify-evenly gap-2 rounded-sm p-4 lg:mt-0 lg:gap-0">
			<a
				href="https://discord.gg/yp7ST3BDYt"
				target="discord.gg"
				title="Join The Fors Emotebank Discord."
				class="flex items-center gap-4 text-xs"
			>
				<Discord size="16" /> <span class="lg:hidden">Join The Fors Emotebank Discord.</span>
			</a>
			<a
				href="https://www.twitch.tv/spectatorsen"
				target="_blank"
				title="Watch the Spectatorsen Twitch."
				class="flex items-center gap-4 text-xs"
			>
				<TwitchGlitch size="16" /> <span class="lg:hidden">Watch the Spectatorsen Twitch.</span>
			</a>
			<a
				href="https://www.github.com/Remahy/forsenwiki"
				target="_blank"
				title="Read the source code."
				class="flex items-center gap-4 text-xs"
			>
				<GitHub size="16" /> <span class="lg:hidden">Read the source code.</span>
			</a>
		</div>
	</div>
</footer>
