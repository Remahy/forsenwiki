import { SvelteKitAuth } from "@auth/sveltekit"
import Twitch from "@auth/sveltekit/providers/twitch"
import { PrismaAdapter } from "@auth/prisma-adapter"

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export const { handle, signIn, signOut } = SvelteKitAuth({
	adapter: PrismaAdapter(prisma),
	providers: [Twitch],
})
