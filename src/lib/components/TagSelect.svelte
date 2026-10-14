<script>
	import { SYSTEM_TAGS } from '$lib/constants/constants';

	/** @type {{ [tag: string]: { label: string, description: string } }} */
	const TAG_INFO = {
		[SYSTEM_TAGS.SATIRE]: {
			label: 'Satire',
			description: 'Shows a disclaimer that the article is satire.',
		},
		[SYSTEM_TAGS.NSFW]: {
			label: 'NSFW',
			description: 'Blurs the article until the reader chooses to proceed.',
		},
	};

	/** @type {{ tags: string[], onchange?: () => void }} */
	let { tags = $bindable([]), onchange } = $props();

	/**
	 * @param {string} tag
	 * @param {boolean} checked
	 */
	const toggle = (tag, checked) => {
		tags = checked ? [...tags.filter((t) => t !== tag), tag] : tags.filter((t) => t !== tag);
		onchange?.();
	};
</script>

<fieldset>
	<legend class="font-bold">Tags</legend>
	<div class="flex flex-wrap gap-x-6 gap-y-1">
		{#each Object.values(SYSTEM_TAGS) as tag (tag)}
			<label class="flex items-center gap-2" title={TAG_INFO[tag].description}>
				<input
					type="checkbox"
					checked={tags.includes(tag)}
					onchange={(e) => toggle(tag, e.currentTarget.checked)}
				/>
				<span>{TAG_INFO[tag].label}</span>
				<small class="hidden sm:inline">({TAG_INFO[tag].description})</small>
			</label>
		{/each}
	</div>
</fieldset>
