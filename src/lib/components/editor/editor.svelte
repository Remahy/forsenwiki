<script>
	import { getContext } from 'svelte';
	import {
		$getRoot as getRoot,
		$createParagraphNode as createParagraphNode,
		$createTextNode as createTextNode,
		AutoFocusPlugin,
		CollaborationPlugin,
		Composer,
		ContentEditable,
		HeadingNode,
		LinkNode,
		LinkPlugin,
		ListItemNode,
		ListNode,
		ListPlugin,
		QuoteNode,
		RichTextPlugin,
		validateUrl
	} from 'svelte-lexical';
	import { CLEAR_HISTORY_COMMAND } from 'lexical';

	import Toolbar from './toolbar/index.svelte';
	import { instantiateProvider } from '$lib/yjs/providerFactory';

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

	/** @type {{ namespace: string, theme: any, nodes: any[], editable?: boolean, onError: any, editorState: any }} */
	const initialConfig = {
		theme: {
			paragraph: 'm-0'
		},
		namespace: 'editor',
		editable: true,
		nodes: [LinkNode, ListNode, ListItemNode, HeadingNode, QuoteNode],
		/** @param {Error} error */
		onError: (error) => {
			throw error;
		},
		editorState: null
	};

	/** @type {Composer | null} */
	let composer = null;
	$: getContext('COMPOSER').set(composer);

	const providerFactory = instantiateProvider(update);
</script>

<Composer {initialConfig} bind:this={composer}>
	<div class="flex flex-col grow">
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
	</div>
</Composer>
