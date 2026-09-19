<script>
	import { STATIC_DOMAIN } from '$lib/environment/environment';

	/**
	 * @typedef {Object} Props
	 * @property {string} imageURL
	 * @property {string} class
	 */

	/** @type {Props} */
	let { imageURL, class: className = '' } = $props();
</script>

<img src="{STATIC_DOMAIN}/reactions/{imageURL}" alt="" class={className} />
