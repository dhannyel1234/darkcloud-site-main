import { NextResponse } from "next/server";
import { UserPlanController } from "@/functions/database/controllers/UserPlanController";
import Database from "@/functions/database/database";

export async function POST(request: Request) {
  try {
    const { userId, planType } = await request.json();
    
    if (!userId || !planType) {
      return NextResponse.json(
        { error: "ID do usuário e tipo do plano são obrigatórios" },
        { status: 400 }
      );
    }

    await Database.connect();
    
    // Tentar remover o plano usando o controller
    const userPlanController = UserPlanController.getInstance();
    
    try {
      const result = await userPlanController.deletePlan(userId, planType);
      return NextResponse.json({ 
        success: true,
        message: "Plano removido com sucesso"
      });
    } catch (error) {
      if (error instanceof Error) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
      throw error; // Re-throw se não for um Error conhecido
    }
  } catch (error) {
    console.error("Erro ao remover plano:", error);
    return NextResponse.json(
      { error: "Erro interno ao tentar remover o plano" },
      { status: 500 }
    );
  }
} 