<script>
	import { browser } from '$app/environment';
	import { addReaction } from '$lib/api/articles';
	import { shuffle } from '$lib/utils/shuffle';

	import React from './reactions/React.svelte';
	import React1 from './reactions/React_1.svelte';
	import React2 from './reactions/React_2.svelte';
	import { reactions } from './reactions/reactions';

	const { title = '' } = $props();

	const openTime = Date.now();

	const reactionsArray = [
		{
			name: '1',
			props: {},
			Component: React1,
		},
		{
			name: '2',
			props: {},
			Component: React2,
		},
	].concat(
		shuffle(
			Object.entries(reactions)
				.slice(2)
				.map(([key, props]) => ({
					name: key,
					props,
					Component: React,
				}))
		)
	);

	/** @type {HTMLDivElement | null} */
	let menuEl = $state(null);

	/**
	 * @type {{ x: number, y: number, visible: boolean, selection?: Selection, ticking: boolean }}
	 */
	let menu = $state({
		x: 0,
		y: 0,
		visible: false,
		selection: undefined,
		ticking: false,
	});

	/**
	 * @type {NodeJS.Timeout}
	 */
	let hideTimeout;

	/**
	 * Determines whether selection is worth showing menu for
	 * @param {Selection} selection
	 */
	function isValidSelection(selection) {
		if (!selection || selection.rangeCount === 0) {
			return false;
		}
		if (selection.isCollapsed) {
			return false;
		}

		const text = selection.toString().trim();

		// ignore tiny selections
		if (text.length < 2) {
			return false;
		}

		return true;
	}

	/**
	 * @param {Range} range
	 */
	function getSelectionRect(range) {
		const rects = range.getClientRects();

		// fallback
		if (!rects.length) {
			return range.getBoundingClientRect();
		}

		const first = rects[0];
		const last = rects[rects.length - 1];

		return {
			left: Math.min(first.left, last.left),
			right: Math.max(first.right, last.right),
			top: first.top,
			bottom: last.bottom,
			width: Math.max(first.right, last.right) - Math.min(first.left, last.left),
			height: last.bottom - first.top,
		};
	}

	function measureMenu() {
		if (!menuEl) {
			return { width: 0, height: 0 };
		}

		const { width, height } = menuEl.getBoundingClientRect();

		return { width, height };
	}

	/**
	 * @param {number} x
	 * @param {number} y
	 */
	function clampPosition(x, y) {
		const padding = 16;

		const { width, height } = measureMenu();

		// because of translate(-50%, -100%)
		const halfWidth = width / 2;
		const fullHeight = height;

		const minX = padding + halfWidth;
		const maxX = window.innerWidth - padding - halfWidth;

		const minY = padding + fullHeight;
		const maxY = window.innerHeight - padding;

		return {
			x: Math.max(minX, Math.min(maxX, x)),
			y: Math.max(minY, Math.min(maxY, y)),
		};
	}

	function updateMenu() {
		const selection = window.getSelection();

		if (!selection || !isValidSelection(selection)) {
			scheduleHide();
			return;
		}

		const isTextInArticle =
			selection.anchorNode?.parentElement?.closest('.article-root') &&
			selection.focusNode?.parentElement?.closest('.article-root');

		if (!isTextInArticle) {
			scheduleHide();
			return;
		}

		const range = selection.getRangeAt(0);
		const rect = getSelectionRect(range);

		let x = rect.left + rect.width / 2;
		let y = rect.top - 4;

		const clamped = clampPosition(x, y);

		menu.x = clamped.x;
		menu.y = clamped.y;
		menu.selection = selection;
		menu.visible = true;

		clearTimeout(hideTimeout);
	}

	function scheduleHide() {
		clearTimeout(hideTimeout);

		hideTimeout = setTimeout(() => {
			const selection = window.getSelection();

			if (!selection || selection.isCollapsed) {
				menu.visible = false;
			}
		}, 120);
	}

	function onSelectionChange() {
		if (menu.ticking) {
			return;
		}

		menu.ticking = true;

		requestAnimationFrame(() => {
			menu.ticking = false;
			updateMenu();
		});
	}

	/**
	 * @param {Selection} [selection]
	 */
	function getSelectionOffsets(selection) {
		if (!selection?.rangeCount) {
			return null;
		}

		const parent = selection.anchorNode?.parentElement?.closest('.article-root');

		if (!parent) {
			return null;
		}

		const range = selection.getRangeAt(0);

		const preRange = document.createRange();
		preRange.selectNodeContents(parent);
		preRange.setEnd(range.startContainer, range.startOffset);

		const start = preRange.toString().length;
		const end = start + range.toString().length;

		return [start, end];
	}

	/**
	 * @param {string} name
	 */
	async function handleAddReaction(name) {
		const offset = getSelectionOffsets(menu.selection);
		if (!offset) {
			return;
		}

		await addReaction(title, { openTime, reaction: name, offset });
	}
</script>

<svelte:window
	onselectionchange={onSelectionChange}
	onmouseup={onSelectionChange}
	onmousedown={() => scheduleHide()}
/>

{#if browser}
	<div
		bind:this={menuEl}
		class="menu fixed flex -translate-x-1/2 -translate-y-full gap-2 rounded-xl bg-violet-800 p-2 select-none dark:bg-violet-950"
		style:z-index={menu.visible ? 50 : 0}
		style:opacity={menu.visible ? 1 : 0}
		style:left="{menu.x}px"
		style:top="{menu.y}px"
	>
		{#each reactionsArray as Reaction (Reaction.name)}
			<button
				class="cursor-pointer rounded p-1 hover:bg-black/25"
				onclick={() => handleAddReaction(Reaction.name)}
			>
				<Reaction.Component {...Reaction.props} />
			</button>
		{/each}
	</div>
{/if}

<style>
	.menu {
		transition: opacity 120ms ease;
	}

	/* pepega solution */
	button :global {
		:first-child {
			display: flex;
			font-size: 24px;
			width: 32px;
			height: auto;
			max-width: unset;
			user-select: none;
			-webkit-user-drag: none;
		}
	}
</style>
