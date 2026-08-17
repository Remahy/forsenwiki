<script>
	import {
		FileIcon,
		FileQuestionMarkIcon,
		LinkIcon,
		RectangleHorizontalIcon,
		RectangleVerticalIcon,
	} from '@lucide/svelte';
	import { $getNodeByKey as getNodeByKey } from 'lexical';
	import { getEditor } from 'svelte-lexical';

	import Select from '$lib/components/Select.svelte';
	import TwitchGlitch from '$lib/components/icons/TwitchGlitch.svelte';
	import {
		VIDEO_CONSTANTS,
		VIDEO_MAX_HEIGHT,
		VIDEO_MIN_HEIGHT,
		VIDEO_MIN_WIDTH,
	} from '$lib/constants/video';
	import { DOMAIN } from '$lib/environment/environment';
	import YouTube from '$lib/components/icons/YouTube.svelte';
	import { getURLAndTitle } from '../../plugins/VideoEmbed/VideoEmbed';
	import Button from '$lib/components/Button.svelte';
	import EditVideoModal from './EditVideoModal.svelte';
	import { modal } from '$lib/stores/modal';

	/**
	 * @typedef {Object} Props
	 * @property {import('$lib/lexical/custom').VideoEmbedNode} selectedNode
	 */

	/** @type {Props} */
	let { selectedNode } = $props();

	let editor = $derived(getEditor?.());

	/** @type {HTMLSelectElement | null} */
	let platformElement = $state(null);

	let currentPlatform = $derived(selectedNode.__platform);
	let currentURL = $derived(selectedNode.__src);

	let currentWidth = $derived(selectedNode.__width);
	let currentHeight = $derived(selectedNode.__height);

	let url = $derived(currentURL);

	let width = $derived(currentWidth);
	let height = $derived(currentHeight);

	const platformIcons = {
		youtube: YouTube,
		twitch: TwitchGlitch,
		usercontent: FileIcon,
		default: FileQuestionMarkIcon,
	};

	const { PLATFORMS } = VIDEO_CONSTANTS;
	const platformOptions = Object.entries(PLATFORMS);

	const onChange = () => {
		editor.update(() => {
			selectedNode.setWidthAndHeight({ width, height });
		});
	};

	/**
	 * @param {Event} e
	 */
	const setPlatform = (e) => {
		const { value } = /** @type {HTMLSelectElement} */ (e.currentTarget);

		editor.update(() => {
			selectedNode.setPlatform(value);
		});
	};

	const setURL = () => {
		editor.update(() => {
			selectedNode.setSrc(getURLAndTitle(currentPlatform, url, DOMAIN).url || url || '');
		});
	};

	const SvelteComponent = $derived(
		currentPlatform ? platformIcons[currentPlatform] : platformIcons.default
	);

	const video = () => {
		editor.read(() => {
			modal.set({
				component: EditVideoModal,
				src: selectedNode.getSrc(),
				/** @param {import('../../plugins/VideoEmbed/VideoEmbed').VideoEmbedPayload} data */
				onSubmit: (data) => {
					editor.update(() => {
						/** @type {import('../../plugins/Image/Image').ImageNode} */
						const node = /** @type {any} */ (getNodeByKey(selectedNode.getKey()));

						const { src } = data;

						node.setSrc(src);
					});
				},
				isOpen: true,
			});
		});
	};
</script>

<div class="flex flex-col gap-4">
	<div class="relative flex items-center w-full gap-2">
		<SvelteComponent class="absolute left-4" />

		<Select
			title="Platform"
			bind:ref={platformElement}
			on:change={setPlatform}
			bind:value={currentPlatform}
			class="min-h-10.5 px-12! w-full"
		>
			<option value="unknown" hidden>Unknown</option>

			{#each platformOptions as [value, label] (value)}
				<option {value} class="text-lg">{label}</option>
			{/each}
		</Select>
	</div>

	{#if currentPlatform === 'usercontent'}
		<Button on:click={video} class="text-xs">Select content</Button>
	{:else}
		<label title="URL" class="relative flex w-full items-center gap-2">
			<span class="hidden">URL</span>
			<LinkIcon class="absolute left-4" />

			<input
				class="input-color min-h-10.5 w-full py-1 pl-12 text-sm"
				onchange={setURL}
				placeholder="https://..."
				type="url"
				bind:value={currentURL}
			/>
		</label>
	{/if}

	<div class="flex gap-2">
		<label title="Width" class="relative flex w-full items-center gap-2">
			<span class="hidden">Width</span>
			<RectangleHorizontalIcon class="absolute left-4" />

			<input
				class="input-color min-h-10.5 w-full pl-12 text-sm"
				placeholder={width === 'inherit' ? 'Inherit' : ''}
				bind:value={width}
				onchange={onChange}
				min={VIDEO_MIN_WIDTH}
				type="number"
			/>
		</label>

		<label title="Height" class="relative flex w-full items-center gap-2">
			<span class="hidden">Height</span>
			<RectangleVerticalIcon class="absolute left-4" />

			<input
				class="input-color min-h-10.5 w-full pl-12 text-sm"
				placeholder={height === 'inherit' ? 'Inherit' : ''}
				onchange={onChange}
				min={VIDEO_MIN_HEIGHT}
				max={VIDEO_MAX_HEIGHT}
				type="number"
				bind:value={height}
			/>
		</label>
	</div>
</div>
