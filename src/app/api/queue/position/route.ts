import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import database from '@/functions/database/database';
import Queue from '@/functions/database/schemas/QueueSchema';
import { UserPlanController } from '@/functions/database/controllers/UserPlanController';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        
        if (!session?.user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        // Conectar ao banco
        await database.connect();

        // Buscar usuário na fila
        const userInQueue = await Queue.findOne({ 
            userId: session.user.id, 
            status: { $in: ['waiting', 'active'] } 
        }).lean();

        if (!userInQueue) {
            return NextResponse.json({ 
                success: false, 
                message: 'Usuário não está na fila' 
            });
        }

        // Verificar se o plano ainda está ativo
        const userPlanController = UserPlanController.getInstance();
        const userPlan = await userPlanController.findPlan(session.user.id, userInQueue.plan.type);
        
        if (!userPlan) {
            // Se o plano não estiver mais ativo, remove o usuário da fila
            await Queue.deleteOne({ userId: session.user.id });
            return NextResponse.json({ 
                success: false, 
                message: 'Plano expirado ou cancelado',
                needsPlan: true
            });
        }

        // Log para debug
        console.log('DEBUG - Dados do plano:', {
            userId: session.user.id,
            planType: userInQueue.plan.type,
            expiresAt: userPlan.expiresAt?.toISOString(),
            now: new Date().toISOString(),
            planDuration: userInQueue.plan.duration,
            timeLeftMs: userPlan.expiresAt ? userPlan.expiresAt.getTime() - new Date().getTime() : null,
            alfaTimeLeftMs: userPlan.alfaTimeLeftMs
        });

        // Para planos não-Alfa, calcular o tempo restante
        let endTime = userPlan.expiresAt;
        let alfaTimeLeftMs = null;

        if (userInQueue.plan.type.toLowerCase() === 'alfa') {
            // Para planos Alfa, usar o alfaTimeLeftMs
            alfaTimeLeftMs = userPlan.alfaTimeLeftMs;
            // Se estiver na fila, não descontar o tempo
            if (userInQueue.status === 'waiting') {
                endTime = null;
            }
        } else if (endTime) {
            // Para outros planos, calcular baseado na data de expiração
            const timeLeft = Math.max(0, endTime.getTime() - new Date().getTime());
            endTime = new Date(new Date().getTime() + timeLeft);
        }

        // Calcular posição dinâmica na fila
        let dynamicPosition = userInQueue.position;
        if (userInQueue.status === 'waiting') {
            dynamicPosition = await Queue.countDocuments({
                status: 'waiting',
                'plan.type': userInQueue.plan.type,
                position: { $lt: userInQueue.position }
            }) + 1;
        }

        return NextResponse.json({ 
            success: true, 
            position: dynamicPosition,
            status: userInQueue.status,
            plan: {
                ...userInQueue.plan,
                endTime,
                duration: userInQueue.plan.duration,
                alfaTimeLeftMs
            },
            machineInfo: userInQueue.machineInfo
        });

    } catch (error) {
        console.error('Erro ao obter posição na fila:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
} 