<script>
	import Box from './Box.svelte';
	import Spinner from './Spinner.svelte';

	/**
	 * @param {HTMLElement} element
	 */
	function greet(element) {
		const doc = element.ownerDocument;

		const article = doc.querySelector('main.editor-shell');

		if (!article) {
			toc = 'No article loaded.';
			return;
		}

		const headings = article?.querySelectorAll('h1, h2, h3, h4, h5');

		if (!headings) {
			toc = 'If this article had headings, they would be displayed here.';
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
	$: toc = '';
</script>

<div use:greet class:hidden={!toc}>
	{#if toc}
		<Box class="top-4 hidden flex-col p-4 lg:sticky lg:flex lg:min-w-96">
			<div class="box-heading-wrapper mb-2">
				<h2 class="text-2xl">Table of Contents</h2>
			</div>
			{@html toc}
		</Box>
	{:else}
		<Spinner />
	{/if}
</div>
