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
	import { EDITOR_IS_EDITABLE } from '$lib/constants/constants';
	import Toolbar from './toolbar/index.svelte';
	import ToolbarExtra from './toolbar/Extra.svelte';
	import MobileToolbar from './toolbar/MobileToolbar.svelte';
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

	const providerFactory = $derived.by(() => instantiateProvider(update, initialUpdate));

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
	<div class="relative flex min-h-96 gap-2">
		<RichTextPlugin />

		<ListPlugin />

		<LinkPlugin validateUrl={isUrl} />

		<AutoFocus />

		<ImagePlugin />

		<VideoEmbedPlugin />

		<TablePlugin hasCellBackgroundColor={false} />

		<FloatBlockPlugin />

		<CollaborationPlugin {id} {providerFactory} shouldBootstrap={false} />

		<div class="w-full lg:w-148 xl:w-212 2xl:w-280">
			<div class="editor-border sticky top-0 z-40 hidden w-full p-2 lg:block">
				<div class="flex flex-wrap items-stretch gap-2">
					<Toolbar />
				</div>
			</div>

			<div class="overflow-hidden">
				<article class="editor-border box flex min-h-96 grow flex-col">
					<div class="prose dark:prose-invert relative flex max-w-[unset] grow">
						<ContentEditable
							className="editor-shell grow m-0 border-0 outline-0 p-4 overflow-hidden"
						/>
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
			class="editor-border sticky top-0 hidden h-full w-96 max-w-96 grow flex-col flex-wrap gap-4 p-2 lg:flex"
		>
			<ToolbarExtra />
		</div>
	</div>
</Composer>
