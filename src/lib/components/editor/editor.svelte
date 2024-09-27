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

	export let id;
	export let update;

	/** @type {any} */
	const initialConfig = articleConfig(null, true, null);

	/** @type {Composer | null} */
	let composer = null;
	$: getContext('COMPOSER').set(composer);

	const providerFactory = instantiateProvider(update);

	// This reloads pages when we leave editor.
	onMount(() => {
		return () => {
			window.location.reload();
		};
	});
</script>

<Composer {initialConfig} bind:this={composer}>
	<div class="editor-shell flex grow flex-col">
		<RichTextPlugin />

		<ListPlugin />

		<LinkPlugin validateUrl={isUrl} />

		<AutoFocus />

		<ImagePlugin />

		<VideoEmbedPlugin />

		<CollaborationPlugin {id} {providerFactory} shouldBootstrap={false} />

		<div
			class="sticky top-0 z-40 hidden w-full border p-2 lg:block dark:border-violet-950 dark:bg-black"
		>
			<Toolbar />
		</div>

		<article class="flex grow flex-col border dark:border-violet-950 dark:bg-black">
			<div class="prose relative flex max-w-[unset] grow overflow-auto p-2 dark:prose-invert">
				<ContentEditable className="grow m-0 p-0 border-0 outline-0" />
			</div>
		</article>

		<div
			class="sticky bottom-0 z-40 block w-full border p-2 lg:hidden dark:border-violet-950 dark:bg-black"
		>
			<Toolbar />
		</div>

		<div class="hidden w-full border border-t-0 p-2 lg:block dark:border-violet-950 dark:bg-black">
			<Footer />
		</div>
	</div>
</Composer>
