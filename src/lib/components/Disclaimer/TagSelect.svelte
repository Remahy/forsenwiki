<script>
	import { DISCLAIMER_TAGS } from '#lib/constants/constants.js';

	/** @type {{ [tag: string]: { label: string, description: string } }} */
	const DISCLAIMER_TAG_INFO = {
		[DISCLAIMER_TAGS.SATIRE]: {
			label: 'Satire',
			description: 'Shows a disclaimer that the article is satire.',
		},
		[DISCLAIMER_TAGS.NSFW]: {
			label: 'NSFW',
			description: 'Hides the article until the reader chooses to proceed.',
		},
	};

	const TAGS = Object.keys(DISCLAIMER_TAG_INFO);

	/** @type {{ disclaimerTags: string[], onchange?: () => void }} */
	let { disclaimerTags = $bindable([]), onchange } = $props();

	/**
	 * @param {string} tag
	 * @param {boolean} checked
	 */
	const toggle = (tag, checked) => {
		disclaimerTags = checked
			? [...disclaimerTags.filter((t) => t !== tag), tag]
			: disclaimerTags.filter((t) => t !== tag);

		onchange?.();
	};
</script>

<fieldset>
	<legend class="font-bold">Tags</legend>
	<div class="flex flex-wrap gap-x-6 gap-y-1">
		{#each Object.values(TAGS) as tag (tag)}
			<label class="flex items-center gap-2" title={DISCLAIMER_TAG_INFO[tag].description}>
				<input
					type="checkbox"
					checked={disclaimerTags.includes(tag)}
					onchange={(e) => toggle(tag, e.currentTarget.checked)}
				/>
				<span>{DISCLAIMER_TAG_INFO[tag].label}</span>
				<small class="hidden sm:inline">({DISCLAIMER_TAG_INFO[tag].description})</small>
			</label>
		{/each}
	</div>
</fieldset>
