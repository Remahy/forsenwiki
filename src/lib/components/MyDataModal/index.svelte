<script>
	import Button from '../Button.svelte';
	import Link from '../Link.svelte';
	import Spinner from '../Spinner.svelte';
	import { createZip, prepareFiles } from './utils';

	/**
	 * @typedef {Object} DataProps
	 * @property {string} id
	 * @property {string} name
	 * @property {string} image
	 * @property {any[]} accounts
	 * @property {import('../../../routes/api/user/+server').Uploads} uploads
	 */

	/**
	 * @typedef {Object} Props
	 * @property {DataProps} [data]
	 */

	/** @type {Props} */
	let { data = $bindable() } = $props();

	const downloadUserData = async () => {
		const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });

		const url = URL.createObjectURL(blob);

		const a = document.createElement('a');
		a.href = url;
		a.download = `wiki_user_data_${data?.id || 'User'}_${new Date().toISOString()}.json`;

		a.click();

		URL.revokeObjectURL(url);
	};

	const chunks = $derived(prepareFiles(data?.uploads || []));

	/**
	 * @type {{ [x: string]: { files: Awaited<chunks>['chunks'][0], progress: boolean } }}
	 */
	let failedToUpload = $state({});

	/**
	 * @param {Awaited<chunks>['chunks'][0]} chunk
	 * @param {number} index
	 */
	const downloadZip = async (chunk, index) => {
		try {
			failedToUpload[index] = { files: [], progress: true };

			const { blob, failed } = await createZip(chunk);

			failedToUpload[index] = { files: failed, progress: true };

			const url = URL.createObjectURL(blob);

			const a = document.createElement('a');
			a.href = url;
			a.download = `wiki_user_content_${data?.id || 'User'}_${new Date().toISOString()}_${index}.zip`;

			a.click();

			URL.revokeObjectURL(url);

			failedToUpload[index] = { files: failed, progress: false };
		} catch (err) {
			console.error(err);
			alert('Errored while creating user data ZIP. Please contact privacy@forsen.wiki for help.');
			failedToUpload[index] = { files: [], progress: false };
		}
	};
</script>

<div class="modal-color pointer-events-auto relative p-0">
	<header class="forsen-wiki-theme-border flex items-center justify-between border-b p-6">
		<h1 class="text-xl font-semibold lg:text-2xl">My data</h1>
	</header>

	<main class="forsen-wiki-theme-border flex flex-col gap-16 overflow-hidden border-b p-6">
		<Button on:click={downloadUserData}>Download user data</Button>
		<div>
			<span class="font-bold">Uploads:</span>
			<div class="prose dark:prose-invert relative mt-2 flex max-w-[unset]">
				<table class="w-full table-auto">
					<tbody>
						{#await chunks}
							<tr>
								<th><p><Spinner /> Calculating your uploaded content...</p></th>
							</tr>
						{:then finishedChunks}
							{#if finishedChunks.failed.length}
								<tr>
									<td colspan="4">
										<div class="p-3 py-0">
											<strong
												>Some files failed to be included in chunks. Please download them manually:</strong
											>
											<ol class="ml-4.5 list-decimal">
												{#each finishedChunks.failed as file, ind (file.id)}
													<li class={ind % 2 ? 'bg-black/10 dark:bg-white/5' : ''}>
														<Link href="/content/{file.id}" target="_blank">
															<strong>{file.name} ({file.type})</strong>
														</Link>
														<span>{new Date(file.createdTimestamp)}</span>
														<Link
															class="min-h-0! p-2! text-xs"
															name={file.name}
															download={file.name}
															href={file.url}
														>
															<span>Download</span>
														</Link>
													</li>
												{/each}
											</ol>
										</div>
									</td>
								</tr>
							{/if}

							{#each finishedChunks.chunks as chunk, ind (chunk)}
								{@const totalContentLength = chunk.reduce(
									(acc, curr) => acc + curr.contentLength,
									0n
								)}
								{@const index = ind + 1}
								<tr>
									<td>#{index}</td>
									<td>{chunk.length} files</td>
									<td
										>~{Number(totalContentLength / 1_048_576n).toFixed(2)} MiB ({totalContentLength})</td
									>
									<td>
										<Button onclick={() => downloadZip(chunk, index)} disabled={failedToUpload[index]?.progress}>
											{#if failedToUpload[index]?.progress}
												<Spinner />
											{/if}
											<span>Download</span>
										</Button>
										{#if failedToUpload[index]?.files?.length}
											<div class="max-w-xs">
												<strong
													>Some files failed to compress. Please download them manually:</strong
												>
												<ol class="ml-4.5 list-decimal">
													{#each failedToUpload[index].files as file, indx2 (file.id)}
														<li class={indx2 % 2 ? 'bg-black/10 dark:bg-white/5' : ''}>
															<Link href="/content/{file.id}" target="_blank">
																<strong>{file.name} ({file.type})</strong>
															</Link>
															<span>{new Date(file.createdTimestamp)}</span>
															<Link
																class="min-h-0! p-2! text-xs"
																name={file.name}
																download={file.name}
																href={file.url}
																target="_blank"
															>
																<span>Download</span>
															</Link>
														</li>
													{/each}
												</ol>
											</div>
										{/if}
									</td>
								</tr>
							{:else}
								<tr>
									<th><p>You haven't uploaded anything.</p></th>
								</tr>
							{/each}
						{/await}
					</tbody>
				</table>
			</div>
		</div>
	</main>
</div>
