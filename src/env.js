import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	AUTH_TWITCH_ID: { static: true },
	AUTH_TWITCH_SECRET: { static: true },
	AUTH_TRUST_HOST: { static: true },
	AUTH_SECRET: { static: true },
	CLOUDFLARE_API_TOKEN: { static: true },
	CLOUDFLARE_ZONE_ID: { static: true },
	GOATCOUNTER_API_KEY: { static: true },
	GOATCOUNTER_DISABLED: { static: true },
	CLOUDFLARE_R2_SECRET_ACCESS_KEY: { static: true },
	DATABASE_URL: { static: true },
	CLOUDFLARE_R2_ACCESS_KEY_ID: { static: true },
	CLOUDFLARE_R2_BUCKET_NAME: { static: true },
	CLOUDFLARE_R2_ENDPOINT: { static: true },
});
