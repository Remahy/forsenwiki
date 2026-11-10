<script>
	import './Article.css';

	import { getAllContexts, getContext, onDestroy, onMount } from 'svelte';
	import {
		buildEditorFromExtensions,
		configExtension,
		getExtensionDependencyFromEditor,
	} from '@lexical/extension';
	import { createYCollabConfig, isYWarning, YCollabExtension } from '@lexical/y';
	import { $getRoot as getRoot, $parseSerializedNode as parseSerializedNode } from 'lexical';

	import { openArticleDoc } from '$lib/y/openArticleDoc';
	import { fromSignal } from '$lib/utils/fromSignal.svelte';
	import { logYWarning, yCollabInput } from '$lib/y/config';
	import { EDITOR_IS_EDITABLE } from '$lib/constants/constants';
	import { setEditor } from './context';
	import { SvelteDecoratorsExtension } from './core/registerSvelteDecorators.svelte';
	import EditorModal from '../EditorModal.svelte';
	import Toolbar from './toolbar/index.svelte';
	import TreeviewWrapper from './toolbar/TreeviewWrapper.svelte';
	import MobileToolbar from './toolbar/MobileToolbar.svelte';
	import Footer from './footer/index.svelte';
	import { articleExtension, editableTheme } from './config/article';
	import { editorExtension } from './config/editor';
	import { ImageExtension } from './plugins/Image/ImageExtension';
	import ImageFixerModalButton from './ImageFixer/index.svelte';
	import { editorGlobals } from './editorGlobals.svelte';

	/**
	 * @typedef {Object} Props
	 * @property {any} id
	 * @property {any} update
	 * @property {any} [initialUpdate]
	 */

	/** @type {Props} */
	let { id, update, initialUpdate = null } = $props();

	/** @type {string | null} */
	let collabWarning = $state(null);

	/** @param {Error} warning */
	const onWarn = (warning) => {
		logYWarning(warning);

		if (isYWarning(warning) && /** @type {any} */ (warning.data)?.reason !== undefined) {
			collabWarning = `${warning.code} (${/** @type {any} */ (warning.data).reason})`;
		}
	};

	// svelte-ignore state_referenced_locally
	const article = openArticleDoc({ id, update, initialUpdate });

	// svelte-ignore state_referenced_locally
	const editor = buildEditorFromExtensions(
		articleExtension(editableTheme, EDITOR_IS_EDITABLE, null, undefined, { onWarn }),
		editorExtension,
		configExtension(ImageExtension, { articleId: id }),
		configExtension(SvelteDecoratorsExtension, { context: getAllContexts() }),
		createYCollabConfig(yCollabInput(article.doc))
	);
	setEditor(editor);

	const { binding, status } = getExtensionDependencyFromEditor(editor, YCollabExtension).output;
	const collabStatus = fromSignal(status);

	// For future reference: These contexts makes it so only one editor can be active at a time.
	const yDocStore = getContext('YDOC');
	// This is for clearing persistence on create & update submit.
	const persistenceStore = getContext('YDOCPERSISTENCE');

	yDocStore.set(article.doc);

	article.ready.then(({ legacyJSON }) => {
		persistenceStore.set(article.getPersistence());
		binding.initialize();

		if (legacyJSON) {
			// A draft saved by the previous editor replaces the article's content as a local edit.
			editor.update(
				() => {
					const root = getRoot();
					root.clear();

					for (const child of legacyJSON.root.children) {
						root.append(parseSerializedNode(child));
					}
				},
				{ discrete: true }
			);
		}
	});

	onDestroy(() => {
		editor.dispose();
		article.destroy();
	});

	/** @type {HTMLDivElement} */
	let rootElement;

	let isEditable = $state(editor.isEditable());

	onMount(() => {
		editor.setRootElement(rootElement);
		editorGlobals.isEditable = editor.isEditable();
		const unregisterEditableListener = editor.registerEditableListener((editable) => {
			isEditable = editable;
			editorGlobals.isEditable = editable;
		});

		return () => {
			unregisterEditableListener();
			editorGlobals.isEditable = false;
			editor.setRootElement(null);
		};
	});

	$effect(() => {
		getContext('COMPOSER').set({ getEditor: () => editor });
		editorGlobals.articleId = id;
	});

	// This reloads pages when we leave editor.
	onMount(() => {
		return () => {
			window.location.reload();
		};
	});
</script>

<div class="relative flex min-h-96 gap-4">
	<div class="min-w-0 flex-1">
		<div class="editor-border sticky top-0 z-40 hidden w-full xl:block">
			<div class="flex flex-wrap items-center gap-2 px-2">
				<Toolbar />
			</div>
		</div>

		{#if collabStatus.current === 'readonly' && collabWarning}
			<div class="editor-border bg-red-300! p-2 font-bold dark:text-black">
				This article can't be edited with this version of the editor ({collabWarning}). Reload the
				page, or reset the draft cache below.
			</div>
		{/if}

		<div class="overflow-hidden">
			<article class="editor-border box flex min-h-96 grow flex-col">
				<div class="prose dark:prose-invert relative flex max-w-[unset] grow">
					<div
						bind:this={rootElement}
						class="editor-shell m-0 grow overflow-hidden border-0 p-4 outline-0"
						contenteditable={isEditable}
						role="textbox"
						spellcheck="true"
						aria-readonly={isEditable ? undefined : true}
					></div>
				</div>
			</article>
		</div>

		<div class="editor-border sticky bottom-0 z-40 block w-full xl:hidden">
			<div class="flex flex-wrap items-center gap-2 px-2 text-sm">
				<MobileToolbar />
			</div>
		</div>

		<div class="editor-border sticky bottom-0 hidden w-full border-t-0 p-2 xl:block">
			<Footer />
		</div>
	</div>

	<div
		class="editor-border sticky top-0 hidden h-fit max-h-screen shrink-0 flex-col self-start xl:flex xl:w-96 xl:min-w-96"
	>
		<TreeviewWrapper />
	</div>
</div>

<EditorModal />
<ImageFixerModalButton />
