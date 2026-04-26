<script>
	import { getContext, onMount } from 'svelte';
	import { FileIcon, FileUpIcon, HistoryIcon } from '@lucide/svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { browser } from '$app/environment';

	import { resetContent } from '$lib/utils/indexedDb/content';
	import { resetArticle } from '$lib/utils/indexedDb/article';
	import { updatePost } from '$lib/api/posts';
	import Box from '$lib/components/Box.svelte';
	import Link from '$lib/components/Link.svelte';
	import Editor from '$lib/components/editor/editor.svelte';
	import Button from '$lib/components/Button.svelte';
	import Clown from '$lib/components/Clown.svelte';
	import Spinner from '$lib/components/Spinner.svelte';
	import Container from '$lib/components/Container.svelte';
	import LinkButton from '$lib/components/LinkButton.svelte';
	import ResetCacheLink from '$lib/components/editor/footer/ResetCacheLink.svelte';
	import { sanitizeTitle } from '$lib/components/editor/utils/sanitizeTitle';
	import { WIKI_PATH, Y_POST_TYPES } from '$lib/constants/constants';
	import { uploadImages } from '$lib/s3/uploadContentHandlers';
	import { uploadModal } from '$lib/stores/modal';
	import UploadingContentModal from '$lib/components/UploadingContentModal.svelte';
	import { resetUploadingContentModalGlobals } from '$lib/components/uploadingContentModalGlobals.svelte';
	import { runValidations } from '$lib/components/editor/validations';

	const {
		post: { id, title, rawTitle },
		update,
	} = $page.data;

	/** @type {Error | null} */
	let error = $state(null);

	/** @type {{[x: string]: Error}} */
	// let rawWarnings = {};
	// let warnings = $derived(Object.values(rawWarnings));

	/** @type {ComposerWritable} */
	const c = getContext('COMPOSER');
	let composer = $derived($c);
	let editor = $derived(composer?.getEditor?.());
	let canEdit = $derived(editor?.isEditable());

	const y = getContext('YDOC');
	let yjsDocMap = $derived($y);

	/** @type {Writable<YDOCPERSISTENCE>} */
	const p = getContext('YDOCPERSISTENCE');
	let persistence = $derived($p);

	let isUploading = $state(false);

	let newTitle = $state(rawTitle);

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
			await resetArticle(id);
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

		let res;

		try {
			await runValidations(editor);

			uploadModal.set({ component: UploadingContentModal, isOpen: true });

			// Upload images to S3.
			await uploadImages(editor, id);

			res = await editor.read(() => updatePost(title, yjsDocMap, newTitle));
		} catch (err) {
			console.error(err);
			error = new Error(err?.toString());
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

			goto(`${resolve('/w/[title]', { title })}${stringSearchParams}`);
		} else if (res.status >= 400) {
			const json = await res.json();
			error = json;
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
	<meta name="og:title" content="Editing &quot;{rawTitle}&quot; - Community Forsen Wiki">

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

	{#if $page.data.isModerator}
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
		</Box>
	{/if}

	{#if browser}
		<Editor {update} {id} />
	{/if}

	{#if error}
		<Box class="flex items-center bg-red-300! p-2 dark:text-black">
			<p>{error.message}</p>
		</Box>
	{/if}

	<!--
	{#if warnings.length}
		<Box class="flex items-center bg-yellow-300! p-2 dark:text-black">
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

		<Button disabled={!canEdit || isUploading || error} on:click={submit} title="Submit">
			{#if isUploading}
				<Spinner />
			{/if}

			<span class="hidden lg:inline" id="submit">Submit</span>
			<FileUpIcon class="inline min-w-6 lg:hidden" />
		</Button>
	</Box>

	<div>
		<ResetCacheLink
			disabled={!canEdit || isUploading || !!error}
			isLoading={isUploading}
			onClickReset={reset}
		>
			<span>Reset &quot;{title}&quot; draft cache</span>
		</ResetCacheLink>
	</div>
</Container>
