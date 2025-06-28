import { NextAuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import { User, Account, Session } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

// Definindo as opções de autenticação
export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID as string,
      clientSecret: process.env.DISCORD_CLIENT_SECRET as string,
      authorization: {
        params: {
          scope: "identify email guilds.join"
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user, account }: { user: User; account: Account | null }) {
      const guildId = process.env.DISCORD_GUILD_ID;

      if (account?.access_token) {
        await fetch(`https://discord.com/api/v10/guilds/${guildId}/members/${user.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bot ${process.env.DISCORD_BOT_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            access_token: account?.access_token
          })
        });
      }

      return true;
    },
    async session({ session, token }: { session: Session; token: any }) {
      if (session.user) {
        session.user.id = token.sub as string;
      }
      return session;
    }
  }
};
