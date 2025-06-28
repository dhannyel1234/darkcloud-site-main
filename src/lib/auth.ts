import { getServerSession } from "next-auth";
// Importando as opu00e7u00f5es de autenticau00e7u00e3o do arquivo separado
import { authOptions } from "@/lib/auth-options";

// Funu00e7u00e3o para obter a sessu00e3o do usu00e1rio autenticado
export const auth = async () => {
  const session = await getServerSession(authOptions);
  return session;
};

// Alias para getServerSession para manter compatibilidade
export const getSession = async () => {
  return await getServerSession(authOptions);
};