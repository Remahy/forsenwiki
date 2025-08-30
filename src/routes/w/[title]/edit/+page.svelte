<script>
	import { getContext } from 'svelte';
	import { FileIcon, FileUpIcon, HistoryIcon } from 'lucide-svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';

	import { resetIndexedDb } from '$lib/yjs/resetIndexedDb';
	import { updateArticle } from '$lib/api/articles';
	import Box from '$lib/components/Box.svelte';
	import Link from '$lib/components/Link.svelte';
	import Editor from '$lib/components/editor/editor.svelte';
	import Button from '$lib/components/Button.svelte';
	import Clown from '$lib/components/Clown.svelte';
	import Spinner from '$lib/components/Spinner.svelte';
	import Container from '$lib/components/Container.svelte';
	import { validateArticle } from '$lib/components/editor/validations';
	import LinkButton from '$lib/components/LinkButton.svelte';
	import ResetCacheButton from '$lib/components/editor/footer/ResetCacheButton.svelte';

	const {
		post: { id, title, rawTitle },
		update,
	} = $page.data;

	/** @type {Error | null} */
	let error = $state(null);

	/** @type {{[x: string]: Error}} */
	let rawWarnings = {};

	let warnings = $derived(Object.values(rawWarnings));

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
				res = await updateArticle(title, yjsDocMap);
			} catch {
				// noop
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
			await resetIndexedDb(id);
			isUploading = false;
			window.location.reload();
		} catch (err) {
			if (err instanceof Error) {
				error = err;
				return;
			}

			error = new Error(
				"Unknown error occurred while trying to delete this article's draft cache."
			);
		}
	};

	$effect(() => {
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
	<meta
		name="description"
		content="Edit the &quot;{rawTitle}&quot; on forsen.wiki - All things forsen, and more."
	/>
</svelte:head>

<Container>
	<Box class="flex gap-2 p-4">
		<div class="flex grow items-center overflow-hidden">
			<p>
				Editing the <strong>"{rawTitle}"</strong> article.
				<strong>Your article drafts are automatically saved locally.</strong>
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

	{#if browser}
		<div class="flex min-h-96">
			<Editor {update} {id} />
		</div>
	{/if}

	{#if error}
		<Box class="flex items-center !bg-red-300 p-2 dark:text-black">
			<p>{error.message}</p>
		</Box>
	{/if}

	{#if warnings.length}
		<Box class="flex items-center !bg-yellow-300 p-2 dark:text-black">
			{#each warnings as warning}
				<p>{warning.message}</p>
			{/each}
		</Box>
	{/if}

	<Box class="flex items-center gap-4 p-2">
		<small class="grow">
			Make sure you read the <Link
				href="/terms"
				class="hover:!text-indigo-700"
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

			<span class="hidden lg:inline">Submit</span>
			<FileUpIcon class="inline lg:hidden" />
		</Button>
	</Box>

	<ResetCacheButton
		disabled={!canEdit || isUploading || !!error}
		isLoading={isUploading}
		onClickReset={reset}
	>
		<span>Reset &quot;{title}&quot; draft cache</span>
	</ResetCacheButton>
</Container>
