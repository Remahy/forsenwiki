<script>
	import License from '$lib/components/License.svelte';
	import Link from '$lib/components/Link.svelte';
</script>

<footer class="bg-purple-950 text-white dark:bg-violet-950 dark:bg-opacity-30 dark:text-[unset]">
	<div
		class="container mx-auto flex w-full flex-wrap items-stretch justify-between gap-8 gap-y-8 p-8 lg:p-0 lg:py-12"
	>
		<div class="flex h-full flex-col justify-end gap-2 overflow-hidden">
			<License />

			<div class="text-purple-800" aria-hidden="true">⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿</div>

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

		<div class="flex h-full flex-col justify-end gap-2 overflow-hidden">
			<p>forsen.wiki v0.0.1 (Alpha)</p>

			<div class="text-purple-800" aria-hidden="true">⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿</div>

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
	</div>
</footer>
