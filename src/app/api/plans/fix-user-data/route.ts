import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import UserPlan from "@/functions/database/schemas/UserPlanSchema";
import Database from "@/functions/database/database";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Verifica se o usuário está autenticado e é admin
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    await Database.connect();

    // Log para debug
    console.log("ID do Discord do usuário atual:", session.user.id);
    console.log("Nome do usuário atual:", session.user.name);

    // Encontra o plano problemático
    const problemPlan = await UserPlan.findById("68694fc15003b5d6724ef285");
    
    if (!problemPlan) {
      return NextResponse.json(
        { error: "Plano não encontrado" },
        { status: 404 }
      );
    }

    // Log do plano antes da atualização
    console.log("Plano antes da atualização:", problemPlan);

    // Atualiza o plano com os dados do usuário da sessão
    const updatedPlan = await UserPlan.findByIdAndUpdate(
      "68694fc15003b5d6724ef285",
      {
        $set: {
          userId: session.user.id,
          userName: session.user.name || "Usuário Discord"
        }
      },
      { new: true }
    );

    // Log do plano após a atualização
    console.log("Plano após a atualização:", updatedPlan);

    return NextResponse.json({
      message: "Plano atualizado com sucesso",
      plan: updatedPlan
    });

  } catch (error) {
    console.error("Erro ao corrigir dados do plano:", error);
    return NextResponse.json(
      { error: "Erro ao corrigir dados do plano" },
      { status: 500 }
    );
  }
} 