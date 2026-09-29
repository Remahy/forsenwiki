<script>
	import { TableOfContentsIcon } from '@lucide/svelte';
	/* eslint-disable svelte/no-at-html-tags */
	import Box from './Box.svelte';
	import Button from './Button.svelte';

	/**
	 * @type {string}
	 */
	let toc = $state('');

	let isHidden = $state(false);

	/**
	 * @param {Node | null} _element
	 */
	const getParents = (_element) => {
		let element = _element;

		const els = [];

		while (element) {
			els.unshift(element);
			element = element.parentNode;
		}

		return els;
	};

	/**
	 * @param {HTMLElement} element
	 */
	function tocAction(element) {
		const doc = element.ownerDocument;

		const article = doc.querySelector('main.article-root');

		if (!article) {
			return;
		}

		const headings = [...(article?.querySelectorAll?.('h1, h2, h3, h4, h5') || [])].filter(
			(element) => {
				const parents = getParents(element);
				return !parents.some((n) => n instanceof HTMLTableCellElement);
			}
		);

		if (!headings?.length) {
			return;
		}

		const tocWrapper = doc.createElement('div');
		tocWrapper.classList.add('p-4', 'overflow-y-auto', 'max-h-[calc(100vh-90px)]', 'pl-0');

		// TODO: Rewrite it to use ordered list with nesting.
		const ul = doc.createElement('ul');

		for (let index = 0; index < headings.length; index++) {
			const element = headings[index];

			const level = Number(element.tagName.replace(/[A-Z]/g, ''));

			const span = doc.createElement('span');
			span.setAttribute('class', 'underline decoration-indigo-500 decoration-1 underline-offset-2');
			span.innerText = element.textContent || '';

			const a = doc.createElement('a');
			a.appendChild(span);
			a.href = `#${element.id}`;
			a.setAttribute('class', 'inline-flex flex-wrap items-baseline gap-2 hover:text-indigo-300');

			const li = doc.createElement('li');
			li.appendChild(a);
			li.style.paddingLeft = `${16 * (level - 1)}px`;

			if (headings.length - 1 > index) {
				li.style.marginBottom = '4px';

				if (level === 1) {
					li.style.marginBottom = '8px';
				}
			}

			ul.appendChild(li);
		}

		tocWrapper.appendChild(ul);

		toc = tocWrapper.outerHTML;

		return {
			destroy() {},
		};
	}

	const handleToggleHideToC = () => {
		isHidden = !isHidden;
	};
</script>

<div use:tocAction>
	{#if toc}
		<div class="{isHidden ? 'hidden!' : 'hidden'} sticky top-4 xl:block xl:w-96 xl:min-w-96">
			<Box class="flex flex-col overflow-hidden p-4 pr-0 pb-0 break-normal">
				<div class="box-heading-wrapper flex items-center gap-2 pr-4">
					<div class="grow"><strong>Contents</strong></div>
					<Button class="min-h-[unset]! p-2! text-xs leading-none!" onclick={handleToggleHideToC}
						>Hide</Button
					>
				</div>

				{@html toc}
			</Box>
		</div>
		{#if isHidden}
			<Button
				class="sticky top-4 min-h-[unset]! p-2! text-xs leading-none!"
				onclick={handleToggleHideToC}
			>
				<TableOfContentsIcon size={16} />
			</Button>
		{/if}
	{/if}
</div>
