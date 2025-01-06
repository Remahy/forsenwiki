<script>
	import { getEditor } from 'svelte-lexical';
	import { FileQuestionIcon, LinkIcon, RectangleHorizontalIcon, RectangleVerticalIcon, YoutubeIcon } from 'lucide-svelte';

	import Select from '$lib/components/Select.svelte';
	import TwitchGlitch from '$lib/components/icons/TwitchGlitch.svelte';
	import { VIDEO_CONSTANTS } from '$lib/constants/video';
	import { IMAGE_MIN_HEIGHT, IMAGE_MIN_WIDTH } from '$lib/constants/image';
	import { DOMAIN } from '$lib/environment/environment';
	import { getURLAndTitle } from '../../plugins/VideoEmbed/VideoEmbed';

	/** @type {import("$lib/lexical/custom").VideoEmbedNode} */
	export let selectedVideoEmbedNode;

	const editor = getEditor();

	/** @type {HTMLSelectElement} */
	let platformElement;

	$: currentPlatform = selectedVideoEmbedNode.__platform;
	$: currentURL = selectedVideoEmbedNode.__src;

	$: currentWidth = selectedVideoEmbedNode.__width;
	$: currentHeight = selectedVideoEmbedNode.__height;

	$: url = currentURL;

	$: width = currentWidth;
	$: height = currentHeight;

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
		editor.update(() => {
			selectedVideoEmbedNode.setWidthAndHeight({ width, height });
		});
	};

	/**
	 * @param {Event} e
	 */
	const setPlatform = (e) => {
		const { value } = /** @type {HTMLSelectElement} */ (e.currentTarget);

		editor.update(() => {
			selectedVideoEmbedNode.setPlatform(value);
		});
	};

	const setURL = () => {
		editor.update(() => {
			selectedVideoEmbedNode.setSrc(getURLAndTitle(currentPlatform, url, DOMAIN).url || url);
		});
	};
</script>

<div class="flex min-h-[42px] items-center gap-2 pl-2">
	<svelte:component this={platformIcons[currentPlatform] || platformIcons.default} />

	<Select
		title="Platform"
		bind:ref={platformElement}
		on:change={setPlatform}
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
		bind:value={url}
		on:change={setURL}
		placeholder="https://..."
		type="url"
	/>
</label>

<label title="Width" class="flex min-h-[42px] items-center gap-2 pl-2">
	<span class="hidden">Width</span>
	<RectangleHorizontalIcon />

	<input
		class="input-color -ml-10 h-full w-28 p-0 pl-10 text-sm"
		bind:value={width}
		on:change={onChange}
		min={IMAGE_MIN_WIDTH}
		type="number"
	/>
</label>

<label title="Height" class="flex min-h-[42px] items-center gap-2 pl-2">
	<span class="hidden">Height</span>
	<RectangleVerticalIcon />

	<input
		class="input-color -ml-10 h-full w-28 p-0 pl-10 text-sm"
		bind:value={height}
		on:change={onChange}
		min={IMAGE_MIN_HEIGHT}
		type="number"
	/>
</label>

{#if currentWidth === 'inherit' && currentHeight === 'inherit'}
	<div class="self-end" title="Width and height have been set to inherit the original size.">
		<small>inherit</small>
	</div>
{/if}
