<script>
	import './Article.css';

	import { getAllContexts, getContext, onDestroy, onMount } from 'svelte';
	import { mergeRegister } from 'lexical';
	import { buildEditorFromExtensions } from '@lexical/extension';

	import { instantiateProvider } from '$lib/yjs/providerFactory';
	import { registerCollaboration } from '$lib/yjs/registerCollaboration';
	import { EDITOR_IS_EDITABLE } from '$lib/constants/constants';
	import { setEditor } from './context';
	import { registerSvelteDecorators } from './core/registerSvelteDecorators.svelte';
	import EditorModal from '../EditorModal.svelte';
	import Toolbar from './toolbar/index.svelte';
	import TreeviewWrapper from './toolbar/TreeviewWrapper.svelte';
	import MobileToolbar from './toolbar/MobileToolbar.svelte';
	import Footer from './footer/index.svelte';
	import { articleExtension, editableTheme } from './config/article';
	import ImagePlugin from './plugins/Image/ImagePlugin.svelte';
	import VideoEmbedPlugin from './plugins/VideoEmbed/VideoEmbedPlugin.svelte';
	import TablePlugin from './plugins/Overrides/Table/TablePlugin.svelte';
	import FloatBlockPlugin from './plugins/FloatBlock/FloatBlockPlugin.svelte';
	import SelectionOverrides from './plugins/SelectionOverrides.svelte';
	import GalleryPlugin from './plugins/Gallery/GalleryPlugin.svelte';
	import ImageFixerModalButton from './ImageFixer/index.svelte';
	import TreeviewPlugin from './Treeview/TreeviewPlugin.svelte';
	import EditorShortcuts from './plugins/EditorShortcuts.svelte';
	import { editorGlobals } from './editorGlobals.svelte';

	/**
	 * @typedef {Object} Props
	 * @property {any} id
	 * @property {any} update
	 * @property {any} [initialUpdate]
	 */

	/** @type {Props} */
	let { id, update, initialUpdate = null } = $props();

	const editor = buildEditorFromExtensions(
		articleExtension(editableTheme, EDITOR_IS_EDITABLE, null)
	);
	setEditor(editor);

	/** @type {Map<string, YDoc>} */
	const docMap = new Map();
	// svelte-ignore state_referenced_locally
	const provider = instantiateProvider(update, initialUpdate)(id, docMap);

	// Registered before the plugins below mount.
	// svelte-ignore state_referenced_locally
	onDestroy(
		mergeRegister(
			registerSvelteDecorators(editor, getAllContexts()),
			registerCollaboration(editor, { id, provider, docMap }),
			() => editor.dispose()
		)
	);

	/** @type {HTMLDivElement} */
	let rootElement;

	let isEditable = $state(editor.isEditable());

	onMount(() => {
		editor.setRootElement(rootElement);
		const unregisterEditableListener = editor.registerEditableListener((editable) => {
			isEditable = editable;
		});

		return () => {
			unregisterEditableListener();
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
	<ImagePlugin />

	<VideoEmbedPlugin />

	<TablePlugin hasCellBackgroundColor={false} />

	<FloatBlockPlugin />

	<SelectionOverrides />

	<TreeviewPlugin />

	<GalleryPlugin />

	<EditorShortcuts />

	<div class="min-w-0 flex-1">
		<div class="editor-border sticky top-0 z-40 hidden w-full xl:block">
			<div class="flex flex-wrap items-center gap-2 px-2">
				<Toolbar />
			</div>
		</div>

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
