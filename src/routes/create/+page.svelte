<script>
	import { getContext, onMount } from 'svelte';
	import { FileUpIcon } from 'lucide-svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';

	import { localStore } from '$lib/localStore.svelte';
	import { resetIndexedDb } from '$lib/yjs/resetIndexedDb';
	import { createArticle } from '$lib/api/articles';
	import Box from '$lib/components/Box.svelte';
	import Button from '$lib/components/Button.svelte';
	import Clown from '$lib/components/Clown.svelte';
	import Link from '$lib/components/Link.svelte';
	import Spinner from '$lib/components/Spinner.svelte';
	import Editor from '$lib/components/editor/editor.svelte';
	import Container from '$lib/components/Container.svelte';
	import { validateArticle } from '$lib/components/editor/validations';
	import ResetCacheLink from '$lib/components/editor/footer/ResetCacheLink.svelte';
	import { sanitizeTitle } from '$lib/components/editor/utils/sanitizeTitle';
	import { WIKI_PATH } from '$lib/constants/constants';

	const { initialUpdate } = $page.data;

	/** @type {Error | null} */
	let error = $state(null);

	// svelte-ignore non_reactive_update
	let title = localStore('lastTitle', '');

	/** @type {ComposerWritable} */
	const c = getContext('COMPOSER');
	let composer = $derived($c);
	let editor = $derived(composer?.getEditor?.());
	let canEdit = $derived(editor?.isEditable());

	let titleError = $derived.by(() => {
		const rawTitle = title.value;
		if (rawTitle.length === 0) {
			return new Error('No title set!');
		}

		const { sanitized } = sanitizeTitle(rawTitle);
		if (sanitized.length === 0) {
			return new Error('Illegal title.');
		}

		return null;
	});

	const y = getContext('YDOC');
	let yjsDocMap = $derived($y);

	/** @type {Writable<YDOCPERSISTENCE>} */
	const p = getContext('YDOCPERSISTENCE');
	let persistence = $derived($p);

	let isUploading = $state(false);

	const unsetError = () => {
		error = null;
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

		editor.read(async () => {
			isUploading = true;

			let res;

			try {
				validateArticle(editor);

				if (!title.value) {
					throw new Error('No title set.');
				}

				res = await createArticle(title.value, yjsDocMap);
			} catch (err) {
				error = new Error(err?.toString());
			} finally {
				isUploading = false;
			}

			if (!res) {
				return;
			}

			if (res.status === 200) {
				persistence.clearData();
				title.value = '';

				const json = await res.json();
				const { title: serverUrlTitle /* postUpdate: { id } */ } = json;

				goto(`/w/${serverUrlTitle}`);
			} else if (res.status >= 400) {
				const json = await res.json();
				error = json;
			}
		});
	};

	const reset = async () => {
		isUploading = true;

		try {
			await resetIndexedDb('new');
			title.value = '';
			isUploading = false;
			window.location.reload();
		} catch (err) {
			if (err instanceof Error) {
				error = err;
				return;
			}

			error = new Error('Unknown error occurred while trying to delete draft cache.');
		}
	};

	onMount(() => {
		c.subscribe((composer) => {
			if (composer === null) {
				return;
			}

			const editor = composer.getEditor();

			editor.registerTextContentListener(() => {
				unsetError();
			});
		});
	});
</script>

<svelte:head>
	<title>Creating new article for Community Forsen Wiki</title>
	<meta name="description" content="Start writing about games and sh..." />
</svelte:head>

<Container>
	<Box class="p-4">
		<p>
			Creating a new article.
			<strong>Your article drafts are automatically saved locally.</strong>
		</p>
	</Box>

	<label>
		<strong>Title <small>(Must be unique, keep it short.)</small></strong>
		<input
			oninput={unsetError}
			required
			class="w-full rounded-sm p-2 {titleError && '!bg-red-200'} input-color"
			bind:value={title.value}
		/>
		{#if titleError}
			<strong class="text-red-600 dark:text-red-500">{titleError.message}</strong>
		{:else}
			<small
				><strong>URL:</strong> <span>{WIKI_PATH}{sanitizeTitle(title.value).sanitized}</span></small
			>
		{/if}
	</label>

	{#if browser}
		<div class="flex min-h-96">
			<Editor update={null} id="new" {initialUpdate} />
		</div>
	{/if}

	{#if error}
		<Box class="flex items-center !bg-red-200 p-2 dark:text-black">
			<p>{error.message}</p>
		</Box>
	{/if}

	<Box class="flex items-center gap-4 p-2">
		<small class="grow">
			Make sure you read the <Link href="/terms" target="forsenwiki-tos">Terms & Conditions</Link>.
			Anyone can edit this article once it's submitted. Don't complain if your article is modified
			or deleted. <Clown />
		</small>

		<Button disabled={!canEdit || isUploading || error} on:click={submit} title="Submit">
			{#if isUploading}
				<Spinner />
			{/if}

			<span class="hidden lg:inline">Submit</span>
			<FileUpIcon class="inline lg:hidden" />
		</Button>
	</Box>

	<div>
		<ResetCacheLink
			disabled={!canEdit || isUploading || !!error}
			isLoading={isUploading}
			onClickReset={reset}
		>
			<div>
				<p>Reset this draft cache</p>
				<p>(Will only delete this new draft)</p>
			</div>
		</ResetCacheLink>
	</div>
</Container>
