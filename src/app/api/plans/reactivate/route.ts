import { NextResponse } from "next/server";
import { UserPlanController } from "@/functions/database/controllers/UserPlanController";
import Database from "@/functions/database/database";
import UserPlan from "@/functions/database/schemas/UserPlanSchema";

export async function POST(request: Request) {
  try {
    const { userId, planType, hours, days } = await request.json();
    
    if (!userId || !planType) {
      return NextResponse.json(
        { error: "ID do usuário e tipo do plano são obrigatórios" },
        { status: 400 }
      );
    }

    // Validar tempo para cada tipo de plano
    if (planType.toLowerCase() === 'alfa' && (!hours || hours <= 0)) {
      return NextResponse.json(
        { error: "Quantidade de horas é obrigatória para plano Alfa" },
        { status: 400 }
      );
    } else if (planType.toLowerCase() !== 'alfa' && (!days || days <= 0)) {
      return NextResponse.json(
        { error: "Quantidade de dias é obrigatória para planos Beta e Omega" },
        { status: 400 }
      );
    }

    await Database.connect();
    
    // Procurar por plano expirado ou cancelado
    const plan = await UserPlan.findOne({ 
      userId, 
      planType,
      status: { $in: ['expired', 'cancelled'] }
    });

    if (!plan) {
      return NextResponse.json(
        { error: "Plano expirado ou cancelado não encontrado" },
        { status: 404 }
      );
    }

    // Log para debug
    console.log('[reactivate] Plano encontrado:', {
      userId,
      planType,
      status: plan.status,
      expiresAt: plan.expiresAt
    });

    // Calcular nova data de expiração
    const now = new Date();
    let expiresAt;
    
    if (planType.toLowerCase() === 'alfa') {
      // Para plano Alfa, usar as horas fornecidas
      expiresAt = new Date(now.getTime() + (hours * 60 * 60 * 1000));
    } else {
      // Para outros planos, usar os dias fornecidos
      expiresAt = new Date(now.getTime() + (days * 24 * 60 * 60 * 1000));
    }

    // Reativar o plano usando o controller
    const userPlanController = UserPlanController.getInstance();
    const updatedPlan = await userPlanController.create({
      userId: plan.userId,
      userName: plan.userName,
      planType: plan.planType,
      expiresAt,
      chargeId: 'manual-add',
      paymentValue: 0
    });

    if (!updatedPlan) {
      return NextResponse.json(
        { error: "Falha ao reativar o plano" },
        { status: 500 }
      );
    }

    // Remover o plano antigo
    await UserPlan.findByIdAndDelete(plan._id);

    // Log para debug
    console.log('[reactivate] Plano reativado:', {
      userId,
      planType,
      oldStatus: plan.status,
      newStatus: 'active',
      expiresAt
    });

    return NextResponse.json({ success: true, plan: updatedPlan });
  } catch (error) {
    console.error("Erro ao reativar plano:", error);
    return NextResponse.json(
      { error: "Erro ao reativar plano" },
      { status: 500 }
    );
  }
} 