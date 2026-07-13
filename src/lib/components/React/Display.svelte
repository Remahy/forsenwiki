<script>
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { readReactions } from '$lib/api/articles';
	import { debounce } from '$lib/utils/debounce';
	import { reactions as reactionsMap } from './reactions/reactions';
	import React from './reactions/React.svelte';
	import React1 from './reactions/React_1.svelte';
	import React2 from './reactions/React_2.svelte';
	import { reactionGlobals } from './store.svelte';

	const { title = '' } = $props();

	/**
	 * @typedef {{
			anchor: number,
			reactionKey: string,
			index: number,
			authors: Array<{ id: string, name: string, rangeId: string }>
		} & { Component: any, props: any }} Note
	 */

	/** @type {Array<Note & { style: string, className: string }>} */
	let reactions = $state([]);

	/** @type {Note[]} */
	let retrievedReactions = $state([]);

	const wrapper = document.querySelector('.article-wrapper');
	const content = document.querySelector('.article-root');

	/**
	 * @param {HTMLElement} root
	 */
	function getAllTextNodes(root) {
		const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
		const nodes = [];

		let n;

		while ((n = walker.nextNode())) {
			nodes.push(n);
		}

		return nodes;
	}

	/**
	 * @param {HTMLElement} wrapper
	 * @param {number} offset
	 */
	function resolveOffsetInWrapper(wrapper, offset) {
		const nodes = getAllTextNodes(wrapper);

		let current = 0;

		for (const node of nodes) {
			const len = node.textContent?.length;

			if (typeof len !== 'number') {
				return null;
			}

			if (offset <= current + len) {
				return {
					node,
					localOffset: offset - current,
				};
			}

			current += len;
		}

		return null;
	}

	/**
	 * @param {HTMLElement} wrapper
	 * @param {HTMLElement} content
	 * @param {Note} reaction
	 * @returns {reactions[0] | undefined}
	 */
	function getReactionPlacement(wrapper, content, reaction) {
		const { anchor } = reaction;

		const resolved = resolveOffsetInWrapper(content, anchor);
		if (!resolved) {
			return;
		}

		const range = document.createRange();
		range.setStart(resolved.node, resolved.localOffset);
		range.setEnd(resolved.node, resolved.localOffset);

		// temporary invisible marker
		const marker = document.createElement('span');
		marker.textContent = '\u200b';

		range.insertNode(marker);

		const wrapperRect = wrapper.getBoundingClientRect();
		const markerRect = marker.getBoundingClientRect();

		const y = markerRect.top - wrapperRect.top;

		marker.remove();

		return {
			...reaction,
			className: 'reaction',
			style: `top: ${y}px; left: -${(reaction.index > 0 ? (reaction.index) * 16 : 0) + 32}px;`,
		};
	}

	/**
	 * @param {Note[]} data
	 */
	function update(data) {
		if (!(wrapper instanceof HTMLElement) || !(content instanceof HTMLElement)) {
			return;
		}

		/** @type {reactions} */
		const res = [];

		for (let index = 0; index < data.length; index++) {
			const entry = data[index];

			const reaction = getReactionPlacement(wrapper, content, entry);
			if (!reaction) {
				continue;
			}

			res.push(reaction);
		}

		reactions = res;
	}

	$effect(() => {
		update(retrievedReactions);
	});

	async function loadReactions() {
		try {
			const res = await readReactions(title);

			/** @type {Reactions} */
			const json = await res.json();

			const offsets = Object.entries(json);

			/** @type {Note[]} */
			const result = [];

			for (let index = 0; index < offsets.length; index++) {
				const [offsetKey, offsetValues] = offsets[index];
				const [start] = offsetKey.split('-');
				const reactionKeys = Object.keys(offsetValues);

				for (let ii = 0; ii < reactionKeys.length; ii++) {
					const reactionKey = reactionKeys[ii];
					// @ts-ignore
					const reaction = reactionsMap[reactionKey];
					let Component =
						Number(reactionKey) > 2 ? React : Number(reactionKey) === 1 ? React1 : React2;

					const authors = offsetValues[reactionKey];

					result.push({
						anchor: Number(start),
						index: ii,
						reactionKey,
						props: reaction,
						Component,
						authors,
					});
				}
			}

			retrievedReactions = result;
		} catch (err) {
			console.error(err);
		}
	}

	onMount(() => {
		const debouncedResize = debounce(() => update(retrievedReactions), 200);

		window.addEventListener('resize', debouncedResize);

		if (browser) {
			loadReactions();
		}

		reactionGlobals.refreshReactions = loadReactions;

		return () => {
			window.removeEventListener('resize', debouncedResize);
		};
	});
</script>

{#each reactions as Reaction (Reaction.reactionKey + Reaction.anchor)}
	<div style={Reaction.style} class={Reaction.className}>
		<Reaction.Component {...Reaction.props} />
	</div>
{/each}

<style>
	/* right-side gutter */
	.reaction {
		opacity: 0.25;
		position: absolute;
		width: 24px;
		height: auto;
		left: -32px;
		transition: top 200ms ease;
	}
</style>
