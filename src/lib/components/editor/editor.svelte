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

	export let id;
	export let update;

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

		<CollaborationPlugin {id} {providerFactory} shouldBootstrap={false} />

		<div class="w-full border border-b-0 p-2 dark:border-violet-950 dark:bg-black">
			<Toolbar />
		</div>

		<article class="flex grow flex-col border dark:border-violet-950 dark:bg-black">
			<div class="prose relative flex max-w-[unset] grow p-2 dark:prose-invert overflow-auto">
				<ContentEditable className="grow m-0 p-0 border-0 outline-0" />
			</div>
		</article>

		<div class="w-full border border-t-0 p-2 dark:border-violet-950 dark:bg-black">
			<Footer />
		</div>
	</div>
</Composer>
