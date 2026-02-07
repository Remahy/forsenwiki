<script>
	import Link from '$lib/components/Link.svelte';
	import Counters from './Counters.svelte';
	import Info from './Info.svelte';
</script>

<div class="flex gap-2">
	<Counters />
	<Info />
	<Link href="#submit"><small>Scroll to bottom</small></Link>
</div>
