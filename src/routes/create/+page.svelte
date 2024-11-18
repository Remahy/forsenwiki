<script>
	import { getContext, onMount } from 'svelte';
	import { FileUpIcon } from 'lucide-svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
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

	const { initialUpdate } = $page.data;

	/** @type {Error | null} */
	let error = null;

	let title = '';

	/** @type {ComposerWritable} */
	const c = getContext('COMPOSER');
	$: composer = $c;
	$: editor = composer?.getEditor?.();
	$: canEdit = editor?.isEditable();

	$: titleError = title.length === 0 ? new Error('No title set!') : null;

	const y = getContext('YDOC');
	$: yjsDocMap = $y;

	/** @type {Writable<YDOCPERSISTENCE>} */
	const p = getContext('YDOCPERSISTENCE');
	$: persistence = $p;

	let isUploading = false;

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

		editor.update(async () => {
			isUploading = true;

			let res;

			try {
				await validateArticle(editor);

				if (!title) {
					throw new Error('No title set.');
				}

				res = await createArticle(title, yjsDocMap);
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

				const json = await res.json();
				const { title /* postUpdate: { id } */ } = json;

				goto(`/w/${title}`);
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
		<strong>Title <small>(Must be unique)</small></strong>
		<input
			on:input={unsetError}
			required
			class="w-full rounded p-2 {titleError && '!bg-red-200'} dark:border-violet-700 dark:bg-black"
			bind:value={title}
		/>
		{#if titleError}
			<strong class="text-red-500">{titleError.message}</strong>
		{/if}
	</label>

	<div class="flex min-h-96">
		<Editor update={null} id={'new'} {initialUpdate} />
	</div>

	{#if error}
		<Box class="flex items-center !bg-red-200 p-2 dark:text-black">
			<p>{error.message}</p>
		</Box>
	{/if}

	<Box class="flex items-center gap-4 p-2">
		<small class="grow">
			Make sure you read the <Link
				href="/terms"
				class="hover:!text-indigo-700"
				target="forsenwiki-tos">Terms & Conditions</Link
			>. Anyone can edit this article once it's submitted. Don't complain if your article get
			modified or deleted. <Clown />
		</small>

		<Button disabled={!canEdit || isUploading || error} on:click={submit} title="Submit">
			{#if isUploading}
				<Spinner />
			{/if}

			<span class="hidden lg:inline">Submit</span>
			<FileUpIcon class="inline lg:hidden" />
		</Button>
	</Box>

	<Button
		disabled={!canEdit || isUploading || error}
		class="flex-col !bg-red-900 !bg-opacity-50 hover:!bg-red-900 hover:!bg-opacity-100"
		title="Reset"
		on:click={reset}
	>
		{#if isUploading}
			<Spinner />
		{/if}

		<span>Reset this draft cache</span>
		<div><small>(Will only delete this new draft)</small></div>
	</Button>
</Container>
