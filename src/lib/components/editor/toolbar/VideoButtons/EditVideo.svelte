<script>
	import { getEditor } from 'svelte-lexical';
	import { FileQuestionIcon, LinkIcon, RectangleHorizontalIcon, RectangleVerticalIcon, YoutubeIcon } from 'lucide-svelte';

	import Select from '$lib/components/Select.svelte';
	import TwitchGlitch from '$lib/components/icons/TwitchGlitch.svelte';
	import { VIDEO_CONSTANTS } from '$lib/constants/video';
	import { IMAGE_MIN_HEIGHT, IMAGE_MIN_WIDTH } from '$lib/constants/image';
	import { DOMAIN } from '$lib/environment/environment';
	import { getURLAndTitle } from '../../plugins/VideoEmbed/VideoEmbed';

	/**
	 * @typedef {Object} Props
	 * @property {import('$lib/lexical/custom').VideoEmbedNode} selectedVideoEmbedNode
	 */

	/** @type {Props} */
	let { selectedVideoEmbedNode } = $props();

	let editor = $derived(getEditor?.());

	/** @type {HTMLSelectElement | null} */
	let platformElement = $state(null);

	let currentPlatform = $derived(selectedVideoEmbedNode.__platform);
	let currentURL = $derived(selectedVideoEmbedNode.__src);

	let currentWidth = $derived(selectedVideoEmbedNode.__width);
	let currentHeight = $derived(selectedVideoEmbedNode.__height);

	let url = $derived(currentURL);

	let width = $derived(currentWidth);
	let height = $derived(currentHeight);

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
			selectedVideoEmbedNode.setSrc(getURLAndTitle(currentPlatform, url, DOMAIN).url || url || '');
		});
	};

	const SvelteComponent = $derived(currentPlatform ? platformIcons[currentPlatform] : platformIcons.default);
</script>

<div class="flex min-h-[42px] items-center gap-2 pl-2">
	<SvelteComponent />

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
		onchange={setURL}
		placeholder="https://..."
		type="url"
		bind:value={currentURL}
	/>
</label>

<label title="Width" class="flex min-h-[42px] items-center gap-2 pl-2">
	<span class="hidden">Width</span>
	<RectangleHorizontalIcon />

	<input
		class="input-color -ml-10 h-full w-28 p-0 pl-10 text-sm"
		placeholder={width === 'inherit' ? "Inherit" : ""}
		bind:value={width}
		onchange={onChange}
		min={IMAGE_MIN_WIDTH}
		type="number"
	/>
</label>

<label title="Height" class="flex min-h-[42px] items-center gap-2 pl-2">
	<span class="hidden">Height</span>
	<RectangleVerticalIcon />

	<input
		class="input-color -ml-10 h-full w-28 p-0 pl-10 text-sm"
		placeholder={height === 'inherit' ? "Inherit" : ""}
		onchange={onChange}
		min={IMAGE_MIN_HEIGHT}
		type="number"
		bind:value={height}
	/>
</label>
