<script>
	import { getContext, onMount } from 'svelte';
	import { FileIcon, FileUpIcon, HistoryIcon } from 'lucide-svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import Box from '$lib/components/Box.svelte';
	import Link from '$lib/components/Link.svelte';
	import Editor from '$lib/components/editor/editor.svelte';
	import Button from '$lib/components/Button.svelte';
	import Clown from '$lib/components/Clown.svelte';
	import Spinner from '$lib/components/Spinner.svelte';
	import Container from '$lib/components/Container.svelte';
	import { validateArticle } from '$lib/components/editor/validations';
	import { updateArticle } from '$lib/api/articles';
	import LinkButton from '$lib/components/LinkButton.svelte';

	const {
		post: { id, title, rawTitle },
		update,
	} = $page.data;

	/** @type {Error | null} */
	let error = null;

	/** @type {{[x: string]: Error}} */
	let rawWarnings = {};

	$: warnings = Object.values(rawWarnings);

	/** @type {ComposerWritable} */
	const c = getContext('COMPOSER');
	$: composer = $c;
	$: editor = composer?.getEditor?.();
	$: canEdit = editor?.isEditable();

	const y = getContext('YDOC');
	$: yjsDocMap = $y;

	/** @type {Writable<YDOCPERSISTENCE>} */
	const p = getContext('YDOCPERSISTENCE');
	$: persistence = $p;

	let isUploading = false;

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

	<Editor {update} {id} />

	{#if error}
		<Box class="flex items-center !bg-red-200 p-2 dark:text-black">
			<p>{error.message}</p>
		</Box>
	{/if}

	{#if warnings.length}
		<Box class="flex items-center !bg-yellow-200 p-2 dark:text-black">
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
</Container>
