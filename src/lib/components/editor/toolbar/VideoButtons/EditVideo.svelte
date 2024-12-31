<script>
	import { onMount } from 'svelte';
	import { getEditor } from 'svelte-lexical';
	import { FileQuestionIcon, LinkIcon, RectangleHorizontalIcon, RectangleVerticalIcon, YoutubeIcon } from 'lucide-svelte';

	import { VideoEmbedNode } from '$lib/lexical/custom';
	import Select from '$lib/components/Select.svelte';
	import TwitchGlitch from '$lib/components/icons/TwitchGlitch.svelte';
	import { VIDEO_CONSTANTS } from '$lib/constants/video';

	/** @type {import("$lib/lexical/custom").VideoEmbedNode} */
	export let selectedVideoEmbedNode;

	const editor = getEditor();

	/** @type {HTMLSelectElement} */
	let platformElement;

	let currentPlatform = selectedVideoEmbedNode.__platform;
	let currentURL = selectedVideoEmbedNode.__src;

	let currentWidth = selectedVideoEmbedNode.__width;
	let currentHeight = selectedVideoEmbedNode.__height;

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

	const onChange = () => {
		if (!editor) {
			return;
		}

		editor.update(() => {
			selectedVideoEmbedNode.setWidthAndHeight({ width: currentWidth, height: currentHeight });
		});
	};

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
		const unregister = editor.registerNodeTransform(VideoEmbedNode, (node) => {
			if (node.getKey() === selectedVideoEmbedNode.getKey()) {
				selectedVideoEmbedNode = node;
			}
		});

		return () => {
			unregister()
		}
	});
</script>

<div class="flex min-h-[42px] items-center gap-2 pl-2">
	<svelte:component this={platformIcons[currentPlatform] || platformIcons.default} />

	<Select
		title="Platform"
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

<label title="URL" class="flex min-h-[42px] items-center gap-2 pl-2">
	<span class="hidden">URL</span>
	<LinkIcon />

	<input
		class="input-color -ml-10 h-full w-auto py-1 pl-10 pr-0 text-sm lg:h-full"
		bind:value={currentURL}
		on:change={url}
		placeholder="https://..."
		type="url"
	/>
</label>

<label title="Width" class="flex min-h-[42px] items-center gap-2 pl-2">
	<span class="hidden">Width</span>
	<RectangleHorizontalIcon />

	<input
		class="input-color -ml-10 h-full w-28 p-0 pl-10 text-sm"
		bind:value={currentWidth}
		on:change={onChange}
		type="number"
	/>
</label>

<label title="Height" class="flex min-h-[42px] items-center gap-2 pl-2">
	<span class="hidden">Height</span>
	<RectangleVerticalIcon />

	<input
		class="input-color -ml-10 h-full w-28 p-0 pl-10 text-sm"
		bind:value={currentHeight}
		on:change={onChange}
		type="number"
	/>
</label>

{#if currentWidth === 'inherit' && currentHeight === 'inherit'}
	<div class="self-end" title="Width and height have been set to inherit the original size.">
		<small>inherit</small>
	</div>
{/if}
