import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth-options';
import { UserPlanController } from '@/functions/database/controllers/UserPlanController';

export async function GET(req: NextRequest) {
  try {
    // Verificar se o usuário está autenticado
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const userId = session.user.id;
    const userPlanController = UserPlanController.getInstance();

    // Verificar planos ativos do usuário
    const hasAlfaPlan = await userPlanController.hasActivePlan(userId, 'alfa');
    const hasOmegaPlan = await userPlanController.hasActivePlan(userId, 'omega');
    const hasBetaPlan = await userPlanController.hasActivePlan(userId, 'beta');
    const hasElitePlan = await userPlanController.hasActivePlan(userId, 'elite');
    const hasPlusPlan = await userPlanController.hasActivePlan(userId, 'plus');

    const activePlans = [];
    if (hasAlfaPlan) activePlans.push({ type: 'alfa' });
    if (hasOmegaPlan) activePlans.push({ type: 'omega' });
    if (hasBetaPlan) activePlans.push({ type: 'beta' });
    if (hasElitePlan) activePlans.push({ type: 'elite' });
    if (hasPlusPlan) activePlans.push({ type: 'plus' });

    console.log('DEBUG /api/user/plans userId:', userId, 'activePlans:', activePlans);

    return NextResponse.json({
      success: true,
      plans: activePlans
    });

  } catch (error) {
    console.error('Erro ao buscar planos:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
} 