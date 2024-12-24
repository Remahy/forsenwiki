<script>
	import { getContext, onMount } from 'svelte';
	import { FileQuestionIcon, LinkIcon, YoutubeIcon } from 'lucide-svelte';
	import { VideoEmbedNode } from '$lib/lexical/custom';
	import Select from '$lib/components/Select.svelte';
	import TwitchGlitch from '$lib/components/icons/TwitchGlitch.svelte';
	import { VIDEO_CONSTANTS } from '$lib/constants/video';

	/**
	 * @typedef {Object} Props
	 * @property {import("$lib/lexical/custom").VideoEmbedNode} selectedVideoEmbedNode
	 */

	/** @type {Props} */
	let { selectedVideoEmbedNode = $bindable() } = $props();

	/** @type {ComposerWritable} */
	const c = getContext('COMPOSER');
	let composer = $derived($c);
	let editor = $derived(composer?.getEditor?.());
	let canEdit = $derived(editor?.isEditable());

	/** @type {HTMLSelectElement | null} */
	let platformElement = $state(null);

	let currentPlatform = $state(selectedVideoEmbedNode.__platform);
	let currentURL = $state(selectedVideoEmbedNode.__src);

	/**
	 * @type {{[x: string]: typeof import('svelte').SvelteComponent<any>}}
	 */
	const platformIcons = {
		youtube: YoutubeIcon,
		twitch: TwitchGlitch,
		default: FileQuestionIcon,
	};

	const { PLATFORMS } = VIDEO_CONSTANTS;
	const platformOptions = Object.entries(PLATFORMS);

	/**
	 * @param {Event} e
	 */
	const platform = (e) => {
		const { value } = /** @type {HTMLSelectElement} */ (e.currentTarget);

		if (!editor) {
			return;
		}

		editor.update(() => {
			selectedVideoEmbedNode.setPlatform(value);
		});
	};

	/**
	 * @param {Event} e
	 */
	const url = (e) => {
		const { value } = /** @type {HTMLInputElement} */ (e.target);

		if (!editor) {
			return;
		}

		editor.update(() => {
			selectedVideoEmbedNode.setSrc(value);
		});
	};

	onMount(() => {
		c.subscribe((composer) => {
			if (composer === null) {
				return;
			}

			const editor = composer.getEditor();

			editor.registerNodeTransform(VideoEmbedNode, (node) => {
				if (node.getKey() === selectedVideoEmbedNode.getKey()) {
					selectedVideoEmbedNode = node;
				}
			});
		});
	});

	const SvelteComponent = $derived(platformIcons[currentPlatform] || platformIcons.default);
</script>

<div class="flex h-full items-center gap-2 pl-2">
	<SvelteComponent />

	<Select
		title="Platform"
		disabled={!canEdit}
		bind:ref={platformElement}
		on:change={platform}
		bind:value={currentPlatform}
		class="!-ml-10 h-full !px-10"
	>
		<option value="unknown" hidden>Unknown</option>

		{#each platformOptions as [value, label]}
			<option {value} class="text-lg">{label}</option>
		{/each}
	</Select>
</div>

<label title="URL" class="flex h-full items-center gap-2 pl-2">
	<span class="hidden">URL</span>
	<LinkIcon />

	<input
		class="input-color -ml-10 h-full w-auto py-1 pl-10 pr-0 text-sm lg:h-full"
		bind:value={currentURL}
		onchange={url}
		placeholder="https://..."
		type="url"
	/>
</label>
