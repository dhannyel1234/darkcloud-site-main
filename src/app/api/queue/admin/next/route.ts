import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import queueController from '@/functions/database/controllers/QueueController';

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        
        if (!session?.user?.email) {
            return NextResponse.json(
                { success: false, error: 'Não autorizado' },
                { status: 401, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Verificar se é admin
        try {
            const adminResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/admin/get?user_id=${session.user.id}`);
            if (!adminResponse.ok) {
                throw new Error('Falha ao verificar permissões de admin');
            }
            const adminData = await adminResponse.json();
            
            if (!adminData.isAdmin) {
                return NextResponse.json(
                    { success: false, error: 'Acesso negado - Apenas administradores' },
                    { status: 403, headers: { 'Content-Type': 'application/json' } }
                );
            }
        } catch (adminError) {
            console.error('Erro ao verificar admin:', adminError);
            return NextResponse.json(
                { success: false, error: 'Erro ao verificar permissões' },
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Validar o corpo da requisição
        let body;
        try {
            body = await request.json();
        } catch (parseError) {
            return NextResponse.json(
                { success: false, error: 'Corpo da requisição inválido' },
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const { ip, user, password, name, connectLink } = body;

        if (!ip || !user || !password || !name || !connectLink) {
            return NextResponse.json(
                { success: false, error: 'Dados incompletos' },
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const machineInfo = { ip, user, password, name, connectLink };

        // Obter próximo usuário da fila
        const nextUserResult = await queueController.getNextInQueue();
        if (!nextUserResult.success) {
            return NextResponse.json(
                { success: false, error: nextUserResult.message },
                { status: 404, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Ativar o usuário
        const result = await queueController.activateUser(nextUserResult.user.userId, machineInfo);
        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.message },
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        return NextResponse.json(
            { 
                success: true, 
                message: 'Usuário ativado com sucesso',
                user: {
                    name: nextUserResult.user.userName,
                    email: nextUserResult.user.userEmail,
                    plan: result.userInQueue.plan,
                    machineInfo: result.userInQueue.machineInfo
                }
            },
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('Erro ao ativar próximo usuário:', error);
        return NextResponse.json(
            { success: false, error: 'Erro interno do servidor' },
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
} 