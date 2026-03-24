import { STATIC_DOMAIN } from '$lib/environment/environment';

if (!STATIC_DOMAIN) {
	throw new Error('Environment value VITE_STATIC_DOMAIN has not been set.');
}
