const base = '';
export async function signIn(provider, options, authorizationParams) {
	const { callbackUrl, ...rest } = options ?? {};
	const {
		redirect = true,
		redirectTo = callbackUrl ?? window.location.href,
		...signInParams
	} = rest;
	const baseUrl = base ?? '';
	const signInUrl = `${baseUrl}/auth/${provider === 'credentials' ? 'callback' : 'signin'}/${provider}`;
	const res = await fetch(`${signInUrl}?${new URLSearchParams(authorizationParams)}`, {
		method: 'post',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			'X-Auth-Return-Redirect': '1',
		},
		body: new URLSearchParams({
			...signInParams,
			callbackUrl: redirectTo,
		}),
	});
	const data = await res.json();
	if (redirect) {
		const url = data.url ?? redirectTo;
		window.location.href = url;
		// If url contains a hash, the browser does not reload the page. We reload manually
		if (url.includes('#')) {
			window.location.reload();
		}
		return;
	}
	const error = new URL(data.url).searchParams.get('error') ?? undefined;
	const code = new URL(data.url).searchParams.get('code') ?? undefined;
	return {
		error,
		code,
		status: res.status,
		ok: res.ok,
		url: error ? null : data.url,
	};
}

export async function signOut(options) {
	const { redirect = true, redirectTo = options?.callbackUrl ?? window.location.href } =
		options ?? {};
	const baseUrl = base ?? '';
	const res = await fetch(`${baseUrl}/auth/signout`, {
		method: 'post',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			'X-Auth-Return-Redirect': '1',
		},
		body: new URLSearchParams({
			callbackUrl: redirectTo,
		}),
	});
	const data = await res.json();
	if (redirect) {
		const url = data.url ?? redirectTo;
		window.location.href = url;
		// If url contains a hash, the browser does not reload the page. We reload manually
		if (url.includes('#')) {
			window.location.reload();
		}
		return;
	}
	return data;
}
