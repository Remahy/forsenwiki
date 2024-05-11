<script>
	import { page } from '$app/stores';

	import { signIn, signOut } from '@auth/sveltekit/client';
	import Logo from '$lib/components/Logo.svelte';
	import Button from '$lib/components/Button.svelte';
	import Spinner from '$lib/components/Spinner.svelte';

	let isLoading = false;

	const signInWrapper = () => {
		isLoading = true;
		signIn('twitch', { redirect: true });
	};

	const signOutWrapper = () => {
		isLoading = true;
		signOut({ redirect: true });
	};
</script>

<header class="bg-stone-100">
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

		<nav class="flex grow items-end py-4 pr-4 lg:pr-0">
			<div class="login flex grow items-center justify-end gap-2">
				{#if $page.data.session?.user}
					<span>{$page.data.session.user.name}</span>
					<Button on:click={signOutWrapper} class="p-1 text-sm" disabled={isLoading}>
						{#if isLoading}
							<Spinner size="16" />
							<span>Logging out...</span>
						{:else}
							<span>Log out</span>
						{/if}
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
</header>
