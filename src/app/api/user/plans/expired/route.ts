import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { UserPlanController } from "@/functions/database/controllers/UserPlanController";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    // Verifica se o usuário está autenticado
    if (!session?.user) {
      return NextResponse.json(
        { error: "Não autorizado - Usuário não autenticado" },
        { status: 401 }
      );
    }

    // Verifica se o usuário tem a role admin
    const userRole = (session.user as any).role;
    if (userRole !== "admin") {
      return NextResponse.json(
        { error: "Não autorizado - Permissão insuficiente" },
        { status: 403 }
      );
    }

    const userPlanController = new UserPlanController();
    const expiredPlans = await userPlanController.getExpiredPlans();

    return NextResponse.json(expiredPlans);
  } catch (error) {
    console.error("Erro ao buscar planos expirados:", error);
    return NextResponse.json(
      { error: "Erro ao buscar planos expirados" },
      { status: 500 }
    );
  }
} 