<script>
	import { PUZZLE_PIECES, PUZZLE_VIEWBOX } from '$lib/constants/puzzlePieces';

	// Keyed by the ids in $lib/constants/puzzlePieces.js. Hover a piece to see its label.
	// `transform` is added after the one that fits the image, e.g. 'scale(1.2) translateX(10%)'.
	/** @type {Record<string, { href: string, label: string, image: string, transform?: string }>} */
	const pieces = {
		puzzle1: { href: '/w', label: 'Puzzle piece 1', image: '/favicon.png' },
		puzzle2: { href: '/w', label: 'Puzzle piece 2', image: '/favicon.png' },
		puzzle3: { href: '/w', label: 'Puzzle piece 3', image: '/favicon.png' },
		puzzle4: { href: '/w', label: 'Puzzle piece 4', image: '/favicon.png' },
		puzzle5: { href: '/w', label: 'Puzzle piece 5', image: '/favicon.png' },
		puzzle6: { href: '/w', label: 'Puzzle piece 6', image: '/favicon.png' },
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
	const CURVATURE = 0.6;

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
	const lean = (center, globe) => {
		const offset = (center - (globe.min + globe.size / 2)) / radius;

		return Math.asin(Math.max(-0.9, Math.min(0.9, offset))) * CURVATURE;
	};

	const percent = (/** @type {number} */ value) => `${(value * 100).toFixed(2)}%`;

	const shapes = outlines.map(({ id, xs, ys }) => {
		const x = range(xs);
		const y = range(ys);
		const leanX = lean(x.min + x.size / 2, globeX);
		const leanY = lean(y.min + y.size / 2, globeY);
		// A leaning image looks narrower, so it is enlarged to still cover the piece.
		const cover = 1.15 / Math.min(Math.cos(leanX), Math.cos(leanY));

		return {
			id,
			points: xs.map((value, index) => `${value},${ys[index]}`).join(' '),
			box: `left: ${percent(x.min / width)}; top: ${percent(y.min / height)}; width: ${percent(x.size / width)}; height: ${percent(y.size / height)};`,
			clip: `polygon(${xs.map((value, index) => `${percent((value - x.min) / x.size)} ${percent((ys[index] - y.min) / y.size)}`).join(', ')})`,
			fit: `perspective(100cqw) rotateY(${leanX.toFixed(3)}rad) rotateX(${(-leanY).toFixed(3)}rad) scale(${cover.toFixed(3)})`,
		};
	});

	const shade = {
		cx: globeX.min + globeX.size / 2 - radius * 0.3,
		cy: globeY.min + globeY.size / 2 - radius * 0.3,
		r: radius * 1.4,
	};

	/** @type {string | null} */
	let active = $state(null);
</script>

<div class="puzzle-globe mx-auto w-full max-w-lg" style="aspect-ratio: {width} / {height};">
	{#each shapes as shape (shape.id)}
		{@const piece = pieces[shape.id]}
		{#if piece}
			<svelte:element
				this={piece.href ? 'a' : 'span'}
				href={piece.href || undefined}
				title={piece.label}
				aria-label={piece.label}
				role={piece.href ? undefined : 'img'}
				class="piece"
				style="{shape.box} clip-path: {shape.clip};"
				onpointerenter={() => (active = shape.id)}
				onpointerleave={() => (active = null)}
				onfocus={() => (active = shape.id)}
				onblur={() => (active = null)}
			>
				<img
					src={piece.image}
					alt=""
					loading="lazy"
					draggable="false"
					style="transform: {shape.fit} {piece.transform ?? ''};"
				/>
			</svelte:element>
		{/if}
	{/each}

	<svg viewBox="0 0 {width} {height}" aria-hidden="true">
		<defs>
			<radialGradient id="puzzle-globe-shade" gradientUnits="userSpaceOnUse" {...shade}>
				<stop offset="0" stop-color="#fff" stop-opacity="0.3" />
				<stop offset="0.45" stop-color="#fff" stop-opacity="0" />
				<stop offset="0.7" stop-color="#000" stop-opacity="0" />
				<stop offset="1" stop-color="#000" stop-opacity="0.5" />
			</radialGradient>
		</defs>
		{#each shapes as shape (shape.id)}
			<polygon points={shape.points} class="seam" />
		{/each}
		{#each shapes as shape (shape.id)}
			{#if shape.id === active}
				<polygon points={shape.points} class="piece-outline" />
			{/if}
		{/each}
	</svg>
</div>

<style>
	.puzzle-globe {
		position: relative;
		container-type: inline-size;
	}

	.piece {
		position: absolute;
		display: block;
		overflow: hidden;
		outline: none;
	}

	.piece img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	svg {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
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
