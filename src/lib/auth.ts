import { getServerSession } from "next-auth";
// Importando as opu00e7u00f5es de autenticau00e7u00e3o do arquivo separado
import { authOptions } from "@/lib/auth-options";
import { NextAuthOptions } from 'next-auth';
import DiscordProvider from 'next-auth/providers/discord';

// Funu00e7u00e3o para obter a sessu00e3o do usu00e1rio autenticado
export const auth = async () => {
  const session = await getServerSession(authOptions);
  return session;
};

// Alias para getServerSession para manter compatibilidade
export async function getSession() {
  return await getServerSession(authOptions);
}

if (!process.env.DISCORD_CLIENT_ID) {
  throw new Error('Missing DISCORD_CLIENT_ID');
}

if (!process.env.DISCORD_CLIENT_SECRET) {
  throw new Error('Missing DISCORD_CLIENT_SECRET');
}

export const authOptions: NextAuthOptions = {
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
    }),
  ],
  pages: {
    signIn: '/',
    signOut: '/',
    error: '/',
  },
  callbacks: {
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
};