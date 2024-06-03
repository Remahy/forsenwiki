<script>
	import { AtSignIcon } from 'lucide-svelte';
	import GitHub from '$lib/components/icons/GitHub.svelte';
	import TwitchGlitch from '$lib/components/icons/TwitchGlitch.svelte';
</script>

<svelte:head>
	<title>About forsen.wiki</title>
	<meta name="description" content="Learn about the forsen... Wiki." />
</svelte:head>

<div class="container mx-auto p-4 lg:p-0 lg:py-12">
	<section class="prose prose-lg w-full max-w-[unset] dark:prose-invert">
		<h1>About</h1>

		<p>
			Forsen related wiki. Forsen mixes, news, big plays, tilts. Everything that is somewhat related
			to forsen.
		</p>

		<h3>ForsenWiki tech stack</h3>

		<ul>
			<li>sveltekit</li>
			<li>authjs</li>
			<li>prisma</li>
			<li>@facebook/lexical (svelte-lexical)</li>
			<li>yjs</li>
			<li>some kind of god of war diff lib (tbd)</li>
		</ul>

		<p>
			This wiki uses <a href="https://github.com/org-ppsl" target="github-org-ppsl">PPSL</a> code.
			PPSL code is licensed under
			<a
				href="https://github.com/ORG-PPSL/ppsl-cd-api?tab=AGPL-3.0-1-ov-file#readme"
				target="ppsl-code-license">GNU AFFERO GENERAL PUBLIC LICENSE Version 3</a
			>.
		</p>

		<h3>Links</h3>

		<ul>
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
			<li>
				<a
					href="https://www.twitch.tv/remahy"
					target="twitch.tv/remahy"
					class="flex items-center gap-2"
				>
					<TwitchGlitch size="18" /> <span>Twitch - Remahy</span></a
				>
			</li>
		</ul>

		<p>
			<strong>Contact email:</strong> info(<AtSignIcon style="display: inline;" />)forsen.wiki
		</p>

		<h3>Privacy policy</h3>

		<p>
			<a href="/privacy">Visit Privacy page.</a>
		</p>

		<h3>Terms of Service</h3>

		<p>
			<a href="/terms">Visit Terms of Service page.</a>
		</p>
	</section>
</div>
