<script>
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
	import Toolbar from './toolbar/index.svelte';
	import Footer from './footer/index.svelte';
	import { articleConfig } from './config/article';
	import ImagePlugin from './plugins/Image/ImagePlugin.svelte';
	import AutoFocus from './plugins/AutoFocus.svelte';
	import VideoEmbedPlugin from './plugins/VideoEmbed/VideoEmbedPlugin.svelte';
	import TablePlugin from './plugins/Table/TablePlugin.svelte';
	import FloatBlockPlugin from './plugins/FloatBlock/FloatBlockPlugin.svelte';

	export let id;
	export let update;
	/** @type {string | undefined} */
	export let initialUpdate = undefined;

	/** @type {any} */
	const initialConfig = articleConfig(null, true, null);

	/** @type {Composer | null} */
	let composer = null;
	$: getContext('COMPOSER').set(composer);

	const providerFactory = instantiateProvider(update, initialUpdate);

	// This reloads pages when we leave editor.
	onMount(() => {
		return () => {
			window.location.reload();
		};
	});
</script>

<Composer {initialConfig} bind:this={composer}>
	<div class="editor-shell flex grow flex-col overflow-hidden">
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

		<article class="editor-border flex grow flex-col">
			<div class="prose relative flex max-w-[unset] grow overflow-auto p-2 dark:prose-invert">
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
