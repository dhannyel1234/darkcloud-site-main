import { NextResponse } from "next/server";
import { UserPlanController } from "@/functions/database/controllers/UserPlanController";

export async function GET() {
  try {
    const userPlanController = UserPlanController.getInstance();
    const plans = await userPlanController.getCancelledPlans();
    return NextResponse.json(plans);
  } catch (error) {
    console.error("Erro ao buscar planos cancelados:", error);
    return NextResponse.json(
      { error: "Erro ao buscar planos cancelados" },
      { status: 500 }
    );
  }
} 