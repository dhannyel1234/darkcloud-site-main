import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import database from '@/functions/database/database';
import Queue from '@/functions/database/schemas/QueueSchema';
import { UserPlanController } from '@/functions/database/controllers/UserPlanController';

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        
        if (!session?.user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { planType } = await request.json();

        if (!planType || !['alfa', 'omega', 'beta'].includes(planType.toLowerCase())) {
            return NextResponse.json({ error: 'Tipo de plano inválido' }, { status: 400 });
        }

        // Conectar ao banco
        await database.connect();

        // Verificar se o usuário tem um plano ativo do tipo selecionado
        const userPlanController = UserPlanController.getInstance();
        const userPlan = await userPlanController.findPlan(session.user.id, planType);
        
        console.log('DEBUG - Verificação de plano ativo:', {
            userId: session.user.id,
            planType,
            userPlan
        });

        if (!userPlan) {
            return NextResponse.json({ 
                error: 'Você não possui um plano ativo deste tipo',
                needsPlan: true
            }, { status: 403 });
        }

        // Verificar se o usuário já está na fila
        const existingUser = await Queue.findOne({ 
            userId: session.user.id, 
            status: { $in: ['waiting', 'active'] } 
        });
        
        if (existingUser) {
            return NextResponse.json({ 
                error: 'Usuário já está na fila',
                position: existingUser.position,
                status: existingUser.status
            }, { status: 400 });
        }

        // Obter a próxima posição na fila considerando usuários ativos e em espera
        const lastInQueue = await Queue.findOne(
            { status: { $in: ['waiting', 'active'] } },
            {},
            { sort: { position: -1 } }
        );
        const position = lastInQueue ? lastInQueue.position + 1 : 1;

        // Calcular duração e tempo restante
        let duration = 0;
        let planName = '';
        let endTime = new Date();
        let ignoreDuration = false;

        switch (planType.toLowerCase()) {
            case 'alfa':
                // Para Alfa, usar o tempo restante do plano
                duration = 0;
                planName = 'Alfa';
                ignoreDuration = true;
                endTime = userPlan.expiresAt;
                break;
            case 'omega':
            case 'beta':
                // Para Beta e Omega, usar o tempo até a expiração do plano
                const now = new Date();
                const timeUntilExpiration = Math.max(0, userPlan.expiresAt.getTime() - now.getTime());
                duration = Math.floor(timeUntilExpiration / (60 * 1000)); // Converter para minutos
                planName = planType === 'omega' ? 'Omega' : 'Beta';
                endTime = userPlan.expiresAt;
                break;
            default:
                return NextResponse.json({ error: 'Plano inválido' }, { status: 400 });
        }

        // Criar entrada na fila
        const queueEntry = new Queue({
            userId: session.user.id,
            userName: session.user.name || 'Usuário',
            userEmail: session.user.email || '',
            userImage: session.user.image || '',
            plan: {
                name: planName,
                type: planType.toLowerCase(),
                duration: ignoreDuration ? 0 : duration,
                startTime: new Date(),
                endTime: endTime
            },
            position,
            status: 'waiting'
        });

        await queueEntry.save();

        // Se NÃO for plano Alfa, marcar como em uso na fila
        if (planType.toLowerCase() !== 'alfa') {
            await userPlanController.markAsInQueue(session.user.id, planType);
        }
        
        console.log('DEBUG - Usuário entrou na fila:', {
            userId: session.user.id,
            userName: session.user.name,
            planType,
            position,
            duration,
            endTime
        });

        return NextResponse.json({ 
            success: true, 
            message: 'Entrou na fila com sucesso', 
            position 
        });

    } catch (error) {
        console.error('Erro ao entrar na fila:', error);
        return NextResponse.json({ 
            error: error instanceof Error ? error.message : 'Erro interno do servidor'
        }, { status: 500 });
    }
} 