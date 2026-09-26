<script>
	import { Trash2Icon, XIcon } from '@lucide/svelte';
	import { page } from '$app/state';
	import { modal } from '$lib/stores/modal';
	import { deleteReaction } from '$lib/api/posts';
	import Button from '../Button.svelte';
	import Link from '../Link.svelte';
	import { reactionGlobals } from './store.svelte';

	/**
	 * @typedef {import('./reaction').DisplayReaction} DisplayReaction
	 */

	/**
	 * @typedef {Object} Props
	 * @property {DisplayReaction[]} reactions
	 * @property {string} postTitle
	 */

	/** @type {Props} */
	let { reactions = [], postTitle = '' } = $props();

	const myUserName = $derived(page.data.session?.user?.name);

	const cancel = () => {
		$modal.isOpen = false;
	};

	/**
	 * @param {string} reactionId
	 */
	const handleDeleteReaction = async (reactionId) => {
		await deleteReaction(postTitle, reactionId);
		reactionGlobals.refreshReactions();
		cancel();
	};
</script>

<div class="modal-color pointer-events-auto relative p-0">
	<header class="forsen-wiki-theme-border flex items-center justify-between border-b p-6">
		<h1 class="text-xl font-semibold lg:text-2xl">Reactions</h1>
		<Button class="ml-auto inline-flex items-center rounded-lg" on:click={cancel}>
			<XIcon />
		</Button>
	</header>

	<main class="forsen-wiki-theme-border flex max-h-screen grow flex-col overflow-hidden border-b">
		<div class="flex flex-col gap-4 overflow-y-auto p-4">
			{#each reactions as Reaction (`${Reaction.reactionKey}${Reaction.anchor}${Reaction.focus}`)}
				{@const haveReaction = Reaction.authors.find((author) => author.name === myUserName)}
				<div class="forsen-wiki-theme-border search flex items-center gap-2 border p-2">
					<Reaction.Component {...Reaction.props} class="h-12 w-auto" />

					<div class="grow">
						{#each Reaction.authors as author, index (author.rangeId)}
							<span>
								<Link href="/user/{author.id}" target="_blank">{author.name}</Link>{index <
								Reaction.authors.length - 1
									? ', '
									: ''}
							</span>
						{/each}
					</div>

					{#if haveReaction}
						<Button
							class="min-h-[unset]! min-w-[unset]! p-2!"
							onclick={() => handleDeleteReaction(haveReaction.rangeId)}
							><Trash2Icon size={16} /></Button
						>
					{/if}
				</div>
			{/each}
		</div>
	</main>
</div>
