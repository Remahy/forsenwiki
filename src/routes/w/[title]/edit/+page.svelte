<script>
	import { getContext, onMount } from 'svelte';
	import { FileIcon, FileUpIcon, HistoryIcon } from '@lucide/svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { browser } from '$app/environment';

	import { resetContent } from '$lib/utils/indexedDb/content';
	import { resetArticle } from '$lib/utils/indexedDb/article';
	import { readForcedMigration, updatePost } from '$lib/api/posts';
	import Box from '$lib/components/Box.svelte';
	import Link from '$lib/components/Link.svelte';
	import Editor from '$lib/components/editor/editor.svelte';
	import Button from '$lib/components/Button.svelte';
	import Clown from '$lib/components/Clown.svelte';
	import Spinner from '$lib/components/Spinner.svelte';
	import Container from '$lib/components/Container.svelte';
	import TagSelect from '$lib/components/Disclaimer/TagSelect.svelte';
	import LinkButton from '$lib/components/LinkButton.svelte';
	import ResetCacheLink from '$lib/components/editor/footer/ResetCacheLink.svelte';
	import { sanitizeTitle } from '$lib/components/editor/utils/sanitizeTitle';
	import { AVAILABLE_DISCLAIMER_TAGS, DISCLAIMER_TAGS, WIKI_PATH } from '$lib/constants/constants';
	import { uploadImages } from '$lib/s3/uploadContentHandlers';
	import { uploadModal } from '$lib/stores/modal';
	import UploadingContentModal from '$lib/components/UploadingContentModal.svelte';
	import { resetUploadingContentModalGlobals } from '$lib/components/uploadingContentModalGlobals.svelte';
	import { runValidations } from '$lib/components/editor/validations';
	import { editorGlobals } from '$lib/components/editor/editorGlobals.svelte';
	import Satire from '$lib/components/Disclaimer/Satire.svelte';
	import NSFW from '$lib/components/Disclaimer/NSFW.svelte';
	import EditorError from '$lib/components/editor/EditorError.svelte';

	/**
	 * @type {import('./$types').PageProps}
	 */
	let { data = $bindable() } = $props();

	const {
		post: { id, title, rawTitle, outRelations },
		update,
		notConverted,
	} = data;

	// Kept apart from the draft of the converted article.
	const draftId = notConverted ? `${id}-forced` : id;

	/** @type {import('../../../api/post/read/[title]/forced-migration/+server').ForcedMigration | null} */
	let forcedMigration = $state(null);
	let isMigrating = $state(false);

	const loadForcedMigration = async () => {
		isMigrating = true;

		try {
			const res = await readForcedMigration({ postTitle: title });
			const json = await res.json();

			if (!res.ok) {
				error = { status: res.status, statusText: res.statusText, ...json };
				return;
			}

			forcedMigration = json;
		} catch (err) {
			console.error(err);
			error = err instanceof Error ? err : new Error(String(err));
		} finally {
			isMigrating = false;
		}
	};

	/** @type {EditorErrorValue | null} */
	let error = $state(null);

	/** @type {{[x: string]: Error}} */
	// let rawWarnings = {};
	// let warnings = $derived(Object.values(rawWarnings));

	/** @type {ComposerWritable} */
	const c = getContext('COMPOSER');
	let composer = $derived($c);
	let editor = $derived(composer?.getEditor?.());
	let canEdit = $derived(!!editor && editorGlobals.isEditable);

	const y = getContext('YDOC');
	let yjsDocMap = $derived($y);

	/** @type {Writable<YDOCPERSISTENCE>} */
	const p = getContext('YDOCPERSISTENCE');
	let persistence = $derived($p);

	let isUploading = $state(false);

	let newTitle = $state(rawTitle);

	/** @type {string[]} */
	let disclaimerTags = $state(
		/** @type {Array<{ isSystem: boolean, toPostId: string }>} */ (outRelations)
			.filter(({ isSystem, toPostId }) => isSystem && AVAILABLE_DISCLAIMER_TAGS.includes(toPostId))
			.map(({ toPostId }) => toPostId)
	);

	let isSatire = $derived(disclaimerTags.includes(DISCLAIMER_TAGS.SATIRE));
	let isNSFW = $derived(disclaimerTags.includes(DISCLAIMER_TAGS.NSFW));

	let titleError = $derived.by(() => {
		const rawTitle = newTitle;
		if (rawTitle.length === 0) {
			return new Error('No title set!');
		}

		const { sanitized } = sanitizeTitle(rawTitle);
		if (sanitized.length === 0) {
			return new Error('Illegal title.');
		}

		return null;
	});

	const unsetError = () => {
		error = null;
	};

	const reset = async (reload = true) => {
		isUploading = true;

		try {
			await resetArticle(draftId);
			await resetContent(id);
			isUploading = false;

			if (reload) {
				window.location.reload();
			}
		} catch (err) {
			console.error(err);
			if (err instanceof Error) {
				error = err;
				return;
			}

			error = new Error(
				"Unknown error occurred while trying to delete this article's draft cache."
			);
		}
	};

	const submit = async () => {
		if (!yjsDocMap) {
			return;
		}

		if (!canEdit) {
			return;
		}

		const editor = composer?.getEditor();

		if (!editor) {
			return;
		}

		isUploading = true;

		const allowMissingArticles = error?.missingArticleIds;

		/** @type {Response?} */
		let res = null;

		try {
			await runValidations(editor);

			uploadModal.set({ isOpen: true, component: UploadingContentModal });

			// Upload images to S3.
			await uploadImages(editor, id);

			res = await editor.read(() =>
				updatePost({
					postTitle: title,
					yDoc: yjsDocMap,
					newTitle,
					disclaimerTags: data.isModerator ? disclaimerTags : undefined,
					forced: notConverted || undefined,
					allowMissingArticles,
				})
			);
		} catch (err) {
			console.error(err);
			error = err instanceof Error ? err : new Error(String(err));
			$uploadModal.isOpen = false;
		} finally {
			isUploading = false;
		}

		if (!res) {
			return;
		}

		if (res.status === 200) {
			persistence.clearData();

			const json = await res.json();
			const { title /* postUpdate: { id } */, partialErrors } = json;

			// This is used to generate a searchParam string.
			// eslint-disable-next-line svelte/prefer-svelte-reactivity
			const searchParams = new URLSearchParams();

			if (partialErrors?.length) {
				searchParams.set('partialErrors', JSON.stringify(partialErrors));
			}

			const stringSearchParams = searchParams.toString() ? `?${searchParams.toString()}` : '';

			await reset(false);

			// eslint-disable-next-line svelte/no-navigation-without-resolve
			goto(`${resolve('/w/[title]', { title })}${stringSearchParams}`);
		} else if (res.status >= 400) {
			const json = await res.json();
			error = { status: res.status, statusText: res.statusText, ...json };
		}

		$uploadModal.isOpen = false;
		resetUploadingContentModalGlobals();
	};

	onMount(() => {
		c.subscribe((composer) => {
			if (composer === null) {
				return;
			}

			const editor = composer.getEditor();
			editor.registerTextContentListener(() => {
				error = null;
			});
		});
	});
</script>

<svelte:head>
	<title>Editing &quot;{rawTitle}&quot; - Community Forsen Wiki</title>
	<meta name="og:title" content="Editing &quot;{rawTitle}&quot; - Community Forsen Wiki" />

	<meta name="description" content="Edit the &quot;{rawTitle}&quot; article on forsen.wiki" />
	<meta
		property="og:description"
		content="Edit the &quot;{rawTitle}&quot; article on forsen.wiki"
	/>

	<link rel="canonical" href="{$page.url.origin}/w/{title}" />
	<meta property="og:url" content="{$page.url.origin}/w/{title}" />
</svelte:head>

<Container>
	<Box class="flex gap-2 p-4">
		<div class="flex grow items-center overflow-hidden">
			<p>
				Editing the <strong>"{rawTitle}"</strong> article.
				<span class="font-bold">Your article drafts are automatically saved locally.</span>
			</p>
		</div>

		<div class="flex shrink-0 items-start gap-2">
			<LinkButton href="/w/{title}/history" class="flex items-center gap-2 text-sm">
				<HistoryIcon size="16" /><span class="hidden md:inline">History</span>
			</LinkButton>

			<LinkButton href="/w/{title}" class="flex items-center gap-2 text-sm">
				<FileIcon size="16" /><span class="hidden md:inline">View article</span>
			</LinkButton>
		</div>
	</Box>

	{#if isSatire}
		<Satire />
	{/if}

	{#if isNSFW}
		<NSFW />
	{/if}

	{#if data.isModerator}
		<Box class="p-4">
			<div class="mb-5 border-b border-black/25 dark:border-white/25">
				<strong>Moderation tools</strong>
			</div>

			<div>
				<label>
					<strong>Title <small>(Must be unique, keep it short.)</small></strong>
					<input
						oninput={unsetError}
						required
						class="w-full rounded-sm p-2 {titleError ? 'bg-red-200!' : ''} input-color"
						bind:value={newTitle}
					/>
					{#if titleError}
						<strong class="text-red-600 dark:text-red-500">{titleError.message}</strong>
					{:else}
						<small
							><span class="font-bold">URL:</span>
							<span>{WIKI_PATH}{sanitizeTitle(newTitle).sanitized}</span></small
						>
					{/if}
				</label>
			</div>

			<div class="mt-4">
				<TagSelect bind:disclaimerTags onchange={unsetError} />
			</div>
		</Box>
	{/if}

	{#if notConverted}
		<Box class="flex flex-col gap-2 bg-yellow-300/75! p-4 dark:text-black" role="alert">
			<p>
				<strong>This article could not be migrated to the new editor automatically.</strong>
				It stays read-only until a moderator submits a migrated version of it.
			</p>

			{#if forcedMigration}
				<p>
					This is the forcefully migrated version. Check what was lost or changed, fix it, and
					submit to migrate the article. Use historical versions of the article to compare.
				</p>

				{#if forcedMigration.differences.length}
					<ul class="list-inside list-disc font-mono text-sm wrap-anywhere">
						{#each forcedMigration.differences as difference, index (index)}
							<li>{difference}</li>
						{/each}
					</ul>
				{/if}
			{:else}
				<p>You can load a forcefully migrated version into the editor.</p>

				<div>
					<Button disabled={isMigrating} on:click={loadForcedMigration}>
						{#if isMigrating}
							<Spinner />
						{/if}
						<span>Load the forcefully migrated version</span>
					</Button>
				</div>
			{/if}
		</Box>
	{/if}

	{#if browser && (!notConverted || forcedMigration)}
		<Editor update={forcedMigration?.update ?? update} {id} {draftId} {title} />
	{/if}

	{#if error}
		<EditorError {error} {editor} />
	{/if}

	<!--
	{#if warnings.length}
		<Box class="flex items-center bg-yellow-300/75! p-2 dark:text-black">
			{#each warnings as warning (warning.name)}
				<p>{warning.message}</p>
			{/each}
		</Box>
	{/if}
	-->

	<Box class="flex items-center gap-4 p-2">
		<small class="grow">
			Make sure you read the <Link
				href="/terms"
				class="hover:text-indigo-700!"
				target="forsenwiki-tos">Terms & Conditions</Link
			>.
			<span
				>Anyone can edit this article. Don't complain if your edits get modified or deleted.</span
			>
			<Clown />
		</small>

		{#if $page.data.session?.user}
			<Button
				disabled={!canEdit || isUploading || (error && !error.missingArticleIds)}
				on:click={submit}
				title="Submit"
			>
				{#if isUploading}
					<Spinner />
				{/if}
				<span class="hidden lg:inline" id="submit">Submit</span>
				<FileUpIcon class="inline min-w-6 lg:hidden" />
			</Button>
		{:else}
			<span class="forsen-wiki-theme-border border p-2">Login to submit.</span>
		{/if}
	</Box>

	<div>
		<ResetCacheLink
			disabled={!canEdit || isUploading || !!error}
			isLoading={isUploading}
			onClickReset={() => reset()}
		>
			<span>Reset &quot;{title}&quot; draft cache</span>
		</ResetCacheLink>
	</div>
</Container>
