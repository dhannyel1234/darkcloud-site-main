import { NextResponse } from "next/server";
import { UserPlanController } from "@/functions/database/controllers/UserPlanController";

export async function GET() {
  try {
    const controller = new UserPlanController();
    const activePlans = await controller.getActivePlans();
    const expiredPlans = await controller.getExpiredPlans();
    const cancelledPlans = await controller.getCancelledPlans();

    return NextResponse.json({
      active: activePlans,
      expired: expiredPlans,
      cancelled: cancelledPlans
    });
  } catch (error) {
    console.error("Erro ao buscar planos:", error);
    return NextResponse.json(
      { error: "Erro ao buscar planos" },
      { status: 500 }
    );
  }
} 