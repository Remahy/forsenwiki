<script>
	// @ts-nocheck - Complains about "xmlns:cc" and "xmlns:dct" not being valid.
	import cc from '$lib/images/cc.svg';
	import by from '$lib/images/by.svg';
	import sa from '$lib/images/sa.svg';
</script>

<p
	class="flex flex-wrap items-baseline gap-2 leading-none"
	xmlns:cc="http://creativecommons.org/ns#"
	xmlns:dct="http://purl.org/dc/terms/"
>
	<span>Content is licensed under</span>

	<a
		class="inline-flex flex-wrap items-baseline gap-2 font-bold hover:text-indigo-300"
		href="https://creativecommons.org/licenses/by-sa/4.0/"
		target="_blank"
		rel="license noopener noreferrer"
	>
		<span class="underline decoration-indigo-500 decoration-2 underline-offset-4">
			CC BY-SA 4.0
		</span>

		<span>
			<img class="mb-1 inline-block h-6" src={cc} alt="CC" />
			<img class="mb-1 inline-block h-6" src={by} alt="BY" />
			<img class="mb-1 inline-block h-6" src={sa} alt="SA" />
		</span>
	</a>
</p>
