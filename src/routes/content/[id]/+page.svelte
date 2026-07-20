<script>
	import { Trash2Icon } from '@lucide/svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';

	import { changeName, deleteContent } from '$lib/api/content';
	import Box from '$lib/components/Box.svelte';
	import Container from '$lib/components/Container.svelte';
	import Button from '$lib/components/Button.svelte';
	import RandomButton from '$lib/components/RandomButton.svelte';
	import ImagePreview from '$lib/components/content/ImagePreview.svelte';
	import VideoPreview from '$lib/components/content/VideoPreview.svelte';
	import AudioPreview from '$lib/components/content/AudioPreview.svelte';
	import { STATIC_DOMAIN } from '$lib/environment/environment';
	import DocumentPreview from '$lib/components/content/DocumentPreview.svelte';
	import Link from '$lib/components/Link.svelte';

	const id = page.params.id;

	/**
	 * @type {import('./$types').PageProps}
	 */
	let { data } = $props();

	const result = $derived(data.result);
	const hash = $derived(result.hash);
	const contentType = $derived(result.contentType);
	const contentLength = $derived(result.contentLength);
	const fileType = $derived.by(() => result.type || '');

	const metadata = $derived.by(() => {
		if (
			typeof result.metadata !== 'object' ||
			result.metadata instanceof Array ||
			!result.metadata
		) {
			return null;
		}

		return result.metadata;
	});

	const author = $derived(result.author);

	const allowModify = $derived(data.isModerator || author.name === data.session?.user?.name);

	let initialName = $derived(result.name);

	let name = $derived(initialName);

	/** @type {Error | null} */
	let error = $state(null);
	let isUpdating = $state(false);

	const updateName = async () => {
		error = null;
		isUpdating = true;

		let res;

		try {
			if (!id) {
				error = new Error('ID is unknown.');
				throw error;
			}

			if (!name || !name.length || name === result.name) {
				error = new Error('Name is unchanged or not set!');
				throw error;
			}

			res = await changeName(id, name);
		} catch (err) {
			console.error(err);
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
			if (!id) {
				error = new Error('ID is unknown.');
				throw error;
			}

			res = await deleteContent(id);
		} catch (err) {
			console.error(err);
			error = new Error(err?.toString());
		} finally {
			isUpdating = false;
		}

		if (!res) {
			return;
		}

		if (res.status === 200) {
			// eslint-disable-next-line svelte/no-navigation-without-resolve
			goto(`${resolve('/search')}?query=${result.name}`);
		} else if (res.status >= 400) {
			error = await res.json();
		}
	};

	const PreviewComponents = {
		image: {
			component: ImagePreview,
			props: () => ({
				src: `${STATIC_DOMAIN}/${hash}`,
				name,
			}),
		},
		video: {
			component: VideoPreview,
			props: () => ({
				src: `${STATIC_DOMAIN}/${hash}`,
				contentType: contentType,
			}),
		},
		audio: {
			component: AudioPreview,
			props: () => ({
				src: `${STATIC_DOMAIN}/${hash}`,
			}),
		},
		document: {
			component: DocumentPreview,
			props: () => ({
				src: `${STATIC_DOMAIN}/${hash}`,
				name,
			}),
		},
	};

	// @ts-ignore
	const SvelteComponent = $derived(fileType && PreviewComponents[fileType].component);
	// @ts-ignore
	const SvelteComponentProps = $derived(fileType && PreviewComponents[fileType].props());

	// @ts-ignore
	BigInt.prototype.toJSON = function () {
		return { $bigint: this.toString() };
	};
</script>

<svelte:head>
	<meta property="og:site_name" content="Forsen Wiki" />
	<title
		>{fileType.substring(0, 1).toUpperCase()}{fileType.substring(1)}: {name} - Uploaded user content -
		Community Forsen Wiki</title
	>

	{#if fileType === 'image'}
		<meta name="description" content="User uploaded image on forsen.wiki." />

		<meta property="og:description" content="User uploaded image on forsen.wiki." />
		<meta property="og:image" content="{STATIC_DOMAIN}/{hash}" />

		<meta name="twitter:card" content="summary_large_image" />
		<meta name="twitter:image" content="{STATIC_DOMAIN}/{hash}" />

		{#if contentType}
			<meta property="og:image:type" content={contentType} />
		{/if}
	{/if}

	{#if fileType === 'video'}
		<meta name="description" content="User uploaded video on forsen.wiki." />

		<meta property="og:description" content="User uploaded video on forsen.wiki." />
		<meta property="og:video" content="{STATIC_DOMAIN}/{hash}" />

		<meta name="twitter:card" content="player" />
		<meta name="twitter:player" content="{STATIC_DOMAIN}/{hash}" />
		<meta name="twitter:player:stream" content="{STATIC_DOMAIN}/{hash}" />

		{#if contentType}
			<meta property="og:video:type" content={contentType} />
			<meta name="twitter:player:stream:content_type" content={contentType} />
		{/if}
	{/if}

	{#if fileType === 'audio'}
		<meta name="description" content="User uploaded audio on forsen.wiki." />

		<meta property="og:description" content="User uploaded audio on forsen.wiki." />
		<meta property="og:audio" content="{STATIC_DOMAIN}/{hash}" />

		<meta name="twitter:card" content="player" />
		<meta name="twitter:player" content="{STATIC_DOMAIN}/{hash}" />
		<meta name="twitter:player:stream" content="{STATIC_DOMAIN}/{hash}" />

		{#if contentType}
			<meta property="og:audio:type" content={contentType} />
			<meta name="twitter:player:stream:content_type" content={contentType} />
		{/if}
	{/if}
</svelte:head>

<Container class="overflow-hidden">
	<RandomButton />

	{#if error}
		<Box class="flex items-center bg-red-200! p-4 text-xl font-medium dark:text-black">
			<p>{error.message}</p>
		</Box>
	{/if}

	<div class="items-start gap-8 xl:flex">
		<div class="mb-4 xl:mb-0 xl:w-fit">
			<Box class="xl:min-h-96 xl:max-w-3xl xl:min-w-96">
				{#if SvelteComponent && SvelteComponentProps}
					<SvelteComponent {...SvelteComponentProps} />
				{:else}
					<span>No preview available.</span>
				{/if}
			</Box>
		</div>

		<Box class="w-full overflow-hidden">
			<div class="flex flex-col gap-2 overflow-y-auto">
				<table class="table-auto">
					<tbody>
						<tr>
							<td class="p-4"><strong>Name</strong></td>
							{#if allowModify}
								<td class="pl-4">
									<div class="mt-0.5 mr-0.5 flex">
										<input
											bind:value={name}
											type="text"
											name="query"
											class="input-color w-full py-4 placeholder:text-inherit/25"
											placeholder={result.name}
										/>
										<Button class="rounded-none! px-4" on:click={updateName} disabled={isUpdating}
											>Save</Button
										>
									</div>
								</td>
							{:else}
								<td class="p-4">{result.name}</td>
							{/if}
						</tr>
						<tr>
							<td class="p-4"><strong>Uploader</strong></td>
							<td class="p-4"
								><Link href="/user/{author.id}" target="_blank" class="decoration-1!"
									>{author.name}</Link
								></td
							>
						</tr>
						<tr>
							<td class="p-4"><strong>Type</strong></td>
							<td class="p-4">{fileType} <strong>({contentType})</strong></td>
						</tr>
						{#if contentLength}
							<tr>
								<td class="p-4"><strong>Length</strong></td>
								<td class="p-4"
									>~{Number(contentLength / 1_048_576n).toFixed(2)} MiB ({contentLength})</td
								>
							</tr>
						{/if}
						{#if metadata}
							<tr>
								<td class="p-4"><strong>Metadata</strong></td>
								<td class="p-4 wrap-break-word">
									<details>
										<summary class="cursor-pointer">Toggle expand</summary>
										<small>
											{#if metadata.mimetype}
												<div>{metadata.mimetype}</div>
											{/if}
											{#if metadata.dimensions}
												<div>{metadata.dimensions}</div>
											{/if}
										</small>
									</details>
								</td>
							</tr>
						{/if}
						<tr>
							<td class="p-4"><strong>Created at</strong></td>
							<td class="p-4" title={new Date(result.createdTimestamp).toUTCString()}
								>{new Date(result.createdTimestamp)}</td
							>
						</tr>
						<tr>
							<td class="p-4"><strong>Hash</strong></td>
							<td class="p-4">{hash}</td>
						</tr>
						<tr>
							<td class="p-4"><strong>ID</strong></td>
							<td class="p-4">{id}</td>
						</tr>
						<tr>
							<td class="p-4"><strong>Used in</strong></td>
							<td class="p-4 wrap-break-word"
								><small><i>// TODO: Not implemented yet.</i></small></td
							>
						</tr>
						<tr>
							<td class="p-4"><strong>URL</strong></td>
							<td class="p-4 wrap-break-word">
								<Link href="{STATIC_DOMAIN}/{hash}" target="_blank">{STATIC_DOMAIN}/{hash}</Link>
							</td>
						</tr>
					</tbody>
				</table>
			</div>
		</Box>
	</div>

	{#if allowModify}
		<div>
			<Button on:click={removeContent}><Trash2Icon /> Delete</Button>
		</div>
	{/if}
</Container>
