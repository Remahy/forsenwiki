<script>
	import { resolve } from '$app/paths';
	import { AtSignIcon } from '@lucide/svelte';
	import Container from '$lib/components/Container.svelte';
</script>

<svelte:head>
	<title>DMCA</title>
	<meta name="description" content="forsen.wiki DMCA" />
</svelte:head>

<Container class="p-8">
	<section
		class="
		prose prose-sm dark:prose-invert w-full
		max-w-[unset]
	"
	>
		<p>forsen.wiki is a user-generated content platform.</p>

		<hr />

		<p>
			Any privacy concerns, and/or privacy questions please see the <a href={resolve('/privacy')}
				>Privacy Policy</a
			>.
		</p>
		<p>
			<strong
				>If personal information has been posted that you would like removed, please email <span
					class="underline">privacy<AtSignIcon class="inline" />forsen.wiki</span
				></strong
			>
		</p>

		<hr />

		<h1>DMCA</h1>
		<p>
			For the purposes of this document, this procedure follows a DMCA-style notice-and-takedown
			process to copyright infringement. forsen.wiki respects the intellectual property rights of
			others and complies with applicable copyright laws, including those of the European Union. To
			help us process your request, please include the following information in your notice:
		</p>

		<hr />

		<ul>
			<li>
				A description of the copyrighted work or other intellectual property you claim has been
				infringed.
			</li>
			<li>
				The exact URL or location of the material on forsen.wiki that you claim is infringing.
			</li>
			<li>If applicable, a link to the original work or proof of ownership.</li>
			<li>Your name, address, telephone number, and email address.</li>
			<li>
				A statement that you have a good-faith belief that the disputed use is not authorized by the
				copyright owner, its agent, or the law.
			</li>
			<li>
				A statement that the information in your notice is accurate and that you are the copyright
				owner or are authorized to act on behalf of the owner.
			</li>
			<li>Your electronic or physical signature.</li>
		</ul>

		<p><strong>Please send notices to:</strong> dmca<AtSignIcon class="inline" />forsen.wiki</p>
		<br />
		<p>
			Failure to provide this in full will delay our process in deleting allegedly infringing
			material. Additionally, forsen.wiki may request additional information before removing any
			allegedly infringing material.
		</p>
		<p>
			In the event forsen.wiki removes the allegedly infringing materials, forsen.wiki will
			immediately notify the user responsible for posting such materials that forsen.wiki removed or
			disabled access to the materials and may have the opportunity to respond.
		</p>
	</section>
</Container>
