import { NextAuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import { User, Account } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
    };
  }
}

const providers = [];

// Adiciona o provedor Discord apenas se as credenciais estiverem configuradas
if (process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET) {
  providers.push(
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
    })
  );
}

// Definindo as opções de autenticação
export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers,
  callbacks: {
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.sub;
        // Adiciona a role do usuário à sessão
        session.user.role = "admin"; // Temporariamente definindo todos como admin para teste
      }
      return session;
    },
  }
};
