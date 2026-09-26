<script>
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { readReactions } from '$lib/api/posts';
	import { debounce } from '$lib/utils/debounce';
	import { modal } from '$lib/stores/modal';
	import { reactions as reactionsMap } from './reactions/reactions';
	import React from './reactions/React.svelte';
	import React1 from './reactions/React_1.svelte';
	import React2 from './reactions/React_2.svelte';
	import { reactionGlobals } from './store.svelte';
	import ReactionsModal from './ReactionsModal.svelte';

	import './Display.css';

	const { title = '' } = $props();

	/**
	 * @typedef {import('./reaction').DisplayReaction} DisplayReaction
	 * @typedef {import('./reaction').Note} Note
	 */

	/** @type {DisplayReaction[]} */
	let reactions = $state([]);

	/** @type {Note[]} */
	let retrievedReactions = $state([]);

	const wrapper = document.querySelector('.article-wrapper');
	const content = document.querySelector('.article-root');

	/**
	 * @param {HTMLElement} root
	 */
	const getAllTextNodes = (root) => {
		const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
		const nodes = [];

		let n;

		while ((n = walker.nextNode())) {
			nodes.push(n);
		}

		return nodes;
	};

	/**
	 * @param {HTMLElement} wrapper
	 * @param {number} offset
	 */
	const resolveOffsetInWrapper = (wrapper, offset) => {
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
	};

	/**
	 * @param {HTMLElement} wrapper
	 * @param {HTMLElement} content
	 * @param {Note} reaction
	 * @returns {reactions[0] | undefined}
	 */
	const getReactionPlacement = (wrapper, content, reaction) => {
		const { anchor, focus } = reaction;

		const resolvedAnchor = resolveOffsetInWrapper(content, anchor);
		if (!resolvedAnchor) {
			return;
		}

		const range = document.createRange();
		range.setStart(resolvedAnchor.node, resolvedAnchor.localOffset);
		range.setEnd(resolvedAnchor.node, resolvedAnchor.localOffset);

		const resolvedFocus = resolveOffsetInWrapper(content, focus);

		/**
		 * @type {string | null}
		 */
		let text = null;
		if (resolvedFocus) {
			const textRange = document.createRange();

			textRange.setStart(resolvedAnchor.node, resolvedAnchor.localOffset);
			textRange.setEnd(resolvedFocus.node, resolvedFocus.localOffset);
			const tempDiv = document.createElement('div');
			tempDiv.append(textRange.cloneContents());
			tempDiv.innerHTML = tempDiv.innerHTML.replace(/<br>/g, '\n');
			text = tempDiv.innerText.trim();
		}

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
			y,
			text,
			getStyle: (index) => `top: ${y}px; left: -${(index > 0 ? index * 16 : 0) + 32}px;`,
		};
	};

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

			const atSameY = res.filter((r) => r.y === reaction.y);
			if (atSameY.length) {
				reaction.index += atSameY.length;
			}

			res.push(reaction);
		}

		reactions = res;
	}

	$effect(() => {
		update(retrievedReactions);
	});

	const loadReactions = async () => {
		try {
			const res = await readReactions(title);

			/** @type {Reactions} */
			const json = await res.json();

			const offsets = Object.entries(json);

			/** @type {Note[]} */
			const result = [];

			for (let index = 0; index < offsets.length; index++) {
				const [offsetKey, offsetValues] = offsets[index];
				const [start, end] = offsetKey.split('-');
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
						focus: Number(end),
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
	};

	/**
	 * @param {DisplayReaction[]} reactions
	 * @param {number} y
	 */
	const showReactions = (reactions, y) => {
		const relevantReactions = reactions.filter((r) => r.y === y);

		modal.set({
			reactions: relevantReactions,
			postTitle: title,
			isOpen: true,
			component: ReactionsModal,
		});
	};

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
	<button
		style={Reaction.getStyle(Reaction.index)}
		class={Reaction.className}
		onclick={() => showReactions(reactions, Reaction.y)}
	>
		<Reaction.Component {...Reaction.props} />
	</button>
{/each}
