<script>
	import Link from '$lib/components/Link.svelte';
	import { PUZZLE_PIECES, PUZZLE_VIEWBOX } from '$lib/constants/puzzlePieces';
	import './PuzzleGlobe.css';

	/**
	 * @typedef {Object} GlobeItem
	 * @property {string} href
	 * @property {string} title
	 * @property {string} description
	 * @property {string | null} [image] Shows placeholder when there isn't one.
	 * @property {string} [transform] Added after the transform that fits the image, e.g. 'scale(1.2) translateX(10%)'.
	 */

	/**
	 * @typedef {Object} Props
	 * @property {GlobeItem[]} [items] Placed on the pieces from the biggest piece down. Pieces left over show the placeholder.
	 * @property {number} [seed] Decides the order the pieces fall in. It has to be the same on the server and in the browser.
	 */

	/** @type {Props} */
	let { items = [], seed = 0 } = $props();

	const PLACEHOLDER_IMAGE = '/favicon.png';

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

	/**
	 * @param {number[]} xs
	 * @param {number[]} ys
	 */
	const centroid = (xs, ys) => {
		let area = 0;
		let x = 0;
		let y = 0;

		for (let index = 0; index < xs.length; index++) {
			const next = (index + 1) % xs.length;
			const cross = xs[index] * ys[next] - xs[next] * ys[index];

			area += cross;
			x += (xs[index] + xs[next]) * cross;
			y += (ys[index] + ys[next]) * cross;
		}

		return { x: x / (3 * area), y: y / (3 * area), area: Math.abs(area) / 2 };
	};

	const shapes = outlines.map(({ id, xs, ys }) => {
		const x = range(xs);
		const y = range(ys);
		const centerX = x.min + x.size / 2;
		const centerY = y.min + y.size / 2;
		const leanX = lean(centerX, globeX);
		const leanY = lean(centerY, globeY);
		// A leaning image looks narrower, so it is enlarged to still cover the piece.
		const cover = 1.15 / Math.min(Math.cos(leanX), Math.cos(leanY));

		const { area, ...anchor } = centroid(xs, ys);

		return {
			id,
			area,
			// Where its citation goes.
			anchor,
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

	const bySize = shapes.toSorted((a, b) => b.area - a.area).map(({ id }) => id);

	/** @type {Record<string, GlobeItem>} */
	const pieces = $derived(
		Object.fromEntries(bySize.slice(0, items.length).map((id, index) => [id, items[index]]))
	);

	/** @type {Record<string, boolean>} */
	const failed = $state({});

	/** @type {string | null} */
	let active = $state(null);

	/** @type {Record<string, boolean>} */
	const small = $state({});

	// The pieces only start falling once every image is measured, or else a small one would fall stretched.
	const MAX_WAIT_MS = 2000;

	const imageCount = shapes.length;
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
			if (image.naturalWidth === 0 && !image.src.endsWith(PLACEHOLDER_IMAGE)) {
				failed[id] = true;
			}

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

	// The pieces in the left half of the globe are listed on the left, the rest on the right. Each list
	// is in the order of its pieces from top to bottom.
	const menus = $derived.by(() => {
		const byX = shapes.filter(({ id }) => pieces[id]).sort((a, b) => a.anchor.x - b.anchor.x);
		const half = Math.ceil(byX.length / 2);
		const byY = (/** @type {typeof shapes} */ list) =>
			list.sort((a, b) => a.anchor.y - b.anchor.y).map(({ id }) => id);

		return { left: byY(byX.slice(0, half)), right: byY(byX.slice(half)) };
	});

	/** @type {Set<string>} */
	// eslint-disable-next-line svelte/prefer-svelte-reactivity
	const ended = new Set();
	let landed = $state(false);

	// The drop plays once a day for each visitor. Their other visits that day show the globe assembled.
	const PLAYED_KEY = 'puzzle-globe-played';
	const today = () => new Date().toDateString();

	let animate = $state(true);

	$effect(() => {
		try {
			animate = localStorage.getItem(PLAYED_KEY) !== today();
		} catch {
			// Without storage it plays on every visit.
		}
	});

	$effect(() => {
		if (ready && (!animate || matchMedia('(prefers-reduced-motion: reduce)').matches)) {
			landed = true;
		}
	});

	/** @param {string} id */
	const land = (id) => {
		ended.add(id);

		if (ended.size === imageCount) {
			landed = true;

			try {
				localStorage.setItem(PLAYED_KEY, today());
			} catch {
				// Plays again on the next visit.
			}
		}
	};

	// Numbered like citation.
	const numbers = $derived(
		Object.fromEntries([...menus.left, ...menus.right].map((id, index) => [id, index + 1]))
	);

	const anchors = Object.fromEntries(shapes.map(({ id, anchor }) => [id, anchor]));
</script>

{#snippet references(/** @type {string[]} */ ids, /** @type {'left' | 'right'} */ side)}
	<ol class="references {side}">
		{#each ids as id (id)}
			{@const piece = pieces[id]}
			<li class="suggestion-box rounded-sm p-2! {id === active ? 'outline-2' : ''}">
				<Link
					href={piece.href}
					class="reference flex items-center gap-3 no-underline! decoration-0!"
					onpointerenter={() => (active = id)}
					onpointerleave={() => (active = null)}
					onfocus={() => (active = id)}
					onblur={() => (active = null)}
				>
					<span class="flex min-w-0 flex-col">
						<strong class="wrap-break-words"
							>{piece.title}<sup class="ml-0.5">[{numbers[id]}]</sup></strong
						>
						{#if piece.description}
							<small>{piece.description}</small>
						{/if}
					</span>
				</Link>
			</li>
		{/each}
	</ol>
{/snippet}

<svelte:head>
	<noscript>
		<style>
			.puzzle-globe .slab,
			.globe-stage .references,
			.puzzle-globe .marker {
				opacity: 1 !important;
			}
		</style>
	</noscript>
</svelte:head>

<div class="globe-stage" class:landed class:animate>
	{@render references(menus.left, 'left')}

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
			<div
				class="slab"
				style="{shape.from} transform-origin: {shape.origin}; z-index: {fallOrder[shape.id] +
					1}; animation-delay: {fallOrder[shape.id] * FALL_STAGGER_MS}ms;"
				onanimationend={() => land(shape.id)}
			>
				<svelte:element
					this={piece ? 'a' : 'span'}
					href={piece?.href}
					title={piece?.title}
					aria-hidden={piece ? undefined : 'true'}
					class="piece {small[shape.id] ? 'bg-black' : ''}"
					style="{shape.box} clip-path: {shape.clip};"
					onpointerenter={() => (active = piece ? shape.id : null)}
					onpointerleave={() => (active = null)}
					onfocus={() => (active = shape.id)}
					onblur={() => (active = null)}
				>
					<img
						src={piece?.image && !failed[shape.id] ? piece.image : PLACEHOLDER_IMAGE}
						alt=""
						draggable="false"
						class:small={small[shape.id]}
						style="transform: {shape.lean} {small[shape.id] ? '' : shape.cover} {piece?.transform ??
							''};"
						use:measure={shape.id}
					/>
				</svelte:element>
				<svg viewBox="0 0 {width} {height}" aria-hidden="true">
					<polygon points={shape.points} class="seam" />
				</svg>
			</div>
		{/each}

		<svg viewBox="0 0 {width} {height}" aria-hidden="true" class="hover">
			{#each shapes as shape (shape.id)}
				{#if shape.id === active}
					<polygon points={shape.points} class="piece-outline" />
				{/if}
			{/each}
		</svg>

		{#each [...menus.left, ...menus.right] as id, index (id)}
			{@const anchor = anchors[id]}
			<span
				class="marker rounded-sm px-1 text-xs font-semibold text-violet-700 dark:text-violet-300 {id ===
				active
					? 'bg-violet-600 text-white! dark:bg-violet-300 dark:text-black!'
					: 'bg-white/85 dark:bg-black/70'}"
				style="left: {percent(anchor.x / width)}; top: {percent(
					anchor.y / height
				)}; --order: {index};"
				aria-hidden="true">[{numbers[id]}]</span
			>
		{/each}
	</div>

	{@render references(menus.right, 'right')}
</div>
