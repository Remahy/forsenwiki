<script>
	import { PUZZLE_PIECES, PUZZLE_VIEWBOX } from '$lib/constants/puzzlePieces';

	/**
	 * @typedef {Object} Props
	 * @property {number} [seed] Decides the order the pieces fall in. It has to be the same on the server and in the browser.
	 */

	/** @type {Props} */
	let { seed = 0 } = $props();

	// Keyed by the ids in $lib/constants/puzzlePieces.js. Hover a piece to see its label.
	// `transform` is added after the one that fits the image, e.g. 'scale(1.2) translateX(10%)'.
	/** @type {Record<string, { href: string, label: string, image: string, transform?: string }>} */
	const pieces = {
		puzzle1: {
			href: '/w',
			label: 'Puzzle piece 1',
			image: 'https://cdn.kappa.wiki/reactions/tf.png',
		},
		puzzle2: {
			href: '/w',
			label: 'Puzzle piece 2',
			image: 'https://cdn.kappa.wiki/reactions/PepeLaugh.png',
		},
		puzzle3: {
			href: '/w',
			label: 'Puzzle piece 3',
			image: 'https://cdn.kappa.wiki/reactions/OMEGALUL.png',
		},
		puzzle4: {
			href: '/w',
			label: 'Puzzle piece 4',
			image: 'https://cdn.kappa.wiki/reactions/Aware.gif',
		},
		puzzle5: {
			href: '/w',
			label: 'Puzzle piece 5',
			image: 'https://cdn.kappa.wiki/reactions/forsenE.png',
		},
		puzzle6: {
			href: '/w',
			label: 'Puzzle piece 6',
			image: 'https://cdn.kappa.wiki/reactions/Clueless.png',
		},
		puzzle7: { href: '/w', label: 'Puzzle piece 7', image: '/favicon.png' },
		puzzle8: { href: '/w', label: 'Puzzle piece 8', image: '/favicon.png' },
		puzzle9: { href: '/w', label: 'Puzzle piece 9', image: '/favicon.png' },
		puzzle10: { href: '/w', label: 'Puzzle piece 10', image: '/favicon.png' },
		puzzle11: { href: '/w', label: 'Puzzle piece 11', image: '/favicon.png' },
		puzzle12: { href: '/w', label: 'Puzzle piece 12', image: '/favicon.png' },
		puzzle13: { href: '/w', label: 'Puzzle piece 13', image: '/favicon.png' },
		puzzle14: { href: '/w', label: 'Puzzle piece 14', image: '/favicon.png' },
		puzzle15: { href: '/w', label: 'Puzzle piece 15', image: '/favicon.png' },
		puzzle16: { href: '/w', label: 'Puzzle piece 16', image: '/favicon.png' },
		puzzle17: { href: '/w', label: 'Puzzle piece 17', image: '/favicon.png' },
		puzzle18: { href: '/w', label: 'Puzzle piece 18', image: '/favicon.png' },
	};

	// How much an image leans away from the viewer towards the rim of the globe. 0 is flat.
	const CURVATURE = 0.5210899;

	const { width, height } = PUZZLE_VIEWBOX;

	/** @param {number[]} values */
	const range = (values) => {
		const min = Math.min(...values);

		return { min, size: Math.max(...values) - min };
	};

	const outlines = PUZZLE_PIECES.map(({ id, points }) => ({
		id,
		xs: points.filter((_, index) => index % 2 === 0),
		ys: points.filter((_, index) => index % 2 === 1),
	}));

	const globeX = range(outlines.flatMap(({ xs }) => xs));
	const globeY = range(outlines.flatMap(({ ys }) => ys));
	const radius = Math.max(globeX.size, globeY.size) / 2;

	/**
	 * @param {number} center
	 * @param {{ min: number, size: number }} globe
	 */
	const offset = (center, globe) => (center - (globe.min + globe.size / 2)) / radius;

	/**
	 * @param {number} center
	 * @param {{ min: number, size: number }} globe
	 */
	const lean = (center, globe) =>
		Math.asin(Math.max(-0.9, Math.min(0.9, offset(center, globe)))) * CURVATURE;

	const percent = (/** @type {number} */ value) => `${(value * 100).toFixed(2)}%`;

	const shapes = outlines.map(({ id, xs, ys }) => {
		const x = range(xs);
		const y = range(ys);
		const centerX = x.min + x.size / 2;
		const centerY = y.min + y.size / 2;
		const leanX = lean(centerX, globeX);
		const leanY = lean(centerY, globeY);
		// A leaning image looks narrower, so it is enlarged to still cover the piece.
		const cover = 1.15 / Math.min(Math.cos(leanX), Math.cos(leanY));

		return {
			id,
			// The screen corner the piece is nearest to. The globe is taken to be around the middle of the screen.
			from: `--from-x: ${offset(centerX, globeX) < 0 ? '-' : ''}55vw; --from-y: ${offset(centerY, globeY) < 0 ? '-' : ''}55vh;`,
			points: xs.map((value, index) => `${value},${ys[index]}`).join(' '),
			origin: `${percent((x.min + x.size / 2) / width)} ${percent((y.min + y.size / 2) / height)}`,
			box: `left: ${percent(x.min / width)}; top: ${percent(y.min / height)}; width: ${percent(x.size / width)}; height: ${percent(y.size / height)};`,
			clip: `polygon(${xs.map((value, index) => `${percent((value - x.min) / x.size)} ${percent((ys[index] - y.min) / y.size)}`).join(', ')})`,
			lean: `perspective(100cqw) rotateY(${leanX.toFixed(3)}rad) rotateX(${(-leanY).toFixed(3)}rad)`,
			cover: `scale(${cover.toFixed(3)})`,
		};
	});

	const shade = {
		cx: globeX.min + globeX.size / 2 - radius * 0.3,
		cy: globeY.min + globeY.size / 2 - radius * 0.3,
		r: radius * 1.4,
	};

	const FALL_STAGGER_MS = 60;

	// mulberry32
	const random = (/** @type {number} */ state) => () => {
		state = (state + 0x6d2b79f5) | 0;
		let t = Math.imul(state ^ (state >>> 15), 1 | state);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;

		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};

	const fallOrder = $derived.by(() => {
		const next = random(Math.floor(seed * 2 ** 32));
		const order = shapes.map(({ id }) => id);

		for (let index = order.length - 1; index > 0; index--) {
			const other = Math.floor(next() * (index + 1));
			[order[index], order[other]] = [order[other], order[index]];
		}

		return Object.fromEntries(order.map((id, index) => [id, index]));
	});

	/** @type {string | null} */
	let active = $state(null);

	// Pieces whose image would have to be enlarged to fill them. Those are shown at their own size instead.
	/** @type {Record<string, boolean>} */
	const small = $state({});

	// The pieces only start falling once every image is measured, or else a small one would fall stretched.
	const MAX_WAIT_MS = 2000;

	const imageCount = shapes.filter(({ id }) => pieces[id]).length;
	/** @type {Set<string>} */
	// eslint-disable-next-line svelte/prefer-svelte-reactivity
	const settled = new Set();
	let ready = $state(false);

	$effect(() => {
		const timeout = setTimeout(() => (ready = true), MAX_WAIT_MS);

		return () => clearTimeout(timeout);
	});

	/**
	 * @param {HTMLImageElement} image
	 * @param {string} id
	 */
	const measure = (image, id) => {
		const update = () => {
			if (image.naturalWidth) {
				small[id] =
					image.naturalWidth < image.clientWidth || image.naturalHeight < image.clientHeight;
			}
		};

		const settle = () => {
			update();
			settled.add(id);

			if (settled.size === imageCount) {
				ready = true;
			}
		};

		// The piece changes size with the page, and the image may have loaded before this runs.
		const observer = new ResizeObserver(update);
		observer.observe(image);
		image.addEventListener('load', settle);
		image.addEventListener('error', settle);

		if (image.complete) {
			settle();
		}

		return {
			destroy() {
				observer.disconnect();
				image.removeEventListener('load', settle);
				image.removeEventListener('error', settle);
			},
		};
	};
</script>

<svelte:head>
	<noscript>
		<style>
			.puzzle-globe .slab {
				opacity: 1 !important;
			}
		</style>
	</noscript>
</svelte:head>

<div
	class="puzzle-globe mx-auto w-full max-w-lg"
	class:ready
	style="aspect-ratio: {width} / {height};"
>
	<svg viewBox="0 0 {width} {height}" aria-hidden="true">
		<defs>
			<radialGradient id="puzzle-globe-shade" gradientUnits="userSpaceOnUse" {...shade}>
				<stop offset="0" stop-color="#fff" stop-opacity="0.3" />
				<stop offset="0.45" stop-color="#fff" stop-opacity="0" />
				<stop offset="0.7" stop-color="#000" stop-opacity="0" />
				<stop offset="1" stop-color="#000" stop-opacity="0.5" />
			</radialGradient>
		</defs>
	</svg>

	{#each shapes as shape (shape.id)}
		{@const piece = pieces[shape.id]}
		{#if piece}
			<div
				class="slab"
				style="{shape.from} transform-origin: {shape.origin}; z-index: {fallOrder[shape.id] +
					1}; animation-delay: {fallOrder[shape.id] * FALL_STAGGER_MS}ms;"
			>
				<svelte:element
					this={piece.href ? 'a' : 'span'}
					href={piece.href || undefined}
					title={piece.label}
					aria-label={piece.label}
					role={piece.href ? undefined : 'img'}
					class="piece {small[shape.id] ? 'bg-black' : ''}"
					style="{shape.box} clip-path: {shape.clip};"
					onpointerenter={() => (active = shape.id)}
					onpointerleave={() => (active = null)}
					onfocus={() => (active = shape.id)}
					onblur={() => (active = null)}
				>
					<img
						src={piece.image}
						alt=""
						draggable="false"
						class:small={small[shape.id]}
						style="transform: {shape.lean} {small[shape.id] ? '' : shape.cover} {piece.transform ??
							''};"
						use:measure={shape.id}
					/>
				</svelte:element>
				<svg viewBox="0 0 {width} {height}" aria-hidden="true">
					<polygon points={shape.points} class="seam" />
				</svg>
			</div>
		{/if}
	{/each}

	<svg viewBox="0 0 {width} {height}" aria-hidden="true" class="hover">
		{#each shapes as shape (shape.id)}
			{#if shape.id === active}
				<polygon points={shape.points} class="piece-outline" />
			{/if}
		{/each}
	</svg>
</div>

<style>
	/* A falling slab reaches past the sides of the screen. Cutting it off there, and not at a box inside the page, keeps the cut out of sight and adds no sideways scrollbar. */
	:global(html:has(.puzzle-globe)) {
		overflow-x: clip;
	}

	.puzzle-globe {
		position: relative;
		container-type: inline-size;
	}

	/* A slab that is still falling is above the ones that have landed, so the z-index follows the order. */
	.slab {
		position: absolute;
		inset: 0;
		pointer-events: none;
		/* Hidden until the images are measured. Without JavaScript the style in <noscript> shows it. */
		opacity: 0;
	}

	.ready .slab {
		opacity: 1;
		animation: drop 400ms both;
	}

	/* Seen from above: a slab starts close to the viewer at a corner of the screen, speeds up like a falling weight and barely rebounds. */
	@keyframes drop {
		0% {
			opacity: 0;
			transform: translate(var(--from-x), var(--from-y)) scale(5);
			animation-timing-function: cubic-bezier(0.55, 0, 1, 0.45);
		}

		35% {
			opacity: 0;
		}

		72% {
			opacity: 1;
		}

		72% {
			transform: translate(0, 0) scale(1);
			animation-timing-function: ease-out;
		}

		84% {
			transform: translate(0, 0) scale(1.025);
			animation-timing-function: ease-in;
		}

		100% {
			transform: translate(0, 0) scale(1);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.ready .slab {
			animation: none;
		}
	}

	.piece {
		position: absolute;
		display: block;
		overflow: hidden;
		outline: none;
		pointer-events: auto;
	}

	.piece img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	/* Its own size, centred on the piece's background. */
	.piece img.small {
		object-fit: none;
	}

	svg {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
	}

	.hover {
		z-index: 20;
	}

	/* The viewBox is about ten times the displayed size. */
	.seam {
		fill: url(#puzzle-globe-shade);
		stroke: rgb(255 255 255 / 0.8);
		stroke-width: 14;
		stroke-linejoin: round;
	}

	.piece-outline {
		fill: none;
		stroke: var(--color-violet-600);
		stroke-width: 40;
		stroke-linejoin: round;
	}

	@media (prefers-color-scheme: dark) {
		.piece-outline {
			stroke: var(--color-violet-300);
		}
	}
</style>
