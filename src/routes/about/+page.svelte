<script>
	import { AtSignIcon } from 'lucide-svelte';
	import { resolve } from '$app/paths';
	import GitHub from '$lib/components/icons/GitHub.svelte';
	import TwitchGlitch from '$lib/components/icons/TwitchGlitch.svelte';
	import Discord from '$lib/components/icons/Discord.svelte';
</script>

<svelte:head>
	<title>About forsen.wiki</title>
	<meta name="description" content="Learn about the forsen... Wiki." />
</svelte:head>

<div class="container mx-auto p-8 lg:py-12">
	<section class="prose prose-lg dark:prose-invert w-full max-w-[unset]">
		<h1>About</h1>
		<p>
			Forsen related wiki. Forsen mixes, news, big plays, tilts. Everything that is somewhat related
			to forsen.
		</p>

		<h2>Changelogs</h2>
		<p>
			<a href={resolve("/changelogs")} rel="changelogs">View Changelogs.</a>
		</p>

		<h2>THIRD PARTY LICENSES</h2>
		<p>
			This wiki uses <a href="https://github.com/org-ppsl" target="github-org-ppsl">PPSL</a> code.
			PPSL code is licensed under
			<a
				href="https://github.com/ORG-PPSL/ppsl-cd-api?tab=AGPL-3.0-1-ov-file#readme"
				target="ppsl-code-license">GNU AFFERO GENERAL PUBLIC LICENSE Version 3</a
			>.
		</p>
		<br />
		<p><a href="/THIRD-PARTY-LICENSES.txt">Full THIRD-PARTY-LICENSES available here.</a></p>

		<h2>Links</h2>
		<ul>
			<li>
				<a
					href="https://discord.gg/ht5TqyEABp"
					target="discord.gg/kappawiki"
					class="flex items-center gap-2"
				>
					<Discord size="18" /> <span>Discord - KappaWiki</span></a
				>
			</li>
			<li>
				<a
					href="https://www.twitch.tv/forsenwiki"
					target="twitch.tv/forsenwiki"
					class="flex items-center gap-2"
				>
					<TwitchGlitch size="18" /> <span>Twitch - ForsenWiki</span></a
				>
			</li>
			<li>
				<a
					href="https://github.com/Remahy/forsenwiki"
					target="github.com/remahy/forsenwiki"
					class="flex items-center gap-2"
				>
					<GitHub size="18" />
					<span class="grow">GitHub - Remahy/forsenwiki</span>
				</a>
			</li>
		</ul>
		<p>
			<strong>Contact email:</strong> info<AtSignIcon class="inline" />forsen.wiki
		</p>

		<h2>Privacy policy</h2>
		<p>
			<a href={resolve("/privacy")} rel="privacy-policy">View Privacy Policy.</a>
		</p>

		<h2>Terms of Service</h2>
		<p>
			<a href={resolve("/terms")} rel="terms-of-service">View Terms of Service.</a>
		</p>
	</section>
</div>
