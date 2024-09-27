<script>
	import { Trash2Icon } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { changeName, deleteContent } from '$lib/api/content';
	import { getCacheURL } from '$lib/utils/getCacheURL';
	import Box from '$lib/components/Box.svelte';
	import Container from '$lib/components/Container.svelte';
	import Button from '$lib/components/Button.svelte';

	const result = $page.data.result;
	const src = getCacheURL(result.hash, result.name).toString();
	const id = $page.params.id;

	/** @type {string} */
	let name = result.name;

	/** @type {Error | null} */
	let error = null;
	let isUpdating = false;

	const updateName = async () => {
		error = null;
		isUpdating = true;

		let res;

		try {
			if (!name || !name.length || name === result.name) {
				error = new Error('Error: Name is unchanged or not set!');
				throw error;
			}

			res = await changeName(id, name);
		} catch (err) {
			error = new Error(err?.toString());
		} finally {
			isUpdating = false;
		}

		if (!res) {
			return;
		}

		if (res.status === 200) {
			window.location.reload();
		} else if (res.status >= 400) {
			error = await res.json();
		}
	};

	const removeContent = async () => {
		error = null;
		isUpdating = true;

		let res;
		try {
			res = await deleteContent(id);
		} catch (err) {
			error = new Error(err?.toString());
		} finally {
			isUpdating = false;
		}

		if (!res) {
			return;
		}

		if (res.status === 200) {
			goto(`/search?query=${result.name}`, {});
		} else if (res.status >= 400) {
			error = await res.json();
		}
	};
</script>

<Container class="overflow-hidden">
	<div class="items-stretch gap-8 xl:flex">
		<div class="mb-4 xl:mb-0 xl:w-fit">
			<Box class="xl:min-h-96 xl:min-w-96 xl:max-w-3xl">
				<img {src} alt={result.name} class="w-fit max-w-full" />
			</Box>
		</div>

		<div class="flex grow flex-col gap-4 overflow-hidden">
			<Box class="flex flex-col gap-2 overflow-y-auto">
				<table class="table-auto">
					<tbody>
						<tr>
							<td class="p-4"><strong>Name</strong></td>
							{#if $page.data.isModerator}
								<td class="pl-4">
									<div class="flex">
										<input
											bind:value={name}
											type="text"
											name="query"
											class="w-full border-0 bg-violet-200 py-4 placeholder:text-inherit hover:bg-violet-300 dark:bg-violet-950 dark:bg-opacity-30 dark:placeholder:text-neutral-500 dark:hover:bg-violet-950 dark:hover:bg-opacity-50"
											placeholder={result.name}
										/>
										<Button class="px-4" on:click={updateName} disabled={isUpdating}>Save</Button>
									</div>
								</td>
							{:else}
								<td class="p-4">{result.name}</td>
							{/if}
						</tr>
						<tr>
							<td class="p-4"><strong>Uploader</strong></td>
							<td class="p-4">{result.author.name}</td>
						</tr>
						<tr>
							<td class="p-4"><strong>Created at</strong></td>
							<td class="p-4">{new Date(result.createdTimestamp)}</td>
						</tr>
						<tr>
							<td class="p-4"><strong>Hash</strong></td>
							<td class="p-4">{result.hash}</td>
						</tr>
						<tr>
							<td class="p-4"><strong>ID</strong></td>
							<td class="p-4">{id}</td>
						</tr>
						<tr>
							<td class="p-4"><strong>Used in</strong></td>
							<td class="break-words p-4"><small><i>// TODO: Not implemented yet.</i></small></td>
						</tr>
					</tbody>
				</table>
			</Box>
		</div>
	</div>

	{#if $page.data.isModerator || result.author.name === $page.data.session?.user?.name}
		<div>
			<Button on:click={removeContent}><Trash2Icon /> Delete</Button>
		</div>
	{/if}

	{#if error}
		<Box class="flex items-center !bg-red-200 p-4 text-xl font-medium dark:text-black">
			<p>{error.message}</p>
		</Box>
	{/if}
</Container>
