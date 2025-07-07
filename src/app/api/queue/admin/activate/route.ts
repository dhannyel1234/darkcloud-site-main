import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import database from '@/functions/database/database';
import Queue from '@/functions/database/schemas/QueueSchema';
import { UserPlanController } from '@/functions/database/controllers/UserPlanController';
import { QueueController } from '@/functions/database/controllers/QueueController';

export async function POST(request: NextRequest) {
    console.log('[API] /queue/admin/activate - Iniciando requisição...');
    try {
        const session = await getServerSession(authOptions);
        
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        // Verificar se é admin
        try {
            const adminResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/admin/get?user_id=${session.user.id}`);
            const adminData = await adminResponse.json();
            
            if (!adminData.isAdmin) {
                return NextResponse.json({ error: 'Acesso negado - Apenas administradores' }, { status: 403 });
            }
        } catch (adminError) {
            console.error('[API] /queue/admin/activate - Erro ao verificar admin:', adminError);
            return NextResponse.json({ error: 'Erro ao verificar permissões' }, { status: 500 });
        }

        const requestData = await request.json();
        console.log('[API] /queue/admin/activate - Dados recebidos:', requestData);

        const { planType, ip, user, password, name, connectLink } = requestData;

        // Log de cada campo individualmente
        console.log('[API] /queue/admin/activate - Campos recebidos:', {
            planType: planType || 'ausente',
            ip: ip || 'ausente',
            user: user || 'ausente',
            password: password || 'ausente',
            name: name || 'ausente',
            connectLink: connectLink || 'ausente'
        });

        if (!planType || !ip || !user || !password || !name || !connectLink) {
            const missingFields = [];
            if (!planType) missingFields.push('planType');
            if (!ip) missingFields.push('ip');
            if (!user) missingFields.push('user');
            if (!password) missingFields.push('password');
            if (!name) missingFields.push('name');
            if (!connectLink) missingFields.push('connectLink');

            return NextResponse.json({ 
                error: 'Dados incompletos', 
                missingFields 
            }, { status: 400 });
        }

        // Conectar ao banco
        await database.connect();

        // Buscar o próximo usuário da fila para o plano especificado
        const nextUser = await Queue.findOne({ 
            'plan.type': planType,
            status: 'waiting' 
        }).sort({ position: 1 });

        console.log('[API] /queue/admin/activate - Próximo usuário encontrado:', nextUser);

        if (!nextUser) {
            return NextResponse.json({ 
                error: `Não há usuários aguardando para o plano ${planType}` 
            }, { status: 404 });
        }

        // Instanciar controllers
        const userPlanController = new UserPlanController();
        const queueController = new QueueController();

        // Verificar se o plano ainda está ativo
        const hasActivePlan = await userPlanController.hasActivePlan(nextUser.userId, planType);
        console.log('[API] /queue/admin/activate - Status do plano:', { userId: nextUser.userId, planType, hasActivePlan });

        if (!hasActivePlan) {
            // Se o plano não estiver mais ativo, remove o usuário da fila
            await Queue.deleteOne({ _id: nextUser._id });
            return NextResponse.json({ 
                error: 'O usuário não possui mais um plano ativo',
                needsNextUser: true
            }, { status: 400 });
        }

        // Ativar o usuário usando o QueueController
        const result = await queueController.activateUser(nextUser.userId, { ip, user, password, name, connectLink });
        console.log('[API] /queue/admin/activate - Resultado da ativação:', result);

        if (!result.success) {
            return NextResponse.json({ error: result.message }, { status: 400 });
        }

        return NextResponse.json({ 
            success: true, 
            message: 'Usuário ativado com sucesso',
            user: {
                name: nextUser.userName,
                email: nextUser.userEmail,
                plan: nextUser.plan,
                machineInfo: { ip, user, password, name, connectLink }
            }
        });

    } catch (error) {
        console.error('[API] /queue/admin/activate - Erro ao ativar usuário:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
} 