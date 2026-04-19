<script>
	import { formatRelative } from 'date-fns';
	import { enGB } from 'date-fns/locale';
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import Box from '$lib/components/Box.svelte';
	import { listArticles, resetArticle } from '$lib/utils/indexedDb/article';
	import Spinner from '$lib/components/Spinner.svelte';
	import Link from '$lib/components/Link.svelte';
	import Button from '$lib/components/Button.svelte';
	import { resetContent } from '$lib/utils/indexedDb/content';

	const id = $page.params.id;
	/** @type {{ editedArticles: number, uploadedContent: { total: number, images: number, videos: number, audio: number, documents: number } }} */
	let stats = $state($page.data.stats);
	/** @type {{ name: string, createdAt: Date, image: string, permissions: Array<{ type: string }> }} */
	let user = $state($page.data.user);

	const isMe = user.name === $page.data.session?.user?.name;

	let localDrafts = $state(browser ? listArticles() : []);

	/**
	 * @param {string} name
	 */
	const onClickDeleteWrapper = (name) => {
		setTimeout(async () => {
			const ok = confirm(
				'Are you sure? This will delete your local draft edit and its uploaded content.'
			);

			if (ok) {
				await resetArticle(name);
				await resetContent(name);
				localDrafts = listArticles();
			}
		});
	};
</script>

<svelte:head>
	<title>User: {user.name} - Community Forsen Wiki</title>
	<meta name="og:title" content="User: {user.name} - Community Forsen Wiki" />

	{#if stats.editedArticles}
		<meta
			name="description"
			content="This Pepega has contributed to {stats.editedArticles} articles and uploaded {stats
				.uploadedContent.total} pieces of content."
		/>
	{:else}
		<meta name="description" content="This is a certified registered Pepega." />
	{/if}

	{#if user.image}
		<meta property="og:image" content={user.image} />
	{/if}
</svelte:head>

<section
	class="
		container mx-auto flex grow flex-col gap-4 p-4
		lg:py-12
	"
>
	<Box
		class="
			flex max-w-[unset] flex-col overflow-hidden p-4
			lg:mb-0
		"
	>
		<div class="flex flex-wrap gap-8">
			<div class="forsen-wiki-theme-border self-start overflow-hidden rounded-lg border-2">
				<img src={user.image} alt="" loading="lazy" />
			</div>
			<div class="grow">
				<h1 class="mb-2 text-4xl font-bold">{user.name}</h1>
				<h2 class="text-2xl">{stats.editedArticles ? 'Editor' : 'Lurker'}</h2>

				<hr class="mb-4" />

				<div class="flex flex-wrap gap-8">
					<div class="flex grow flex-col gap-2">
						<p title={user.createdAt.toUTCString()}>
							<strong>Registered:</strong>
							<span>{formatRelative(user.createdAt, Date.now(), { locale: enGB })}</span>
						</p>
						{#if user.permissions.length}
							<p>
								<strong>Permissions:</strong>
								<span>{user.permissions.map(({ type }) => type).join(', ')}</span>
							</p>
						{/if}
						{#if stats.editedArticles}
							<p>
								<strong>Edited articles:</strong>
								<Link href="/search?query={id}&type=article" target="blank"
									>{stats.editedArticles}</Link
								>
							</p>
						{/if}
						{#if stats.uploadedContent.total}
							<p>
								<strong>Uploaded content:</strong>
								<Link href="/search?query={id}&type=content" target="blank"
									>{stats.uploadedContent.total}</Link
								>
							</p>
							<table class="table w-76 table-fixed">
								<tbody>
									<tr>
										<td>Images</td>
										<td>
											<Link href="/search?query={id}&type=content&contenttype=image" target="blank"
												>{stats.uploadedContent.images}</Link
											>
										</td>
									</tr>

									<tr>
										<td>Videos</td>
										<td>
											<Link href="/search?query={id}&type=content&contenttype=video" target="blank"
												>{stats.uploadedContent.videos}</Link
											>
										</td>
									</tr>

									<tr>
										<td>Audio</td>
										<td>
											<Link href="/search?query={id}&type=content&contenttype=audio" target="blank"
												>{stats.uploadedContent.audio}</Link
											>
										</td>
									</tr>

									<tr>
										<td>Documents</td>
										<td>
											<Link
												href="/search?query={id}&type=content&contenttype=document"
												target="blank">{stats.uploadedContent.documents}</Link
											>
										</td>
									</tr>
								</tbody>
							</table>
						{/if}
					</div>
					{#if isMe}
						<div>
							{#await localDrafts}
								<p class="inline-flex items-baseline gap-2">
									<Spinner />
									<span>Loading your drafts...</span>
								</p>
							{:then drafts}
								{@const draftsWithName = /**@type {Array<{ name: string }>}*/ (
									drafts.filter(({ name }) => typeof name === 'string')
								)}
								<p><strong>Your drafts:</strong></p>
								<ul class="ml-5 list-disc">
									{#each draftsWithName as draft (draft.name)}
										<li>
											<div class="flex items-baseline gap-2">
												{#if draft.name === 'new'}
													<Link href="/create">{draft.name}</Link>
												{:else}
													<Link href="/w/{draft.name}/edit">{draft.name}</Link>
												{/if}
												<Button
													class="bg-transparent! p-0! text-red-500!"
													onclick={() => onClickDeleteWrapper(draft.name)}
												>
													<span>Delete</span>
												</Button>
											</div>
										</li>
									{:else}
										<span class="-ml-5 italic">You don't have any drafts. Create some!</span>
									{/each}
								</ul>
							{/await}
						</div>
					{/if}
				</div>
			</div>
		</div>
	</Box>
</section>
