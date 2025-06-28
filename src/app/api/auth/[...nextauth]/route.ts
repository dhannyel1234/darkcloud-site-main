import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth-options";

// Criando o handler do Next-Auth
const handler = NextAuth(authOptions);

// Exportando apenas as funu00e7u00f5es de API necessarias
export { handler as GET, handler as POST };