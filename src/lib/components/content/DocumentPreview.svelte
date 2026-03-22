<script>
	import LinkButton from '../LinkButton.svelte';

	const { src, name } = $props();
</script>

<LinkButton href={src} download={name}>Download document</LinkButton>
