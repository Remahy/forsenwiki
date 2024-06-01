<script>
	import { LogOutIcon } from 'lucide-svelte';
	import { signIn, signOut } from '@auth/sveltekit/client';
	import { page } from '$app/stores';
	import Logo from '$lib/components/Logo.svelte';
	import Button from '$lib/components/Button.svelte';
	import Spinner from '$lib/components/Spinner.svelte';
	import Search from './Search.svelte';
	import Box from './Box.svelte';
	import Link from './Link.svelte';

	let isLoading = false;

	const signInWrapper = () => {
		isLoading = true;
		signIn('twitch', { redirect: true });
	};

	const signOutWrapper = () => {
		isLoading = true;
		signOut({ redirect: true });
	};

	let cachedImage = new URL('', 'https://wsrv.nl/');

	if ($page.data.session?.user?.image) {
		cachedImage.searchParams.set('url', $page.data.session?.user?.image);
	}

	const hasSeenPrivacyUpdateNotice = globalThis?.localStorage
		? localStorage.getItem('privacy-update-june-1-2024')
		: true;
</script>

<header class="bg-stone-100 dark:bg-violet-950 dark:bg-opacity-30">
	<div class="container mx-auto flex">
		<a href="/" class="hover:text-stone-500">
			<div class="flex items-end gap-2 py-4 pl-4 lg:pl-0">
				<Logo width="64" height="64" />
				<div class="flex flex-col justify-end">
					<small>Community</small>
					<h1 class="font-semibold leading-none">Forsen<br />Wiki</h1>
				</div>
			</div>
		</a>

		<nav class="flex grow items-end overflow-hidden py-4 pr-4 lg:pr-0">
			<div class="mx-8 grow lg:mx-16"><Search /></div>

			<div class="flex items-center justify-end overflow-hidden">
				{#if $page.data.session?.user}
					<div
						class="flex max-w-20 gap-2 overflow-hidden bg-stone-300 p-2 lg:max-w-40 dark:bg-violet-950"
					>
						{#if cachedImage}
							<img
								src={cachedImage.toString()}
								class="-my-2 -ml-2 hidden h-10 w-auto lg:block"
								alt="Twitch avatar"
							/>
						{/if}
						<span
							class="overflow-hidden text-ellipsis font-medium"
							title={$page.data.session.user.name}>{$page.data.session.user.name}</span
						>
					</div>

					<Button on:click={signOutWrapper} class="rounded-l-none p-1 text-sm" disabled={isLoading}>
						<div class="hidden lg:block">
							{#if isLoading}
								<Spinner size="16" />
								<span>Logging out...</span>
							{:else}
								<span>Log out</span>
							{/if}
						</div>
						<div class="block lg:hidden">
							<LogOutIcon />
							<span class="hidden">Log out</span>
						</div>
					</Button>
				{:else}
					<Button on:click={signInWrapper} class="p-1 text-sm" disabled={isLoading}>
						{#if isLoading}
							<Spinner size="16" />
							<span>Logging in...</span>
						{:else}
							<span>Login</span><span class="-ml-1 hidden lg:inline"> with Twitch</span>
						{/if}
					</Button>
				{/if}
			</div>
		</nav>
	</div>

	{#if !hasSeenPrivacyUpdateNotice}
		<Box
			class="!rounded-none !bg-yellow-900 !bg-opacity-20 dark:!bg-yellow-300 dark:!bg-opacity-20"
		>
			<div class="container mx-auto flex py-4">
				<div class="grow">
					<p>
						<Link href="/privacy"
							>Privacy policy has been updated. Please take a moment to read it.</Link
						>
					</p>
					<p>
						<strong>Changes:</strong> Added section about Cloudflare usage, updated contact emails.
					</p>
				</div>

				<Button
					on:click={() => {
						localStorage.setItem('privacy-update-june-1-2024', 'true');
						window.location.reload();
					}}
				>
					Close
				</Button>
			</div>
		</Box>
	{/if}
</header>
