<script>
	import { run } from 'svelte/legacy';

	import { getContext, onMount } from 'svelte';
	import isUrl from 'is-url';
	import {
		CollaborationPlugin,
		Composer,
		ContentEditable,
		LinkPlugin,
		ListPlugin,
		RichTextPlugin,
	} from 'svelte-lexical';

	import { instantiateProvider } from '$lib/yjs/providerFactory';
	import { EDITOR_IS_EDITABLE } from '$lib/constants/constants';
	import Toolbar from './toolbar/index.svelte';
	import Footer from './footer/index.svelte';
	import { articleConfig, editableTheme } from './config/article';
	import ImagePlugin from './plugins/Image/ImagePlugin.svelte';
	import AutoFocus from './plugins/AutoFocus.svelte';
	import VideoEmbedPlugin from './plugins/VideoEmbed/VideoEmbedPlugin.svelte';
	import TablePlugin from './plugins/Overrides/Table/TablePlugin.svelte';
	import FloatBlockPlugin from './plugins/FloatBlock/FloatBlockPlugin.svelte';

	/**
	 * @typedef {Object} Props
	 * @property {any} id
	 * @property {any} update
	 * @property {any} [initialUpdate]
	 */

	/** @type {Props} */
	let { id, update, initialUpdate = null } = $props();

	/** @type {any} */
	const initialConfig = articleConfig(editableTheme, EDITOR_IS_EDITABLE, null);

	/** @type {Composer | null} */
	let composer = $state(null);

	const providerFactory = instantiateProvider(update, initialUpdate);

  $effect(() => {
    getContext('COMPOSER').set(composer);
  });
  
	// This reloads pages when we leave editor.
	onMount(() => {
		return () => {
			window.location.reload();
		};
	});
</script>

<Composer {initialConfig} bind:this={composer}>
	<div class="editor-shell w-full">
		<RichTextPlugin />

		<ListPlugin />

		<LinkPlugin validateUrl={isUrl} />

		<AutoFocus />

		<ImagePlugin />

		<VideoEmbedPlugin />

		<TablePlugin hasCellBackgroundColor={false} />

		<FloatBlockPlugin />

		<CollaborationPlugin {id} {providerFactory} shouldBootstrap={false} />

		<div class="editor-border sticky top-0 z-40 hidden w-full p-2 lg:block">
			<Toolbar />
		</div>

		<article class="editor-border flex grow flex-col min-h-96">
			<div class="prose dark:prose-invert relative flex max-w-[unset] grow overflow-auto p-2">
				<ContentEditable className="grow m-0 p-0 border-0 outline-0" />
			</div>
		</article>

		<div class="editor-border sticky bottom-0 z-40 block w-full p-2 lg:hidden">
			<Toolbar />
		</div>

		<div class="editor-border hidden w-full border-t-0 p-2 lg:block">
			<Footer />
		</div>
	</div>
</Composer>
