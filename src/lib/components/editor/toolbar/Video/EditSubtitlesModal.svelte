<script>
	import { ExternalLinkIcon, Trash2Icon, XIcon } from '@lucide/svelte';
	import Button from '#lib/components/Button.svelte';
	import { modal } from '#lib/stores/modal.js';
	import { searchRequest } from '#lib/api/search/index.js';
	import { STATIC_DOMAIN } from '#lib/environment/environment.js';
	import { uploadContentState } from '#lib/components/Search/uploadContentState.svelte.js';
	import Link from '#lib/components/Link.svelte';
	import Spinner from '#lib/components/Spinner.svelte';
	import LinkButton from '#lib/components/LinkButton.svelte';
	import Select from '#lib/components/Select.svelte';
	import { createDebouncedSearch } from '../../utils/debouncedSearch.svelte';
	import { deleteSubtitle, setSubtitles } from '../../plugins/VideoEmbed/VideoEmbed';
	import { bcp47 } from '../../plugins/VideoEmbed/bcp47';

	/**
	 * @typedef {import('../../plugins/VideoEmbed/VideoEmbed').Subtitle} Subtitle
	 * @typedef {import('#lib/api/search/index.js').SearchResult} SearchResult
	 */

	/**
	 * @typedef {Object} Props
	 * @property {string} [src]
	 * @property {Subtitle[]} [subtitles]
	 * @property {(data: import('../../plugins/VideoEmbed/VideoEmbed').VideoEmbedPayload) => void} onSubmit
	 */

	/** @type {Props} */
	let { src = $bindable(''), subtitles = $bindable([]), onSubmit } = $props();

	/** @type {Subtitle[] | undefined} */
	let newSubtitles = $state(subtitles);

	let searchQuery = $state('');

	/** @param {{ id: string, rawTitle: string, title: string }} value */
	const handleSelect = ({ id, rawTitle, title }) => {
		const fauxNode = { __subtitles: newSubtitles };

		newSubtitles = setSubtitles(fauxNode, [
			{ id, language: '', src: title, title: rawTitle },
		]).__subtitles;
	};

	/** @param {string} subtitleSrc */
	const handleDeleteSubtitle = (subtitleSrc) => {
		const fauxNode = { __subtitles: newSubtitles };

		newSubtitles = deleteSubtitle(fauxNode, subtitleSrc).__subtitles;
	};

	/**
	 * @param {HTMLSelectElement | HTMLInputElement} input
	 * @param {Subtitle} subtitle
	 */
	const handleSubtitleChange = (input, subtitle) => {
		const key = input.dataset.key || '';

		if (!['language', 'title'].includes(key)) {
			return;
		}

		const fauxNode = { __subtitles: newSubtitles };

		newSubtitles = setSubtitles(fauxNode, [{ ...subtitle, [key]: input.value }]).__subtitles;
	};

	const handleSubmit = () => {
		onSubmit({ subtitles: newSubtitles });

		$modal.isOpen = false;
	};

	const cancel = () => {
		$modal.isOpen = false;
	};

	const search = createDebouncedSearch(
		() => searchQuery,
		/** @returns {Promise<SearchResult[]>} */
		async (query, signal) => {
			const res = await searchRequest(query, ['content'], {
				signal,
				contentTypes: ['document'],
				page: 0,
				orderBy: 'desc',
			});

			if (!res.ok) {
				throw new Error(`Search failed: ${res.status}`);
			}

			return res.json();
		},
		{ initialValue: [] }
	);

	$inspect(newSubtitles);
</script>

<div class="modal-color pointer-events-auto relative p-0">
	<header class="forsen-wiki-theme-border flex items-center justify-between border-b p-6">
		<h1 class="text-xl font-semibold lg:text-2xl">Edit subtitles</h1>
		<Button class="ml-auto inline-flex items-center rounded-lg" on:click={cancel}>
			<XIcon />
		</Button>
	</header>

	<main class="forsen-wiki-theme-border flex flex-col gap-16 overflow-hidden border-b p-6">
		<figure
			class="forsen-wiki-theme-border bg-dark mx-auto flex min-h-50 min-w-50 items-center justify-center border"
		>
			{#key newSubtitles}
				<video controls crossorigin="anonymous">
					<source src="{STATIC_DOMAIN}/{src}" />
					{#each newSubtitles as subtitle (subtitle.src)}
						{@const language = bcp47.find((l) => l.lang === subtitle.language)?.label}
						<track
							srclang={subtitle.language}
							label="{subtitle.title} ({language})"
							src="{STATIC_DOMAIN}/{subtitle.src}"
							kind="subtitles"
						/>
					{/each}
				</video>
			{/key}
		</figure>

		<div>
			<div class="prose dark:prose-invert relative mt-2 flex max-w-[unset]">
				<table class="w-full table-auto">
					{#if newSubtitles?.length}
						<thead>
							<tr>
								<th></th>
								<th>Title</th>
								<th>Language</th>
								<th></th>
							</tr>
						</thead>
					{/if}
					<tbody>
						{#each newSubtitles as subtitle (subtitle.id)}
							<tr>
								<td>
									<LinkButton
										href="/content/{subtitle.id}"
										target="_blank"
										class="inline-flex items-center p-2! text-xs no-underline"
									>
										<ExternalLinkIcon size={16} />
									</LinkButton>
								</td>
								<td class="max-w-xs">
									<input
										class="input-color w-full rounded-sm p-2"
										data-key="title"
										onchange={(evt) => handleSubtitleChange(evt.currentTarget, subtitle)}
										value={subtitle.title}
									/>
								</td>
								<td class="max-w-xs">
									<Select
										class="input-color w-full rounded-sm p-2"
										data-key="language"
										onchange={(/** @type {{ currentTarget: HTMLSelectElement }} */ evt) =>
											handleSubtitleChange(evt.currentTarget, subtitle)}
										value={subtitle.language}
									>
										{#each bcp47 as language (language.lang)}
											<option value={language.lang}>{language.label}</option>
										{/each}
									</Select>
								</td>
								<td>
									<Button
										class="bg-red-600 p-2! text-sm font-bold hover:bg-red-700"
										on:click={() => handleDeleteSubtitle(subtitle.src)}
									>
										<Trash2Icon size={16} /> <span>Delete</span>
									</Button></td
								>
							</tr>
						{:else}
							<tr>
								<th><p>No subtitles added.</p></th>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>

		<div>
			<div class="flex flex-col gap-2">
				<strong>Search by name</strong>
				<input class="input-color w-full rounded-sm p-2" bind:value={searchQuery} />
			</div>

			{#if search.isSearching}
				<div class="flex grow items-center gap-2">
					<Spinner size="16" />
					<span>Searching for "{searchQuery}"...</span>
				</div>
			{:else}
				<strong>Results for "{searchQuery}"</strong>
			{/if}

			<div class="prose dark:prose-invert relative mt-2 flex max-w-[unset]">
				<table class="w-full table-auto">
					<tbody>
						{#each search.results as result (result.id)}
							{@const selected = newSubtitles?.find((s) => s.src === result.title)}
							<tr class={selected ? `bg-black/10 dark:bg-white/10` : ''}>
								<td class="max-w-xs">
									<div class="truncate">
										<Link href="/content/{result.id}" target="_blank">
											<strong>{result.rawTitle}</strong>
										</Link>
									</div>
								</td>
								<td class="max-w-xs">
									<div class="truncate">
										<span>{result.fileType}</span> <strong>({result.contentType})</strong>
									</div>
								</td>
								<td
									><Button class="min-h-0! p-2! text-xs" on:click={() => handleSelect(result)}
										>Select</Button
									>{selected ? '(Selected)' : ''}</td
								>
							</tr>
						{:else}
							<tr>
								<th><p>Found nothing.</p></th>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	</main>

	<footer class="flex items-center justify-end gap-2 p-6">
		<Button on:click={cancel}>Cancel</Button>
		<Button on:click={handleSubmit} disabled={uploadContentState.isLoading}>Submit</Button>
	</footer>
</div>
