import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import database from "@/functions/database/database";
import { UserPlanController } from "@/functions/database/controllers/UserPlanController";

export async function GET() {
  try {
    console.log("[GET /api/plans/active] Iniciando busca de planos ativos");
    
    const session = await getServerSession(authOptions);
    console.log("[GET /api/plans/active] Sessão:", {
      hasSession: !!session,
      user: session?.user
    });
    
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    console.log("[GET /api/plans/active] Conectando ao banco de dados...");
    await database.connect();
    console.log("[GET /api/plans/active] Conexão estabelecida");

    const userPlanController = UserPlanController.getInstance();
    console.log("[GET /api/plans/active] Controller instanciado, buscando planos...");
    
    const activePlans = await userPlanController.getActivePlans();
    console.log("[GET /api/plans/active] Planos retornados:", JSON.stringify(activePlans, null, 2));
    
    return NextResponse.json(activePlans);
  } catch (error) {
    console.error("[GET /api/plans/active] Erro ao buscar planos ativos:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { userId, userName, planType, duration } = await request.json();

    if (!userId || !userName || !planType || !duration) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    // Validar tipo de plano
    if (!['alfa', 'beta', 'omega', 'elite', 'prime', 'plus'].includes(planType.toLowerCase())) {
      return NextResponse.json({ error: "Tipo de plano inválido" }, { status: 400 });
    }

    await database.connect();
    const userPlanController = UserPlanController.getInstance();

    // Verificar se o usuário já tem um plano ativo do mesmo tipo
    const hasActivePlan = await userPlanController.hasActivePlan(userId, planType);
    if (hasActivePlan) {
      return NextResponse.json({ error: "Usuário já possui um plano ativo deste tipo" }, { status: 400 });
    }

    // Calcular data de término baseado no tipo de plano
    const startDate = new Date();
    let endDate: Date;

    if (planType.toLowerCase() === 'alfa') {
      // Para Alfa, duration já está em horas
      endDate = new Date(startDate.getTime() + (duration * 60 * 60 * 1000));
    } else {
      // Para Beta, Omega, Elite, Prime, Plus, duration já está em dias
      const durationInDays = Math.floor(duration);
      const durationInMs = durationInDays * 24 * 60 * 60 * 1000;
      endDate = new Date(startDate.getTime() + durationInMs);
      if (['omega', 'elite', 'prime', 'plus'].includes(planType.toLowerCase())) {
        endDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59);
      }
    }

    // Log para debug
    console.log('DEBUG - Criação de plano:', {
      userId,
      userName,
      planType,
      duration,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      durationInMillis: planType.toLowerCase() === 'alfa' 
        ? duration * 60 * 60 * 1000 // Horas para milissegundos
        : Math.floor(duration) * 24 * 60 * 60 * 1000, // Dias para milissegundos
      endOfDay: planType.toLowerCase() === 'omega'
    });

    // Criar novo plano
    await userPlanController.create({
      userId,
      userName,
      planType,
      expiresAt: endDate,
      chargeId: 'manual-add',
      paymentValue: 0
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao adicionar plano:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Erro interno do servidor" 
    }, { status: 500 });
  }
} 