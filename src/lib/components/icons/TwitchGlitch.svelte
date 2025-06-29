<script>
	const aspectRatio = 2400 / 2800;

	/**
	 * @typedef {Object} Props
	 * @property {string} [size]
	 */

	/** @type {Props} */
	let { size = '24' } = $props();

	const height = Number(size) / aspectRatio;
</script>

<svg
	version="1.1"
	width={size}
	{height}
	xmlns="http://www.w3.org/2000/svg"
	xmlns:xlink="http://www.w3.org/1999/xlink"
	viewBox="0 0 2400 2800"
	style="enable-background:new 0 0 2400 2800;"
	xml:space="preserve"
	class="text-white"
>
	<g>
		<polygon
			fill="currentColor"
			points="2200,1300 1800,1700 1400,1700 1050,2050 1050,1700 600,1700 600,200 2200,200"
		/>
		<g>
			<g>
				<path
					d="M500,0L0,500v1800h600v500l500-500h400l900-900V0H500z M2200,1300l-400,400h-400l-350,350v-350H600V200h1600V1300z"
				/>
				<rect x="1700" y="550" width="200" height="600" />
				<rect x="1150" y="550" width="200" height="600" />
			</g>
		</g>
	</g>
</svg>
