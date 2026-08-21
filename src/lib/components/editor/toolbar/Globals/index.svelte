<script>
	import Wrapper from '../components/Wrapper.svelte';
	import Title from '../components/Title.svelte';
	import ElementAlignmentSelect from '../ElementAlignmentSelect.svelte';
</script>

<Wrapper>
	{#snippet title()}
		<Title text="Globals" />
	{/snippet}

	{#snippet content()}
		<div class="p-2">
			<label title="Alignment" class="relative flex w-full items-center gap-2">
				<span>Alignment</span>
				<ElementAlignmentSelect />
			</label>
		</div>
	{/snippet}
</Wrapper>
