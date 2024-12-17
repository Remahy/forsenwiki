<script>
	import License from '$lib/components/License.svelte';
	import Link from '$lib/components/Link.svelte';
</script>

<footer class="footer">
	<div class="container mx-auto w-full items-stretch gap-8 gap-y-8 p-4 lg:flex lg:py-12">
		<div class="bg-dark flex-1 grow overflow-hidden rounded p-4">
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

		<div class="bg-dark mt-2 flex-1 grow overflow-hidden rounded p-4 text-right lg:mt-0">
			<p>forsen.wiki 1.0.0-beta.5</p>

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
	</div>
</footer>
