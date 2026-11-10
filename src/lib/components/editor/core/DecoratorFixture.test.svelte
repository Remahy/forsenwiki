<script>
	import { getContext, onMount } from 'svelte';

	/** @type {{ label: string, onlifecycle: (event: string) => void }} */
	let { label, onlifecycle } = $props();

	const suffix = getContext('suffix') ?? '';

	onMount(() => {
		onlifecycle('mount');
		return () => onlifecycle('destroy');
	});
</script>

<span>{label}{suffix}</span>
