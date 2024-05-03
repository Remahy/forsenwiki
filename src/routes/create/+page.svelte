<script>
	import {
		AutoFocusPlugin,
		Composer,
		ContentEditable,
		HeadingNode,
		LinkNode,
		LinkPlugin,
		ListItemNode,
		ListNode,
		ListPlugin,
		PlaceHolder,
		RichTextPlugin,
		ToolbarRichText,
		validateUrl
	} from 'svelte-lexical';

	/** @type {{ namespace: string, theme: any, nodes: any[], editable?: boolean, onError: any }} */
	const initialConfig = {
		namespace: 'editor',
		editable: true,
		nodes: [LinkNode, ListNode, ListItemNode, HeadingNode],
		onError: (/** @type {Error} */ error) => {
			throw error;
		}
	};

	let editorDiv;
</script>

<Composer {initialConfig}>
	<article class="flex w-full flex-col">
		<div class="w-full">
			<ToolbarRichText />
		</div>

		<div class="relative flex grow prose max-w-[unset] p-2" bind:this={editorDiv}>
			<ContentEditable className="grow m-0 p-0 border-0 outline-0" />
		</div>

		<RichTextPlugin />

		<LinkPlugin {validateUrl} />
		<ListPlugin />

		<AutoFocusPlugin />
		<!--
	<CollaborationPlugin
    id="main"
    providerFactory={createWebsocketProvider}
    shouldBootstrap={!skipCollaborationInit} />
	-->
	</article>
</Composer>
