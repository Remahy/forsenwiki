<script>
	import Box from './Box.svelte';

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

		const headings = [...article?.querySelectorAll('h1, h2, h3, h4, h5')]?.filter((element) => {
			const parents = getParents(element);
			return !parents.some((n) => n instanceof HTMLTableCellElement);
		});

		if (!headings?.length) {
			return;
		}

		const tocWrapper = doc.createElement('div');

		// TODO: Rewrite it to use ordered list with nesting.
		const ul = doc.createElement('ul');

		for (let index = 0; index < headings.length; index++) {
			const element = headings[index];

			const level = Number(element.tagName.replace(/[A-Z]/g, ''));

			const span = doc.createElement('span');
			span.setAttribute('class', 'underline decoration-indigo-500 decoration-2 underline-offset-4');
			span.innerText = element.textContent || '';

			const a = doc.createElement('a');
			a.appendChild(span);
			a.href = `#${element.id}`;
			a.setAttribute(
				'class',
				'inline-flex flex-wrap items-baseline gap-2 font-bold hover:text-indigo-300'
			);

			const li = doc.createElement('li');
			li.setAttribute('class', 'leading-7');
			li.appendChild(a);
			li.style.paddingLeft = `${16 * (level - 1)}px`;

			ul.appendChild(li);
		}

		tocWrapper.appendChild(ul);

		toc = tocWrapper.outerHTML;

		return {
			destroy() {},
		};
	}

	/**
	 * @type {string}
	 */
	let toc = $state('');
</script>

<div use:tocAction class="hidden lg:block lg:w-96 lg:min-w-96">
	{#if toc}
		<Box class="top-4 hidden flex-col overflow-hidden p-4 break-all lg:sticky lg:flex">
			<div class="box-heading-wrapper mb-2">
				<h2 class="text-2xl">Table of Contents</h2>
			</div>

			{@html toc}
		</Box>
	{:else}
		<img src="/favicon.png" alt="The face of Twitch" class="opacity-[.04] select-none" />
	{/if}
</div>
