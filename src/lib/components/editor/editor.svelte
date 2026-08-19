<script>
	import './Article.css';

	import { onMount } from 'svelte';

	import { instantiateProvider } from '$lib/yjs/providerFactory';
	import Toolbar from './toolbar/index.svelte';
	import TreeWrapper from './toolbar/TreeWrapper.svelte';
	import MobileToolbar from './toolbar/MobileToolbar.svelte';
	import Footer from './footer/index.svelte';
	import { editorGlobals } from './editorGlobals.svelte';
	import { registerImagePlugin } from './plugins/Image/ImagePlugin';
	import { registerVideoEmbedPlugin } from './plugins/VideoEmbed/VideoEmbedPlugin';
	import { registerTablePluginWithOverrides } from './plugins/Overrides/Table/TablePlugin';
	import { registerFloatBlockPlugin } from './plugins/FloatBlock/FloatBlockPlugin';
	import { registerSelectionOverridesPlugin } from './plugins/SelectionOverridesPlugin';
	import ImageFixerModalButton from './ImageFixer/index.svelte';
	import Box from '../Box.svelte';

	import { mergeRegister } from 'lexical';
	import { buildEditor } from './editor';
	import { registerCollaborationPlugin } from './plugins/YJs/CollaborationPlugin';

	/**
	 * @typedef {Object} Props
	 * @property {any} id
	 * @property {any} update
	 * @property {any} [initialUpdate]
	 */

	/** @type {Props} */
	let { id, update, initialUpdate = null } = $props();

	const providerFactory = $derived.by(() => instantiateProvider(update, initialUpdate));

	/** @type {HTMLElement} */
	let editorRef;

	const editor = buildEditor();

	$effect(() => {
		editor.setRootElement(editorRef);
		editorGlobals.editor = editor;
		editorGlobals.articleId = id;

		const unregister = mergeRegister(
			registerImagePlugin(),
			registerTablePluginWithOverrides({ hasCellBackgroundColor: false }),
			registerVideoEmbedPlugin(),
			registerFloatBlockPlugin(),
			registerSelectionOverridesPlugin(),
			registerCollaborationPlugin({
				editor,
				id,
				provider,
				doc: providerFactory
			}),
		);

		return () => {
			unregister();
		};
	});

	onMount(() => {
		// This reloads pages when we leave editor.
		return () => {
			window.location.reload();
		};
	});
</script>

<Box class="bg-blue-500/15! p-4">
	<p><strong>New editor tree for nodes!</strong> There will be bugs! More features coming soon!</p>
</Box>

<div class="relative flex min-h-96 gap-4">
	<div class="w-full">
		<div class="editor-border sticky top-0 z-40 hidden w-full p-2 lg:block">
			<div class="flex flex-wrap items-stretch gap-2">
				<Toolbar />
			</div>
		</div>

		<div class="overflow-hidden">
			<article class="editor-border box flex min-h-96 grow flex-col">
				<div class="prose dark:prose-invert relative flex max-w-[unset] grow">
					<div
						bind:this={editorRef}
						class="editor-shell m-0 grow overflow-hidden border-0 p-4 outline-0"
						role="textbox"
						data-lexical-editor="true"
						contenteditable="true"
					></div>
				</div>
			</article>
		</div>

		<div class="editor-border sticky bottom-0 z-40 block w-full p-2 lg:hidden">
			<div class="flex flex-wrap items-stretch gap-2 text-sm">
				<MobileToolbar />
			</div>
		</div>

		<div class="editor-border sticky bottom-0 hidden w-full border-t-0 p-2 lg:block">
			<Footer />
		</div>
	</div>

	<div
		class="editor-border sticky top-0 hidden max-h-screen grow flex-col gap-4 xl:flex xl:w-96 xl:min-w-96"
	>
		<TreeWrapper />
	</div>
</div>

<ImageFixerModalButton />
