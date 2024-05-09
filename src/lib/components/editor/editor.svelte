<script>
	import { getContext } from 'svelte';
	import {
		CLEAR_HISTORY_COMMAND,
		$getRoot as getRoot,
		$createParagraphNode as createParagraphNode,
		$createTextNode as createTextNode
	} from 'lexical';
	import {
		AutoFocusPlugin,
		CollaborationPlugin,
		Composer,
		ContentEditable,
		LinkPlugin,
		ListPlugin,
		RichTextPlugin,
		validateUrl
	} from 'svelte-lexical';

	import { instantiateProvider } from '$lib/yjs/providerFactory';
	import Toolbar from './toolbar/index.svelte';
	import Footer from './footer/index.svelte';
	import { articleConfig } from './config/article';

	export let id;
	export let update;

	/**
	 * @param {LexicalEditor} editor
	 */
	function initialState(editor) {
		editor.update(
			() => {
				const root = getRoot();
				const paragraph = createParagraphNode();
				const text = createTextNode();
				text.setTextContent('Edit me!');
				paragraph.append(text);
				root.append(paragraph);
			},
			// `historic` tag is here to make sure this edit can't be actioned upon by undo/redo.
			{ tag: 'historic' }
		);

		editor.dispatchCommand(CLEAR_HISTORY_COMMAND, undefined);
	}

	const initialConfig = articleConfig({}, true, null);

	/** @type {Composer | null} */
	let composer = null;
	$: getContext('COMPOSER').set(composer);

	const providerFactory = instantiateProvider(update);
</script>

<Composer {initialConfig} bind:this={composer}>
	<div class="flex grow flex-col">
		<div class="w-full border border-b-0 p-2">
			<Toolbar />
		</div>

		<article class="flex grow flex-col border">
			<div class="prose relative flex max-w-[unset] grow p-2">
				<ContentEditable className="grow m-0 p-0 border-0 outline-0" />
			</div>

			<RichTextPlugin />

			<LinkPlugin {validateUrl} />
			<ListPlugin />

			<AutoFocusPlugin />

			<CollaborationPlugin
				{id}
				{providerFactory}
				shouldBootstrap={!update}
				initialEditorState={initialState}
			/>
		</article>

		<div class="w-full border border-t-0 p-2">
			<Footer />
		</div>
	</div>
</Composer>
