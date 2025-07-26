import { AUTH_TWITCH_ID, AUTH_TWITCH_SECRET, AUTH_TRUST_HOST } from '$env/static/private';
import { SvelteKitAuth } from '@auth/sveltekit';
import Twitch from '@auth/sveltekit/providers/twitch';
import { PrismaAdapter } from '@auth/prisma-adapter';

import prisma from '$lib/prisma';
import { AccountTooYoung } from '$lib/errors/auth/AccountTooYoung';
import { AccountIsSpecial } from '$lib/errors/auth/AccountIsSpecial';
import { NoUser } from '$lib/errors/auth/NoUser';
import { version } from '$lib/utils/version';

if (!AUTH_TWITCH_ID || !AUTH_TWITCH_SECRET) {
	console.warn(
		'Make sure AUTH_TWITCH_ID and AUTH_TWITCH_SECRET are defined in your environment file.'
	);
	process.exit(1);
}

const adapter = PrismaAdapter(prisma);

export const { handle, signIn, signOut } = SvelteKitAuth({
	trustHost: AUTH_TRUST_HOST === 'true' ? true : false,
	adapter,
	callbacks: {
		async session({ session, user }) {
			if (session.user) {
				session.user.id = user.id;
			}

			return session;
		},
	},
	pages: {
		error: '/auth-error',
	},
	events: {
		async createUser() {
			// TODO: Create user bio page.
		},
		async signIn(message) {
			const { user: { id, name } } = message;
			const newName = message.profile?.name;

			if (id && newName && newName !== name) {
				await adapter.updateUser?.({ id, name: newName });
			}
		}
	},
	providers: [
		(config) => {
			const twitch = Twitch(config);
			return {
				type: 'oauth',
				id: twitch.id,
				name: twitch.name,
				token: {
					url: `https://id.twitch.tv/oauth2/token?client_id=${AUTH_TWITCH_ID}&client_secret=${AUTH_TWITCH_SECRET}&grant_type=authorization_code`,
					params: {
						scope: '',
					},
				},
				authorization: {
					url: `https://id.twitch.tv/oauth2/authorize?response_type=code&client_id=${AUTH_TWITCH_ID}`,
					params: {
						scope: '',
					},
				},
				userinfo: {
					url: 'https://api.twitch.tv/helix/users',
					/**
					 * @param {{ tokens: { access_token: string }, provider: { id: string, userinfo: { url: string }, clientId: string } }} arg
					 */
					async request({ tokens, provider }) {
						const profiles = await fetch(provider.userinfo?.url, {
							headers: {
								Authorization: `Bearer ${tokens.access_token}`,
								'Client-Id': provider.clientId,
								'User-Agent': `forsenwiki/${version}`,
							},
						}).then(async (res) => await res.json());

						const profile = profiles?.data?.[0];
						if (!profile) {
							throw new NoUser('Could not find Twitch user');
						}

						/**
						 * @type {{ created_at: string, type: '' | 'staff' | 'admin' | 'global_mod' }}
						 */
						const { created_at, type } = profile;

						if (type.length) {
							throw new AccountIsSpecial('Your Twitch account is too special');
						}

						const isWhitelisted = await prisma.whitelistedAccounts.findFirst({
							where: {
								provider: provider.id,
								providerAccountId: profile.id,
							},
						});

						// Temporary 2 yr Twitch account creation limit
						if (
							new Date().getTime() - new Date(created_at).getTime() < 31_556_952_000 * 2 &&
							!isWhitelisted
						) {
							throw new AccountTooYoung('Your Twitch account is too young');
						}

						// https://authjs.dev/reference/core/types#profile
						return {
							id: profile.id,
							name: profile.login,
							picture: profile.profile_image_url,
						};
					},
				},
				profile: twitch.profile,
				style: twitch.style,
			};
		},
	],
});
