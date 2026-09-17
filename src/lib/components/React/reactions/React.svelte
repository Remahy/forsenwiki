<script>
	import { STATIC_DOMAIN } from '$lib/environment/environment';

	/**
	 * @typedef {Object} Props
	 * @property {string} imageURL
	 */

	/** @type {Props} */
	let { imageURL } = $props();
</script>

<img src="{STATIC_DOMAIN}/reactions/{imageURL}" alt="" />
