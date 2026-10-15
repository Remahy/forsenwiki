<script>
	import Divider from '../../Divider.svelte';
	import TreeviewModalButton from '../Treeview/TreeviewModalButton.svelte';
	import FormatControls from './FormatControls.svelte';
	import HistoryButtons from './HistoryButtons.svelte';
</script>

<HistoryButtons />
<Divider />
<div class="flex min-w-0 flex-1 items-stretch gap-1 overflow-x-auto overflow-y-hidden *:shrink-0">
	<FormatControls />
</div>

<Divider />

<TreeviewModalButton />
