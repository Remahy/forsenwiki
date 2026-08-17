<script>
	import ElementAlignmentSelect from '../ElementAlignmentSelect.svelte';
</script>

<div class="flex w-full flex-col justify-items-stretch">
	<div class="bg-violet-900/25 px-2 py-4 font-mono leading-none select-none" title="Globals">
		Globals
	</div>

	<div class="p-2">
		<label title="Alignment" class="relative flex w-full items-center gap-2">
			<span>Alignment</span>
			<ElementAlignmentSelect />
		</label>
	</div>
</div>
