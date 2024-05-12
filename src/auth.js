import { SvelteKitAuth } from "@auth/sveltekit"
import Twitch from "@auth/sveltekit/providers/twitch"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { AccountNotLinked } from '@auth/core/errors';

import prisma from "$lib/prisma";

/** @param {prisma} prisma @returns {import('@auth/core/adapters').Adapter} */
const MyPrismaAdapter = (prisma) => ({
	...PrismaAdapter(prisma),
	// This needs to be fixed, these "throws" return ConfigError :/
	async linkAccount(account) {
		const {  provider, providerAccountId, access_token, userId } = account;

		if (provider === 'twitch') {
			const headers = new Headers();
			headers.set('Authorization', `Bearer ${access_token}`)
			headers.set('Client-Id', process.env.AUTH_TWITCH_ID || '')
			const res = await fetch('https://api.twitch.tv/helix/users', { headers });

			/**
			 * @type {{ data: [{ created_at: string, type: '' | 'staff' | 'admin' | 'global_mod' }] }}
			 */
			const { data: [{ created_at, type }] } = await res.json();

			if (type.length) {
				await PrismaAdapter(prisma).deleteUser?.(userId);
				throw new AccountNotLinked('Your Twitch account is too special.')
			}

			const isWhitelisted = await prisma.whitelistedAccounts.findFirst({ where: { provider: provider, providerAccountId: providerAccountId } })

			if (isWhitelisted) {
				PrismaAdapter(prisma).linkAccount?.(account)
				return;
			}

			// Temporary 2 yr Twitch account creation limit
			if (new Date().getTime() - new Date(created_at).getTime() < (31_556_952_000 * 2)) {
				await PrismaAdapter(prisma).deleteUser?.(userId);
				throw new AccountNotLinked('Your Twitch account is too young.')
			}
		}

		PrismaAdapter(prisma).linkAccount?.(account)
		return;
	},
});


export const { handle, signIn, signOut } = SvelteKitAuth({
	adapter: MyPrismaAdapter(prisma),
	callbacks: {
		async session({ session, user }) {
			if (session.user) {
				session.user.id = user.id
			}

			return session
		}
	},
	pages: {
		error: '/auth-error',
	},
	events: {
		async createUser() {
			// TODO: Create user profile.
		}
	},
	providers: [Twitch],
})
