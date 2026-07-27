<script>
	import { formatRelative } from 'date-fns';
	import { enGB } from 'date-fns/locale';
	import { signOut } from '@auth/sveltekit/client';
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import Box from '$lib/components/Box.svelte';
	import { listArticles, resetArticle } from '$lib/utils/indexedDb/article';
	import Spinner from '$lib/components/Spinner.svelte';
	import Link from '$lib/components/Link.svelte';
	import Button from '$lib/components/Button.svelte';
	import { resetContent } from '$lib/utils/indexedDb/content';
	import { deleteUser, getUserData } from '$lib/api/user';
	import MyDataModal from '$lib/components/MyDataModal/index.svelte';
	import { modal } from '$lib/stores/modal';

	/** @type {{ editedArticles: number, uploadedContent: { total: number, images: number, videos: number, audio: number, documents: number } }} */
	let stats = $state($page.data.stats);
	/** @type {{ name: string, createdAt: Date, image: string, permissions: Array<{ type: string }>, id: string }} */
	let user = $state($page.data.user);

	const isMe = user.name === $page.data.session?.user?.name;

	let localDrafts = $state(browser ? listArticles() : []);

	let isRetrievingUserData = $state(false);

	/**
	 * @param {string} name
	 */
	const onClickDeleteWrapper = (name) => {
		setTimeout(async () => {
			const ok = confirm(
				'This will delete your local draft edit and its uploaded content. Are you sure?'
			);

			if (ok) {
				await resetArticle(name);
				await resetContent(name);
				localDrafts = listArticles();
			}
		});
	};

	const onClickAnonymizeAccountWrapper = async () => {
		const ok = confirm(
			'This will delete your Twitch association and anonymize your account. This cannot be reverted. Are you sure?'
		);

		if (!ok) {
			return;
		}

		const okOk = confirm('Press OK to start the deletion process.');

		if (!okOk) {
			return;
		}

		const draftArticleNames = await listArticles();

		for (let index = 0; index < draftArticleNames.length; index++) {
			const { name } = draftArticleNames[index];
			await resetArticle(name);
			await resetContent(name);
		}

		try {
			await deleteUser();
		} catch (err) {
			alert(
				// @ts-ignore
				`Please refresh your session by logging out and logging back in again before attempting this action. ${err?.message || ''}`
			);
			console.error(err);
		}

		await signOut({ redirect: true });
	};

	const onClickDownloadMyData = async () => {
		isRetrievingUserData = true;

		const ok = confirm(
			'You must stay on this page to download all of your files. Leaving this page will cancel the process. Do you wish to proceed?'
		);

		if (!ok) {
			isRetrievingUserData = false;

			return;
		}

		try {
			const res = await getUserData();

			const data = await res.json();

			modal.set({
				isOpen: true,
				component: MyDataModal,
				data,
			});
		} catch (err) {
			alert(
				// @ts-ignore
				`Something went wrong retrieving your data. Try again later or try logging out and logging back in again. ${err?.message || ''}`
			);
			console.error(err);
		} finally {
			isRetrievingUserData = false;
		}
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

<section class="container mx-auto flex grow flex-col gap-4 p-4 lg:py-12">
	<Box class="flex max-w-[unset] flex-col overflow-hidden p-4 lg:mb-0">
		<div class="flex flex-wrap gap-8">
			<div class="forsen-wiki-theme-border self-start overflow-hidden rounded-lg border-2">
				<img src={user.image} alt="" loading="lazy" />
			</div>
			<div class="grow">
				<h1 class="mb-2 text-4xl font-bold">{user.name}</h1>
				<h2 class="text-2xl">{stats.editedArticles ? 'Editor' : 'Lurker'}</h2>

				<hr class="mb-4 forsen-wiki-theme-border" />

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
								<Link href="/search?query={user.id}&type=article" target="_blank"
									>{stats.editedArticles}</Link
								>
							</p>
						{/if}
						{#if stats.uploadedContent.total}
							<p>
								<strong>Uploaded content:</strong>
								<Link href="/search?query={user.id}&type=content" target="_blank"
									>{stats.uploadedContent.total}</Link
								>
							</p>
							<table class="table w-76 table-fixed">
								<tbody>
									<tr>
										<td>Images</td>
										<td>
											<Link href="/search?query={user.id}&type=content&contenttype=image" target="_blank"
												>{stats.uploadedContent.images}</Link
											>
										</td>
									</tr>

									<tr>
										<td>Videos</td>
										<td>
											<Link href="/search?query={user.id}&type=content&contenttype=video" target="_blank"
												>{stats.uploadedContent.videos}</Link
											>
										</td>
									</tr>

									<tr>
										<td>Audio</td>
										<td>
											<Link href="/search?query={user.id}&type=content&contenttype=audio" target="_blank"
												>{stats.uploadedContent.audio}</Link
											>
										</td>
									</tr>

									<tr>
										<td>Documents</td>
										<td>
											<Link
												href="/search?query={user.id}&type=content&contenttype=document"
												target="_blank">{stats.uploadedContent.documents}</Link
											>
										</td>
									</tr>
								</tbody>
							</table>
						{/if}
					</div>
					{#if isMe}
						<div class="w-full min-w-50 lg:w-[unset]">
							<div class="forsen-wiki-theme-border mb-2 rounded-sm border p-2">
								<p class="mb-2"><strong>Your data:</strong></p>
								<div class="flex flex-col gap-2">
									<Button
										class="h-fit min-h-0! bg-red-500! p-1! text-sm font-bold! dark:bg-red-500/50!"
										title="This will anonymize your account, delete any personally identifiably information and disconnect your Twitch account."
										onclick={onClickAnonymizeAccountWrapper}>Delete account</Button
									>
									<Button
										title="Clicking this will give you a JSON file with all of your personal data."
										onclick={onClickDownloadMyData}
									>
										{#if isRetrievingUserData}
											<Spinner />
										{/if}

										<span>My data</span>
									</Button>
								</div>
							</div>
							{#await localDrafts}
								<p class="inline-flex items-baseline gap-2">
									<Spinner />
									<span>Loading your drafts...</span>
								</p>
							{:then drafts}
								<p><strong>Your drafts:</strong></p>
								<ul class="ml-5 list-disc">
									{#each drafts as draft (draft.name)}
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
